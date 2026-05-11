# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from dataclasses import dataclass

from genlayer import *


ERROR_EXPECTED = "[EXPECTED]"
MAX_NOTE_CHARS = 160
MAX_ESCROW_LOG = 80


def clean_note(value: str) -> str:
    return value.strip()[:MAX_NOTE_CHARS]


def to_address(value) -> Address:
    if isinstance(value, Address):
        return value
    return Address(value)


def is_zero_address(address: Address) -> bool:
    return format(address).lower() == "0x0000000000000000000000000000000000000000"


@gl.contract_interface
class GenOSInterface:
    class View:
        def can_release(self, execution_id: int) -> bool: ...

    class Write:
        def record_settlement(self, execution_id: int, settlement_tx: str): ...


@gl.evm.contract_interface
class NativeRecipient:
    class View:
        pass

    class Write:
        pass


@allow_storage
@dataclass
class EscrowRecord:
    execution_id: u256
    depositor: Address
    recipient: Address
    amount: u256
    status: str
    created_at: str
    released_at: str
    refunded_at: str
    note: str


@allow_storage
@dataclass
class EscrowEvent:
    timestamp: str
    actor: Address
    execution_id: u256
    action: str
    amount: u256
    details: str


class GenOSEscrow(gl.Contract):
    admin: Address
    gen_os_address: Address
    escrows: TreeMap[u256, EscrowRecord]
    escrow_ids: DynArray[u256]
    escrow_log: DynArray[EscrowEvent]
    total_locked: u256
    total_released: u256
    total_refunded: u256

    def __init__(self, admin_address: Address, gen_os_address: Address):
        self.admin = to_address(admin_address)
        self.gen_os_address = to_address(gen_os_address)
        self.escrow_ids = []
        self.escrow_log = []
        self.total_locked = u256(0)
        self.total_released = u256(0)
        self.total_refunded = u256(0)

    def _require_admin(self):
        if gl.message.sender_address != self.admin:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Only admin can perform this action")

    def _require_escrow(self, execution_id: int) -> u256:
        key = u256(execution_id)
        if key not in self.escrows:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Escrow does not exist")
        return key

    def _append_log(self, actor: Address, execution_id: u256, action: str, amount: u256, details: str):
        log = self.escrow_log
        log.append(
            EscrowEvent(
                timestamp=gl.message_raw["datetime"],
                actor=actor,
                execution_id=execution_id,
                action=action,
                amount=amount,
                details=clean_note(details),
            )
        )
        while len(log) > MAX_ESCROW_LOG:
            log.pop(0)
        self.escrow_log = log

    def _escrow_to_dict(self, escrow: EscrowRecord) -> dict:
        return {
            "execution_id": int(escrow.execution_id),
            "depositor": format(escrow.depositor),
            "recipient": format(escrow.recipient),
            "amount": int(escrow.amount),
            "status": escrow.status,
            "created_at": escrow.created_at,
            "released_at": escrow.released_at,
            "refunded_at": escrow.refunded_at,
            "note": escrow.note,
        }

    @gl.public.write
    def admin_update_gen_os_address(self, gen_os_address: Address):
        self._require_admin()
        self.gen_os_address = to_address(gen_os_address)
        self._append_log(
            gl.message.sender_address,
            u256(0),
            "GENOS_UPDATED",
            u256(0),
            format(self.gen_os_address),
        )

    @gl.public.write.payable
    def fund_execution(self, execution_id: int, recipient_address: Address, note: str):
        if int(gl.message.value) <= 0:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Deposit value must be greater than zero")

        key = u256(execution_id)
        if key in self.escrows:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Escrow already exists for execution")

        recipient = to_address(recipient_address)
        if is_zero_address(recipient):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Recipient cannot be zero address")

        amount = u256(int(gl.message.value))
        escrow = EscrowRecord(
            execution_id=key,
            depositor=gl.message.sender_address,
            recipient=recipient,
            amount=amount,
            status="funded",
            created_at=gl.message_raw["datetime"],
            released_at="",
            refunded_at="",
            note=clean_note(note),
        )

        self.escrows[key] = escrow
        self.escrow_ids.append(key)
        self.total_locked = u256(int(self.total_locked) + int(amount))
        self._append_log(gl.message.sender_address, key, "FUNDED", amount, escrow.note)

    @gl.public.write
    def release_execution(self, execution_id: int):
        key = self._require_escrow(execution_id)
        escrow = self.escrows[key]

        if escrow.status != "funded":
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Escrow is not funded")

        gen_os = GenOSInterface(self.gen_os_address)
        if not gen_os.view().can_release(execution_id):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} GenOS has not approved release")

        escrow.status = "released"
        escrow.released_at = gl.message_raw["datetime"]
        self.escrows[key] = escrow

        self.total_locked = u256(int(self.total_locked) - int(escrow.amount))
        self.total_released = u256(int(self.total_released) + int(escrow.amount))

        NativeRecipient(escrow.recipient).emit_transfer(value=escrow.amount)
        gen_os.emit(on="finalized").record_settlement(
            execution_id,
            f"native_gen_release:{format(escrow.recipient)}:{int(escrow.amount)}",
        )
        self._append_log(gl.message.sender_address, key, "RELEASED", escrow.amount, "Released after GenOS approval")

    @gl.public.write
    def refund_execution(self, execution_id: int, reason: str):
        key = self._require_escrow(execution_id)
        escrow = self.escrows[key]

        if escrow.status != "funded":
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Escrow is not funded")
        if gl.message.sender_address != escrow.depositor and gl.message.sender_address != self.admin:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Only depositor or admin can refund")

        gen_os = GenOSInterface(self.gen_os_address)
        if gen_os.view().can_release(execution_id) and gl.message.sender_address != self.admin:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Approved execution cannot be refunded by depositor")

        escrow.status = "refunded"
        escrow.refunded_at = gl.message_raw["datetime"]
        self.escrows[key] = escrow

        self.total_locked = u256(int(self.total_locked) - int(escrow.amount))
        self.total_refunded = u256(int(self.total_refunded) + int(escrow.amount))

        NativeRecipient(escrow.depositor).emit_transfer(value=escrow.amount)
        self._append_log(gl.message.sender_address, key, "REFUNDED", escrow.amount, reason)

    @gl.public.view
    def get_admin(self) -> str:
        return format(self.admin)

    @gl.public.view
    def get_gen_os_address(self) -> str:
        return format(self.gen_os_address)

    @gl.public.view
    def get_escrow_count(self) -> int:
        return len(self.escrow_ids)

    @gl.public.view
    def get_escrow_ids(self) -> list:
        result = []
        for escrow_id in self.escrow_ids:
            result.append(int(escrow_id))
        return result

    @gl.public.view
    def get_escrow(self, execution_id: int) -> dict:
        key = self._require_escrow(execution_id)
        return self._escrow_to_dict(self.escrows[key])

    @gl.public.view
    def can_release(self, execution_id: int) -> bool:
        key = self._require_escrow(execution_id)
        escrow = self.escrows[key]
        if escrow.status != "funded":
            return False
        return GenOSInterface(self.gen_os_address).view().can_release(execution_id)

    @gl.public.view
    def get_totals(self) -> dict:
        return {
            "total_locked": int(self.total_locked),
            "total_released": int(self.total_released),
            "total_refunded": int(self.total_refunded),
            "native_balance": int(self.balance),
        }

    @gl.public.view
    def get_escrow_log(self) -> list:
        result = []
        for event in self.escrow_log:
            result.append(
                {
                    "timestamp": event.timestamp,
                    "actor": format(event.actor),
                    "execution_id": int(event.execution_id),
                    "action": event.action,
                    "amount": int(event.amount),
                    "details": event.details,
                }
            )
        return result
