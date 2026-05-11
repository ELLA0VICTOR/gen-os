# GEN//OS

GEN//OS is a GenLayer-powered spend governance layer for AI agents, DAO operators, and delegated wallets.

The project lets a user define a natural-language mandate, submit an execution request with public evidence URLs, and have a GenLayer Intelligent Contract evaluate whether escrowed funds should be released, held, or escalated.

## Why GenLayer

Normal smart contracts are good at deterministic accounting, but weak at interpreting messy real-world work evidence. GEN//OS uses GenLayer for the part that needs judgment:

- Fetch public evidence pages.
- Compare the evidence against a natural-language mandate.
- Score risk from 0 to 4.
- Decide whether the action satisfies the policy.
- Record the result on-chain as an auditable verdict.

## Current Build

- React 19 + Vite + TypeScript frontend.
- Plain CSS custom-property design system, no UI library.
- Custom inline SVG icon system.
- Responsive command-center routes for dashboard, mandates, executions, evidence, audit, and vault.
- GenLayer Intelligent Contract in `contracts/gen_os.py`.
- Live Bradbury reads through `genlayer-js`.
- Browser-wallet signed writes for mandate creation, execution submission, escrow funding, evidence evaluation, and escrow release.
- Native GEN amount model: a `1 GEN` execution requires exactly `1 GEN` escrow funding, then releases or refunds exactly that amount.
- Bradbury-first network configuration.

## GenLayer Contracts

Core contract: `GenOS`

Constructor:

```text
admin_address: string
settlement_router: string
```

Write methods:

- `create_mandate(...)`
- `submit_execution(...)`
- `evaluate_execution(execution_id)`
- `admin_pause_mandate(mandate_id, reason)`
- `admin_resume_mandate(mandate_id, reason)`
- `admin_update_settlement_router(settlement_router)`
- `record_settlement(execution_id, settlement_tx)`

Read methods:

- `get_admin()`
- `get_settlement_router()`
- `get_mandate_count()`
- `get_execution_count()`
- `get_mandate(mandate_id)`
- `get_execution(execution_id)`
- `get_execution_amount_wei(execution_id)`
- `get_execution_recipient(execution_id)`
- `get_mandate_executions(mandate_id)`
- `can_release(execution_id)`
- `get_audit_log()`
- `get_full_state()`

Escrow contract: `GenOSEscrow`

Constructor:

```text
admin_address: string
gen_os_address: string
```

Write methods:

- `admin_update_gen_os_address(gen_os_address)`
- `fund_execution(execution_id, recipient_address, note)` payable
- `release_execution(execution_id)`
- `refund_execution(execution_id, reason)`

Read methods:

- `get_admin()`
- `get_gen_os_address()`
- `get_escrow_count()`
- `get_escrow_ids()`
- `get_escrow(execution_id)`
- `can_release(execution_id)`
- `get_totals()`
- `get_escrow_log()`

## Consensus Flow

```mermaid
flowchart TD
  A[Mandate Created] --> B[Execution Submitted]
  B --> C[Evidence URLs Stored]
  C --> D[GenLayer Evaluation]
  D --> E[Validators Fetch Evidence]
  E --> F[LLM Extracts Structured Verdict]
  F --> G{Consensus Accepts?}
  G -->|Yes| H[Store Approved or Rejected Verdict]
  G -->|No| I[Evaluation Fails Safely]
  H --> J{Can Release?}
  J -->|Yes| K[Escrow Releases Native GEN]
  J -->|No| L[Hold Funds / Manual Review]
```

The contract follows the safe nondeterministic structure we learned from previous submissions:

- Stored mandate and execution data are copied to memory before nondeterministic execution.
- Web fetches and LLM judgment happen inside `gl.vm.run_nondet_unsafe(...)`.
- Validators independently re-run evidence extraction and compare stable fields.
- Storage is mutated only after consensus returns.
- User-facing failures use `gl.vm.UserError`.

## Bradbury Configuration

GenLayer docs currently list Bradbury as the production-like testnet for real AI workloads.

Live Bradbury deployment:

```text
GenOS:       0x9637c249386e4b0b7e66c415Bb1b5619c6a55ce6
GenOSEscrow: 0xA8bc9809120BA45696b0e16F08dC13ff96790449
Admin:       0x35b27B6Fc827De934Fd3E755BcCc0Db5a42e002d
```

Frontend environment:

```text
VITE_GENOS_CONTRACT_ADDRESS=0x9637c249386e4b0b7e66c415Bb1b5619c6a55ce6
VITE_GENOS_ESCROW_ADDRESS=0xA8bc9809120BA45696b0e16F08dC13ff96790449
VITE_GENLAYER_RPC_URL=https://rpc-bradbury.genlayer.com
VITE_GENLAYER_CHAIN_RPC_URL=https://rpc.testnet-chain.genlayer.com
VITE_GENLAYER_CHAIN_ID=4221
```

Never expose a private key through a `VITE_` variable. The frontend uses browser-wallet signing for writes, while deploy keys should stay in local CLI keystores or backend-only environments.

## Local Development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Contract validation:

```bash
genvm-lint check contracts/gen_os.py --json
```

Current validation result:

```json
{"ok":true,"lint":{"ok":true,"passed":3},"validate":{"ok":true,"contract":"GenOS","methods":19,"view_methods":12,"write_methods":7,"ctor_params":2}}
{"ok":true,"lint":{"ok":true,"passed":3},"validate":{"ok":true,"contract":"GenOSEscrow","methods":12,"view_methods":8,"write_methods":4,"ctor_params":2}}
```

## Bradbury Deployment Notes

Use the GenLayer CLI or deploy scripts against Bradbury.

Deploy `GenOS` first:

```bash
genlayer network testnet-bradbury
genlayer deploy --contract contracts/gen_os.py --args "0xYourAdminAddress" "0x0000000000000000000000000000000000000000"
```

Deploy `GenOSEscrow` second, using the deployed `GenOS` address:

```bash
genlayer deploy --contract contracts/gen_os_escrow.py --args "0xYourAdminAddress" "0xDeployedGenOSAddress"
```

Then call `GenOS.admin_update_settlement_router("0xDeployedEscrowAddress")`.

After deployment, set:

```text
VITE_GENOS_CONTRACT_ADDRESS=0x...
VITE_GENOS_ESCROW_ADDRESS=0x...
```

## Frontend Integration

The app now reads accepted state from the deployed Bradbury contracts:

- `get_full_state()`
- `get_mandate(...)`
- `get_execution(...)`
- `get_audit_log()`
- `GenOSEscrow.get_totals()`
- `GenOSEscrow.get_escrow_log()`

Write actions are signed by a connected browser wallet on Bradbury:

- Create a mandate from `/mandates/new`.
- Submit an execution from a mandate detail page.
- Fund native GEN escrow from an execution detail page. The escrow amount is locked to the execution amount.
- Run GenLayer evidence evaluation from an execution detail page.
- Release escrow after a GenOS-approved verdict.

If no live mandates exist yet, the dashboard intentionally shows empty Bradbury state rather than pretending mock data is on-chain.
