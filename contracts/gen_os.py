# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from dataclasses import dataclass
import json
import typing

from genlayer import *


MAX_TITLE_CHARS = 96
MAX_POLICY_CHARS = 2800
MAX_DESCRIPTION_CHARS = 1600
MAX_REASON_CHARS = 240
MAX_EVIDENCE_URLS = 6
MAX_EVIDENCE_URL_CHARS = 220
MAX_PAGE_CHARS = 5000
MAX_AUDIT_EVENTS = 80
WEI_PER_GEN = 1000000000000000000
ERROR_EXPECTED = "[EXPECTED]"
ERROR_EXTERNAL = "[EXTERNAL]"


def strip_code_fences(value: str) -> str:
    return value.replace("```json", "").replace("```", "").strip()


def parse_prompt_json(raw_response: typing.Any) -> dict:
    if isinstance(raw_response, str):
        return json.loads(strip_code_fences(raw_response))
    return raw_response


def clean_text(value: str, max_length: int) -> str:
    return value.strip()[:max_length]


def to_address(value: typing.Any) -> Address:
    if isinstance(value, Address):
        return value
    return Address(value)


def require_text(value: str, field_name: str, max_length: int) -> str:
    cleaned = clean_text(value, max_length)
    if cleaned == "":
        raise gl.vm.UserError(f"{ERROR_EXPECTED} {field_name} is required")
    return cleaned


def parse_csv_lines(value: str) -> list:
    result = []
    for raw_item in value.replace("\n", ",").split(","):
        item = raw_item.strip()
        if item != "" and item not in result:
            result.append(item)
    return result


def serialize_lines(items: list) -> str:
    return "\n".join(items)


def validate_urls(urls_csv: str) -> str:
    urls = parse_csv_lines(urls_csv)
    if len(urls) == 0:
        raise gl.vm.UserError(f"{ERROR_EXPECTED} At least one evidence URL is required")
    if len(urls) > MAX_EVIDENCE_URLS:
        raise gl.vm.UserError(f"{ERROR_EXPECTED} Too many evidence URLs")

    for url in urls:
        if len(url) > MAX_EVIDENCE_URL_CHARS:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Evidence URL is too long")
        if " " in url:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Evidence URL cannot contain spaces")
        if not (url.startswith("https://") or url.startswith("http://")):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Evidence URL must start with http:// or https://")

    return serialize_lines(urls)


def normalize_bool(value: typing.Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        return lowered in ["true", "yes", "approved", "pass"]
    return bool(value)


def normalize_action(value: str, approved: bool) -> str:
    action = value.strip().lower()
    if action not in ["release_payment", "hold_funds", "manual_review"]:
        return "release_payment" if approved else "hold_funds"
    return action


def normalize_verdict(raw_response: typing.Any) -> dict:
    parsed = parse_prompt_json(raw_response)
    approved = normalize_bool(parsed.get("approved", False))
    risk_level = int(parsed.get("risk_level", 4))
    risk_level = max(0, min(4, risk_level))
    required_action = normalize_action(str(parsed.get("required_action", "")), approved)
    reason = clean_text(str(parsed.get("reason", "No reason provided")), MAX_REASON_CHARS)
    evidence_summary = clean_text(str(parsed.get("evidence_summary", "")), MAX_REASON_CHARS)

    if approved and required_action != "release_payment":
        approved = False
    if risk_level >= 4 and approved:
        approved = False
        required_action = "hold_funds"

    return {
        "approved": approved,
        "risk_level": risk_level,
        "required_action": required_action,
        "reason": reason,
        "evidence_summary": evidence_summary,
    }


def risk_distance_is_acceptable(leader_risk: int, validator_risk: int) -> bool:
    distance = leader_risk - validator_risk
    if distance < 0:
        distance = distance * -1
    return distance <= 1


@allow_storage
@dataclass
class MandateRecord:
    id: u256
    creator: Address
    operator: Address
    title: str
    policy_text: str
    rules_csv: str
    risk_threshold: u8
    max_per_execution: u256
    total_budget: u256
    spent: u256
    vault_address: str
    status: str
    created_at: str
    expires_at: str
    execution_count: u256


@allow_storage
@dataclass
class ExecutionRecord:
    id: u256
    mandate_id: u256
    requester: Address
    recipient: Address
    amount: u256
    description: str
    evidence_urls_csv: str
    status: str
    risk_level: u8
    required_action: str
    verdict_reason: str
    evidence_summary: str
    submitted_at: str
    evaluated_at: str
    settlement_tx: str


@allow_storage
@dataclass
class AuditEvent:
    timestamp: str
    actor: Address
    action: str
    target_id: u256
    result: str
    details: str


class GenOS(gl.Contract):
    admin: Address
    settlement_router: Address
    mandates: TreeMap[u256, MandateRecord]
    executions: TreeMap[u256, ExecutionRecord]
    mandate_executions: TreeMap[u256, DynArray[u256]]
    audit_log: DynArray[AuditEvent]
    next_mandate_id: u256
    next_execution_id: u256

    def __init__(self, admin_address: Address, settlement_router: Address):
        self.admin = to_address(admin_address)
        self.settlement_router = to_address(settlement_router)
        self.next_mandate_id = u256(0)
        self.next_execution_id = u256(0)
        self.audit_log = []

    def _require_admin(self):
        if gl.message.sender_address != self.admin:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Only admin can perform this action")

    def _require_mandate(self, mandate_id: int) -> u256:
        key = u256(mandate_id)
        if key not in self.mandates:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Mandate does not exist")
        return key

    def _require_execution(self, execution_id: int) -> u256:
        key = u256(execution_id)
        if key not in self.executions:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Execution does not exist")
        return key

    def _append_audit(self, actor: Address, action: str, target_id: u256, result: str, details: str):
        log = self.audit_log
        log.append(
            AuditEvent(
                timestamp=gl.message_raw["datetime"],
                actor=actor,
                action=action,
                target_id=target_id,
                result=result,
                details=clean_text(details, MAX_REASON_CHARS),
            )
        )
        while len(log) > MAX_AUDIT_EVENTS:
            log.pop(0)
        self.audit_log = log

    def _mandate_to_dict(self, mandate: MandateRecord) -> dict:
        return {
            "id": int(mandate.id),
            "creator": format(mandate.creator),
            "operator": format(mandate.operator),
            "title": mandate.title,
            "policy_text": mandate.policy_text,
            "rules": parse_csv_lines(mandate.rules_csv),
            "risk_threshold": int(mandate.risk_threshold),
            "max_per_execution": int(mandate.max_per_execution),
            "total_budget": int(mandate.total_budget),
            "spent": int(mandate.spent),
            "vault_address": mandate.vault_address,
            "status": mandate.status,
            "created_at": mandate.created_at,
            "expires_at": mandate.expires_at,
            "execution_count": int(mandate.execution_count),
        }

    def _execution_to_dict(self, execution: ExecutionRecord) -> dict:
        return {
            "id": int(execution.id),
            "mandate_id": int(execution.mandate_id),
            "requester": format(execution.requester),
            "recipient": format(execution.recipient),
            "amount": int(execution.amount),
            "description": execution.description,
            "evidence_urls": parse_csv_lines(execution.evidence_urls_csv),
            "status": execution.status,
            "risk_level": int(execution.risk_level),
            "required_action": execution.required_action,
            "verdict_reason": execution.verdict_reason,
            "evidence_summary": execution.evidence_summary,
            "submitted_at": execution.submitted_at,
            "evaluated_at": execution.evaluated_at,
            "settlement_tx": execution.settlement_tx,
        }

    @gl.public.write
    def create_mandate(
        self,
        operator_address: str,
        title: str,
        policy_text: str,
        rules_csv: str,
        risk_threshold: int,
        max_per_execution: int,
        total_budget: int,
        expires_at: str,
        vault_address: str,
    ):
        if risk_threshold < 0 or risk_threshold > 4:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Risk threshold must be between 0 and 4")
        if max_per_execution <= 0 or total_budget <= 0:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Budgets must be positive")
        if max_per_execution > total_budget:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Max per execution cannot exceed total budget")

        mandate_id = self.next_mandate_id
        mandate = MandateRecord(
            id=mandate_id,
            creator=gl.message.sender_address,
            operator=Address(operator_address),
            title=require_text(title, "Mandate title", MAX_TITLE_CHARS),
            policy_text=require_text(policy_text, "Policy text", MAX_POLICY_CHARS),
            rules_csv=serialize_lines(parse_csv_lines(rules_csv)),
            risk_threshold=u8(risk_threshold),
            max_per_execution=u256(max_per_execution),
            total_budget=u256(total_budget),
            spent=u256(0),
            vault_address=clean_text(vault_address, MAX_EVIDENCE_URL_CHARS),
            status="active",
            created_at=gl.message_raw["datetime"],
            expires_at=clean_text(expires_at, 64),
            execution_count=u256(0),
        )

        self.mandates[mandate_id] = mandate
        self.mandate_executions[mandate_id] = []
        self.next_mandate_id = u256(int(mandate_id) + 1)
        self._append_audit(gl.message.sender_address, "MANDATE_CREATED", mandate_id, "created", mandate.title)

    @gl.public.write
    def submit_execution(
        self,
        mandate_id: int,
        recipient_address: str,
        amount: int,
        description: str,
        evidence_urls_csv: str,
    ):
        mandate_key = self._require_mandate(mandate_id)
        mandate = self.mandates[mandate_key]

        if mandate.status != "active":
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Mandate is not active")
        if amount <= 0:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Amount must be positive")
        if amount > int(mandate.max_per_execution):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Amount exceeds max per execution")
        if int(mandate.spent) + amount > int(mandate.total_budget):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Amount exceeds remaining mandate budget")

        execution_id = self.next_execution_id
        execution = ExecutionRecord(
            id=execution_id,
            mandate_id=mandate_key,
            requester=gl.message.sender_address,
            recipient=Address(recipient_address),
            amount=u256(amount),
            description=require_text(description, "Execution description", MAX_DESCRIPTION_CHARS),
            evidence_urls_csv=validate_urls(evidence_urls_csv),
            status="pending",
            risk_level=u8(4),
            required_action="manual_review",
            verdict_reason="Awaiting GenLayer evaluation",
            evidence_summary="",
            submitted_at=gl.message_raw["datetime"],
            evaluated_at="",
            settlement_tx="",
        )

        self.executions[execution_id] = execution

        linked_executions = self.mandate_executions[mandate_key]
        linked_executions.append(execution_id)
        self.mandate_executions[mandate_key] = linked_executions

        mandate.execution_count = u256(int(mandate.execution_count) + 1)
        self.mandates[mandate_key] = mandate

        self.next_execution_id = u256(int(execution_id) + 1)
        self._append_audit(gl.message.sender_address, "EXECUTION_SUBMITTED", execution_id, "pending", execution.description)

    @gl.public.write
    def evaluate_execution(self, execution_id: int):
        execution_key = self._require_execution(execution_id)
        execution = self.executions[execution_key]

        if execution.status != "pending":
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Execution is not pending")

        mandate_key = execution.mandate_id
        mandate = self.mandates[mandate_key]
        mandate_memory = gl.storage.copy_to_memory(mandate)
        execution_memory = gl.storage.copy_to_memory(execution)

        policy_title = mandate_memory.title
        policy_text = mandate_memory.policy_text
        rules_text = mandate_memory.rules_csv
        risk_threshold = int(mandate_memory.risk_threshold)
        max_per_execution = int(mandate_memory.max_per_execution)
        remaining_budget = int(mandate_memory.total_budget) - int(mandate_memory.spent)
        execution_description = execution_memory.description
        execution_amount = int(execution_memory.amount)
        evidence_urls = parse_csv_lines(execution_memory.evidence_urls_csv)
        tx_timestamp = gl.message_raw["datetime"]

        def leader_fn():
            evidence_bundle = ""
            for index, url in enumerate(evidence_urls):
                response = gl.nondet.web.get(url)
                page_content = response.body.decode("utf-8", errors="replace")[:MAX_PAGE_CHARS]
                evidence_bundle += f"\n\nSOURCE {index + 1}: {url}\n{page_content}"

            prompt = f"""You are a GenOS policy validator deciding whether an escrowed execution request can be released.

Mandate title:
{policy_title}

Natural-language mandate:
{policy_text}

Policy rules:
{rules_text}

Budget constraints:
- Execution amount: {execution_amount} GEN
- Max per execution: {max_per_execution} GEN
- Remaining mandate budget: {remaining_budget} GEN
- Reject if risk level is greater than {risk_threshold}

Execution request:
{execution_description}

Evidence pages:
{evidence_bundle}

Decision rules:
- Approve only when the evidence proves the work satisfies the mandate.
- Reject unrelated, stale, private, unverifiable, or insufficient evidence.
- Do not infer success from marketing language alone.
- If evidence is ambiguous, use manual_review and approved=false.
- risk_level must be an integer from 0 to 4.

Respond with JSON only:
{{
  "approved": false,
  "risk_level": 4,
  "required_action": "hold_funds",
  "reason": "One concise reason.",
  "evidence_summary": "One concise evidence summary."
}}"""

            raw_response = gl.nondet.exec_prompt(prompt, response_format="json")
            return normalize_verdict(raw_response)

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False

            try:
                leader_data = normalize_verdict(leader_result.calldata)
                validator_data = leader_fn()
            except (AttributeError, TypeError, ValueError, KeyError, json.JSONDecodeError):
                return False

            return (
                leader_data["approved"] == validator_data["approved"]
                and leader_data["required_action"] == validator_data["required_action"]
                and risk_distance_is_acceptable(
                    int(leader_data["risk_level"]),
                    int(validator_data["risk_level"]),
                )
            )

        try:
            verdict = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        except (AttributeError, TypeError, ValueError, KeyError, json.JSONDecodeError):
            raise gl.vm.UserError(f"{ERROR_EXTERNAL} GenLayer evaluation failed")

        approved = bool(verdict["approved"])
        risk_level = int(verdict["risk_level"])
        required_action = str(verdict["required_action"])

        if risk_level > risk_threshold:
            approved = False
            required_action = "hold_funds"

        if approved:
            execution.status = "approved"
            mandate.spent = u256(int(mandate.spent) + int(execution.amount))
            audit_result = "approved"
        else:
            execution.status = "rejected"
            audit_result = "rejected"

        execution.risk_level = u8(risk_level)
        execution.required_action = required_action
        execution.verdict_reason = clean_text(str(verdict["reason"]), MAX_REASON_CHARS)
        execution.evidence_summary = clean_text(str(verdict["evidence_summary"]), MAX_REASON_CHARS)
        execution.evaluated_at = tx_timestamp

        self.executions[execution_key] = execution
        self.mandates[mandate_key] = mandate
        self._append_audit(gl.message.sender_address, "GENLAYER_VERDICT", execution_key, audit_result, execution.verdict_reason)

    @gl.public.write
    def admin_pause_mandate(self, mandate_id: int, reason: str):
        self._require_admin()
        mandate_key = self._require_mandate(mandate_id)
        mandate = self.mandates[mandate_key]
        mandate.status = "paused"
        self.mandates[mandate_key] = mandate
        self._append_audit(gl.message.sender_address, "MANDATE_PAUSED", mandate_key, "paused", reason)

    @gl.public.write
    def admin_resume_mandate(self, mandate_id: int, reason: str):
        self._require_admin()
        mandate_key = self._require_mandate(mandate_id)
        mandate = self.mandates[mandate_key]
        mandate.status = "active"
        self.mandates[mandate_key] = mandate
        self._append_audit(gl.message.sender_address, "MANDATE_RESUMED", mandate_key, "active", reason)

    @gl.public.write
    def admin_update_settlement_router(self, settlement_router: Address):
        self._require_admin()
        self.settlement_router = to_address(settlement_router)
        self._append_audit(
            gl.message.sender_address,
            "SETTLEMENT_ROUTER_UPDATED",
            u256(0),
            "updated",
            format(self.settlement_router),
        )

    @gl.public.write
    def record_settlement(self, execution_id: int, settlement_tx: str):
        execution_key = self._require_execution(execution_id)
        execution = self.executions[execution_key]

        if execution.status != "approved":
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Execution is not approved")
        sender = gl.message.sender_address
        if (
            sender != execution.requester
            and sender != self.admin
            and sender != self.settlement_router
        ):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Only requester, router, or admin can record settlement")

        execution.status = "released"
        execution.settlement_tx = clean_text(settlement_tx, MAX_EVIDENCE_URL_CHARS)
        self.executions[execution_key] = execution
        self._append_audit(gl.message.sender_address, "PAYMENT_RELEASED", execution_key, "released", execution.settlement_tx)

    @gl.public.view
    def get_admin(self) -> str:
        return format(self.admin)

    @gl.public.view
    def get_settlement_router(self) -> str:
        return format(self.settlement_router)

    @gl.public.view
    def get_mandate_count(self) -> int:
        return int(self.next_mandate_id)

    @gl.public.view
    def get_execution_count(self) -> int:
        return int(self.next_execution_id)

    @gl.public.view
    def get_mandate(self, mandate_id: int) -> dict:
        mandate_key = self._require_mandate(mandate_id)
        return self._mandate_to_dict(self.mandates[mandate_key])

    @gl.public.view
    def get_execution(self, execution_id: int) -> dict:
        execution_key = self._require_execution(execution_id)
        return self._execution_to_dict(self.executions[execution_key])

    @gl.public.view
    def get_execution_amount_wei(self, execution_id: int) -> int:
        execution_key = self._require_execution(execution_id)
        execution = self.executions[execution_key]
        return int(execution.amount) * WEI_PER_GEN

    @gl.public.view
    def get_execution_recipient(self, execution_id: int) -> str:
        execution_key = self._require_execution(execution_id)
        execution = self.executions[execution_key]
        return format(execution.recipient)

    @gl.public.view
    def get_mandate_executions(self, mandate_id: int) -> list:
        mandate_key = self._require_mandate(mandate_id)
        result = []
        for execution_id in self.mandate_executions[mandate_key]:
            result.append(int(execution_id))
        return result

    @gl.public.view
    def can_release(self, execution_id: int) -> bool:
        execution_key = self._require_execution(execution_id)
        execution = self.executions[execution_key]
        return execution.status == "approved" and execution.required_action == "release_payment"

    @gl.public.view
    def get_audit_log(self) -> list:
        result = []
        for event in self.audit_log:
            result.append(
                {
                    "timestamp": event.timestamp,
                    "actor": format(event.actor),
                    "action": event.action,
                    "target_id": int(event.target_id),
                    "result": event.result,
                    "details": event.details,
                }
            )
        return result

    @gl.public.view
    def get_full_state(self) -> dict:
        return {
            "admin": format(self.admin),
            "settlement_router": format(self.settlement_router),
            "mandate_count": int(self.next_mandate_id),
            "execution_count": int(self.next_execution_id),
            "audit_count": len(self.audit_log),
        }
