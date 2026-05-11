# GenOS — Frontend Design & Build Prompt
### For: Codex / Senior Frontend Engineering Agent
### Project: gen-os (GenLayer-powered spend governance)
### Grade Target: Vercel / Linear / Stripe quality — no exceptions

---

## 0. PRE-BUILD STEPS (Do These First)

### 0.1 — Font Extraction
Locate the project `fhex402` on the user's desktop. Navigate into it and:
1. Find every font file referenced (`.woff`, `.woff2`, `.ttf`, `.otf`, `@font-face` declarations in CSS, or `next/font` / Google Fonts imports).
2. Copy those font files into the `gen-os` project under `/public/fonts/`.
3. Declare them with `@font-face` in your global CSS or import them via the same mechanism used in `fhex402`.
4. Identify which font is used for headings/display and which for body/mono, then map them to the CSS variables `--font-display`, `--font-body`, and `--font-mono`.
5. Apply those variables everywhere — never hardcode a font family string outside of `@font-face` declarations.

### 0.2 — Grid / Cross-Hash Pattern
Open the fhex402 project and examine:
- How its background grid is implemented (SVG `<pattern>`, CSS `background-image` with `linear-gradient`, or a canvas layer).
- Its exact line color, opacity, spacing, and whether it uses a dot-at-intersections effect.
- Whether the grid is fixed or scrolls with content.

Replicate that exact cross-hash grid in GenOS. Apply it as a full-viewport fixed background layer with `pointer-events: none` so it never blocks interaction. The grid must sit behind all content and subtly reinforce the "precision engineering" feeling without overwhelming text legibility.

---

## 1. DESIGN SYSTEM

### 1.1 — Color Tokens (CSS custom properties — no hardcoded hex values anywhere else)

```css
:root {
  /* Base */
  --color-bg:          #000000;          /* pitch black — the law */
  --color-surface:     #0a0a0a;          /* cards, panels — barely perceptible lift */
  --color-border:      rgba(255,255,255,0.08);  /* hairline borders */
  --color-border-hover:rgba(255,255,255,0.18);

  /* Text */
  --color-text-primary:   #FFFFFF;
  --color-text-secondary: rgba(255,255,255,0.55);
  --color-text-disabled:  rgba(255,255,255,0.25);

  /* Accent — Lilac */
  --color-lilac:         #BBA4FF;        /* primary lilac */
  --color-lilac-dim:     rgba(187,164,255,0.12); /* hover background wash */
  --color-lilac-border:  rgba(187,164,255,0.35); /* focused/selected border */
  --color-lilac-glow:    rgba(187,164,255,0.08); /* subtle outer glow on active */

  /* Semantic */
  --color-success:   #4ADE80;
  --color-danger:    #F87171;
  --color-warning:   #FBBF24;
  --color-neutral:   rgba(255,255,255,0.35);

  /* Risk Levels */
  --risk-0: #4ADE80;  /* none */
  --risk-1: #A3E635;  /* low */
  --risk-2: #FBBF24;  /* medium */
  --risk-3: #FB923C;  /* high */
  --risk-4: #F87171;  /* critical */
}
```

**Rules:**
- **No gradients anywhere.** No `linear-gradient`, no `radial-gradient`, no `conic-gradient` for decorative color. Flat surfaces only.
- **No emojis anywhere** — use custom inline SVG icons exclusively (see §1.4).
- Lilac appears **only** on: hover states, focus rings, selected/active states, primary CTA buttons, and highlighted text selections (`::selection`).
- Everything else is white, off-white, or transparent.

### 1.2 — Typography Scale

Map fhex402 fonts to these roles. If fhex402 uses a monospaced or geometric display face, use it for headings. If it uses a clean sans for body, use that for body. Confirm from the source.

```css
/* Sizes */
--text-xs:   11px;
--text-sm:   13px;
--text-base: 15px;
--text-md:   17px;
--text-lg:   22px;
--text-xl:   28px;
--text-2xl:  36px;
--text-3xl:  52px;
--text-4xl:  72px;

/* Weights */
--weight-regular: 400;
--weight-medium:  500;
--weight-semibold:600;
--weight-bold:    700;

/* Line heights */
--leading-tight:  1.1;
--leading-snug:   1.3;
--leading-normal: 1.5;
--leading-loose:  1.75;

/* Letter spacing */
--tracking-tight:  -0.03em;
--tracking-normal:  0;
--tracking-wide:    0.06em;
--tracking-widest:  0.12em;
```

Display/heading type: tight tracking (`--tracking-tight`), bold weight, large scale.
Body/UI text: normal tracking, regular/medium weight, `--text-base`.
Labels, tags, metadata: `--tracking-widest`, uppercase, `--text-xs`, `--color-text-secondary`.
Mono/code/addresses: `--font-mono`, `--text-sm`, `--color-text-secondary`.

### 1.3 — Spacing & Layout Grid

Use an 8px base unit. All spacing values are multiples of 4 or 8.

```
4px  — micro gap (icon + label)
8px  — tight padding
12px — compact element padding
16px — standard padding
24px — section internal spacing
32px — component separation
48px — section gap (mobile)
64px — section gap (desktop)
96px — hero vertical padding
128px — max hero breathing room
```

Max content width: `1200px`, centered, with `24px` side padding on mobile and `48px` on desktop.

### 1.4 — Icon System (Custom SVG — No Emoji, No Icon Library Slop)

Create a dedicated `<Icons />` component file. All icons are hand-crafted inline SVGs with:
- `viewBox="0 0 20 20"` (standard), `fill="none"`, `stroke="currentColor"`, `strokeWidth="1.5"`, `strokeLinecap="round"`, `strokeLinejoin="round"`
- Current color inherits from parent — icons are always context-aware.

**Required icons to create** (names are semantic, design them to feel sleek and architectural):

| Name | Description |
|------|-------------|
| `ShieldCheck` | Mandate guard / approved state |
| `ShieldX` | Rejected state |
| `Vault` | Escrow / locked funds |
| `Mandate` | Document with a lock overlay |
| `Execution` | Arrow flowing through a gate |
| `Evidence` | Receipt / document with checkmark |
| `Audit` | Magnifying glass over a ledger line |
| `Risk` | Gauge / meter with needle |
| `Wallet` | Minimal card outline |
| `Agent` | Circuit node with outgoing lines |
| `Chevron` | Direction arrows |
| `Copy` | Duplicate squares |
| `ExternalLink` | Arrow leaving a box corner |
| `Check` | Simple tick |
| `Close` | X |
| `Menu` | Three horizontal lines (hamburger) |
| `Loader` | Spinning arc (animated via CSS) |
| `Clock` | Circle with clock hands |
| `Lock` | Padlock |
| `Unlock` | Open padlock |
| `Dot` | Filled circle for status indicators |
| `ArrowRight` | Directional navigation |
| `Filter` | Funnel shape |
| `Plus` | Add / create |

Each icon component accepts `size` (default `20`), `className`, and `strokeWidth` (default `1.5`) props.

### 1.5 — Component Primitives

#### Button
```
Variants: primary | secondary | ghost | danger | outline
Sizes: sm | md | lg

primary:
  background: transparent
  border: 1px solid var(--color-lilac-border)
  color: var(--color-lilac)
  hover: background var(--color-lilac-dim), border var(--color-lilac)
  active: scale(0.98)
  transition: all 150ms ease

secondary:
  border: 1px solid var(--color-border)
  color: var(--color-text-primary)
  hover: border var(--color-border-hover), background rgba(255,255,255,0.04)

ghost:
  no border, no background
  color: var(--color-text-secondary)
  hover: color var(--color-text-primary)

danger:
  border: 1px solid rgba(248,113,113,0.4)
  color: var(--color-danger)
  hover: background rgba(248,113,113,0.08)

All buttons:
  border-radius: 6px
  font: var(--font-body), --weight-medium
  letter-spacing: --tracking-wide (for sm), normal (for md/lg)
  no box-shadow
  cursor: pointer
  white-space: nowrap
```

#### Input / Textarea
```
background: transparent
border: 1px solid var(--color-border)
color: var(--color-text-primary)
border-radius: 6px
padding: 10px 14px
font: var(--font-body), --text-base

focus:
  outline: none
  border-color: var(--color-lilac-border)
  box-shadow: 0 0 0 3px var(--color-lilac-glow)

placeholder: var(--color-text-disabled)
```

#### Tag / Badge
```
Tiny pill label
border: 1px solid var(--color-border)
background: var(--color-surface)
color: var(--color-text-secondary)
border-radius: 4px
padding: 2px 8px
font: --text-xs, --tracking-widest, uppercase

Variants: default | success | danger | warning | lilac | risk-N
Each variant changes only border and text color to the semantic token.
```

#### Card
```
background: var(--color-surface)
border: 1px solid var(--color-border)
border-radius: 10px
padding: 24px
transition: border-color 200ms ease

hover (where clickable):
  border-color: var(--color-border-hover)
```

#### Divider
```
1px solid var(--color-border)
No margin tricks — use gap in flex/grid layouts.
```

#### Address Display
```
Component that takes a hex address.
Renders: 0x + first 6 chars + "..." + last 4 chars
Uses --font-mono, --text-sm
Has a copy icon button (ghost) on the right
Clicking copies full address and briefly shows a check icon
```

#### Risk Meter
```
A horizontal segmented bar — 5 segments (0–4), filled up to risk level.
Segments use --risk-0 through --risk-4.
No animation — instant fill. Static, precise, readable.
Shows risk label text ("LOW", "MEDIUM", etc.) to the right.
```

#### Status Indicator
```
A small `Dot` SVG icon + text label
Colors: green (approved), red (rejected), yellow (pending), white/dim (unknown)
```

---

## 2. APPLICATION ARCHITECTURE & ROUTES

The app is a single-page React application (Vite + React + TypeScript).

```
/                    → Landing / Hero
/dashboard           → Command Center
/mandates            → Mandate management
/mandates/new        → Create mandate form
/mandates/:id        → Mandate detail view
/executions          → Execution queue
/executions/:id      → Execution detail + evidence
/evidence            → Evidence receipt browser
/audit               → Full audit log
/vault               → Vault / escrow status
```

Use `react-router-dom` for routing. The Navbar is always visible. The Footer is on the landing page only.

---

## 3. LAYOUT STRUCTURE

### 3.1 — Navbar

**Height:** 60px fixed, `position: fixed; top: 0; z-index: 1000`
**Background:** `rgba(0,0,0,0.85)` + `backdrop-filter: blur(12px) saturate(180%)`
**Bottom border:** `1px solid var(--color-border)`

Layout (left → right):
```
[Logo]          [Nav Links — center]          [Wallet Button + Status]
```

**Logo:**
- The text `GEN//OS` rendered in `--font-display`, bold, white, `--text-lg`
- `//` rendered in `--color-lilac`
- No icon/image logo — the logotype IS the logo
- Links to `/`

**Nav Links (desktop):** `Dashboard` | `Mandates` | `Executions` | `Evidence` | `Audit` | `Vault`
- Font: `--font-body`, `--text-sm`, `--weight-medium`, `--tracking-wide`
- Default: `--color-text-secondary`
- Hover: `--color-text-primary`, transition 120ms
- Active route: `--color-lilac`, with a `2px` bottom bar in `--color-lilac`
- Spacing: `32px` between links

**Wallet Area (right):**
- If disconnected: primary Button `Connect Wallet`
- If connected: show `AddressDisplay` + a green `Dot` status indicator + network badge tag (e.g. "GenLayer Testnet")

**Mobile (< 768px):**
- Logo stays left
- Hamburger icon `Menu` (ghost button) right
- Full-screen slide-down menu panel, `background: #000`, lists all nav links stacked, `48px` tall each
- Menu open/close animates with `transform: translateY` + `opacity`

---

### 3.2 — Footer (Landing page only)

**Layout:** 3-column grid on desktop, stacked on mobile.
**Border top:** `1px solid var(--color-border)`
**Background:** `#000000`
**Padding:** `64px 0 48px`

```
Col 1: GEN//OS logotype + one-line tagline
        "Intelligent spend governance. On-chain."
        Powered by GenLayer — small badge/tag

Col 2: Navigation links (Dashboard, Mandates, Executions, Vault, Audit)
        Label header: "PRODUCT" (--text-xs, --tracking-widest, --color-text-disabled)

Col 3: External links (Docs, GitHub, GenLayer, Discord)
        Label header: "RESOURCES"

Bottom bar (full width):
  Left: © 2025 GenOS. All rights reserved.
  Right: "Built on GenLayer" — with a small ExternalLink icon
  Font: --text-xs, --color-text-disabled
  Border top: 1px solid var(--color-border)
  Margin top: 48px, padding top: 24px
```

---

### 3.3 — Hero Section (`/`)

**Full viewport height (`100vh`). Dead center vertically and horizontally.**

Cross-hash grid is most visible here. No other background embellishment.

Layout (centered column, max-width 720px):

```
[Tag Badge]           "POWERED BY GENLAYER"   — --text-xs, --tracking-widest, lilac border badge

[Headline]            "Spend governance
                       that thinks
                       before it pays."
                       — --font-display, --text-4xl → --text-3xl on tablet → --text-2xl on mobile
                       -- --tracking-tight, --weight-bold
                       -- White. No color mixing.

[Subheadline]         "Give an agent a mandate. GenOS verifies evidence,
                       checks risk, and only releases escrow when the
                       work is proven and the policy is met."
                       — --font-body, --text-md, --color-text-secondary
                       -- Max-width 520px, centered, --leading-loose

[CTA Row]             [primary Button: "Create a Mandate"]   [secondary Button: "See a Live Execution"]
                       — 16px gap between buttons

[Stats Row]           Three inline stats separated by vertical dividers:
                       "14 Mandates Active" | "$ 48,200 Locked in Escrow" | "99.2% Policy Compliance"
                       -- --text-xs, --tracking-widest, --color-text-secondary
                       -- Numbers in white, --weight-semibold
                       -- Appears 480ms after headline (staggered CSS animation)
```

**Entry animation (CSS only):**
- Badge fades up from `translateY(12px)` → `translateY(0)`, 400ms, 0ms delay
- Headline: same, 500ms, 80ms delay
- Subheadline: same, 500ms, 180ms delay
- CTA row: same, 500ms, 280ms delay
- Stats row: same, 500ms, 420ms delay

---

### 3.4 — Dashboard (`/dashboard`)

**Page title:** `GEN//OS` wordmark small + `Dashboard` breadcrumb

Layout: **Full-page content area below 60px navbar. No sidebar.**

**Section 1 — Command Overview (top row, 4 metric cards)**
```
Card grid: 4 columns desktop → 2 tablet → 1 mobile
Each card:
  - Icon (SVG, 20px, --color-text-secondary)
  - Value (--text-2xl, --weight-bold, white)
  - Label (--text-xs, --tracking-widest, --color-text-secondary, uppercase)
  - Delta / trend as tiny Tag badge (e.g. "+3 this week")

Metrics:
  1. Vault           Total Locked (USDC)   Icon: Vault
  2. Mandates        Active Mandates        Icon: Mandate
  3. Executions      Pending Review         Icon: Execution
  4. Compliance      Policy Compliance %    Icon: ShieldCheck
```

**Section 2 — Execution Feed (left, 65% width) + Mandate Health (right, 35%)**

```
Execution Feed:
  - Title: "RECENT EXECUTIONS" (--text-xs, --tracking-widest label)
  - Table-like list. Each row:
      [Status Dot] [Execution ID mono] [Mandate name] [Amount] [Risk badge] [Time ago]
  - Rows separated by 1px border. Hover: background rgba(255,255,255,0.03)
  - Click row → navigate to /executions/:id
  - Paginated: "Load more" ghost button at bottom

Mandate Health:
  - Title: "MANDATE HEALTH"
  - Stacked list of active mandates with:
      Mandate name (truncated)
      Spend bar: horizontal bar showing used / total budget
        Bar track: var(--color-border)
        Bar fill: white (under 80%), --color-warning (80-95%), --color-danger (95%+)
        No rounded pill — sharp rectangle, 4px height
      Remaining USDC label
  - Click → /mandates/:id
```

**Section 3 — Audit Activity (full width strip)**
```
  Last 10 audit events in a dense monospaced log style
  Each line: [timestamp] [actor: address] [action] [result]
  Background: var(--color-surface)
  Border: 1px solid var(--color-border)
  Font: --font-mono, --text-xs
  "View Full Audit Log →" link (ghost, --color-lilac) bottom right
```

---

### 3.5 — Mandates (`/mandates`)

**Top bar:**
```
Left:  "Mandates" page title (--text-xl, --weight-bold)
       Subtitle: "Define the rules before any money moves." (--text-sm, --color-text-secondary)
Right: [primary Button: "+ New Mandate"]
```

**Filter / Search bar:**
```
Full-width search input: "Search mandates..."
Filter tags row (inline): All | Active | Paused | Completed | Expired
  Clicking a filter activates it: tag border turns --color-lilac, text turns --color-lilac
```

**Mandate Grid: 3 columns desktop → 2 tablet → 1 mobile**

Each mandate card:
```
Top: Mandate name (--text-md, --weight-semibold) + Status badge (Active/Paused)
     Created by: AddressDisplay (--text-xs)

Body: Mandate excerpt — first ~120 chars of the natural-language mandate text.
      Font: --font-body, --text-sm, --color-text-secondary, --leading-loose
      Show "..." truncation with "Read mandate →" link (--color-lilac, --text-xs)

Budget bar (same component as in Dashboard):
  Label row: "Spent: $X USDC" left | "Budget: $Y USDC" right

Footer row: 
  [Clock icon] "Created 3 days ago"   [Execution icon] "12 Executions"
  All in --text-xs, --color-text-disabled
```

---

### 3.6 — Create Mandate (`/mandates/new`)

**Full-page centered form. Max-width 680px. Substantial vertical padding.**

Steps shown as a horizontal step indicator at top:
```
[1 Define] — [2 Policy] — [3 Budget] — [4 Review]
Active step: --color-lilac label + bottom bar
Inactive: --color-text-disabled
```

**Step 1 — Define**
```
Field: Mandate Name (input)
Field: Agent or Operator Address (input, validates 0x format)
Field: Network (select: GenLayer Testnet, Mainnet, EVM Layer...)
Textarea: Natural-Language Mandate (tall, 200px min, placeholder with full example mandate text)
```

**Step 2 — Policy**
```
Checkbox group:
  [x] Block sanctioned addresses
  [x] Block mixer contracts
  [x] Block unverified contracts
  [x] Require delivery evidence before payment
  [x] Require GitHub PR + CI pass for software work
  [x] Require published content + analytics for marketing

Custom risk threshold slider:
  "Reject if risk level exceeds: [selector: 0–4]"
  Shows the 5-segment Risk Meter live as they adjust
```

**Step 3 — Budget**
```
Field: Max per-task amount (USDC input)
Field: Total mandate budget (USDC input)
Field: Mandate expiry (date picker or text: "30 days", "90 days", "No expiry")
Vault source: select / connect vault address
```

**Step 4 — Review**
```
Read-only summary of all fields above.
Mandate text shown in full inside a bordered code-like block (--color-surface, --font-mono, --text-sm)
[Back] ghost button   [Deploy Mandate] primary button
```

---

### 3.7 — Executions (`/executions`)

**Top bar:**
```
Left: "Executions" title + "Pending, approved, and rejected execution requests."
Right: Filter dropdown + [Submit Execution] primary button
```

**Tab bar (below top bar):**
```
All | Pending | Approved | Rejected | Expired
Tab switching filters the list. Active tab: --color-lilac border-bottom, --color-lilac text.
```

**Execution Table:**
Use a proper table layout (not cards) to allow dense information scanning:
```
Columns:
  Status     | ID (mono)    | Mandate     | Vendor (address) | Amount | Risk | Submitted  | Action

Status: colored Dot + label ("Pending", "Approved", "Rejected")
ID: --font-mono, --text-sm, truncated, copy button on hover
Mandate: truncated name, links to mandate
Vendor: AddressDisplay component
Amount: USDC amount, right-aligned
Risk: Risk Meter (compact, single-line segment bar)
Submitted: relative time ("2h ago")
Action: "Review →" link (--color-lilac) for pending; "Details →" for others

Row hover: background rgba(255,255,255,0.025)
Row border-bottom: 1px solid var(--color-border)
Header row: --text-xs, --tracking-widest, --color-text-disabled, uppercase
```

---

### 3.8 — Execution Detail (`/executions/:id`)

**Two-column layout: 60% left (evidence + details) / 40% right (decision panel)**

**Left — Execution Detail**
```
Section: "EXECUTION REQUEST"
  Mandate name → link
  Requested by: AddressDisplay
  Vendor/Recipient: AddressDisplay
  Amount: large white figure ("300 USDC")
  Submitted: timestamp

Section: "EXECUTION DESCRIPTION"
  Full natural-language description in a bordered card (--color-surface)
  --font-body, --text-base, --leading-loose

Section: "EVIDENCE SUBMITTED"
  Evidence list. Each item is a card:
    Type badge (GitHub PR, Vercel URL, Invoice, Analytics)
    Title / description
    URL (clickable, ExternalLink icon)
    Verification status: ShieldCheck (green) or Clock (pending) or ShieldX (red)
    Timestamp
```

**Right — GenLayer Decision Panel (sticky)**
```
Border: 1px solid var(--color-border), border-radius 10px, background --color-surface

Header: "GENLAYER VERDICT" — --text-xs, --tracking-widest

Large status display:
  If approved: big ShieldCheck SVG in --color-success + "APPROVED" text in --color-success
  If rejected: big ShieldX in --color-danger + "REJECTED" in --color-danger
  If pending: Loader spinning in white + "EVALUATING..."

Risk Score:
  Full Risk Meter component, large
  "Risk Level: 2 — MEDIUM"

Reason block:
  Label: "REASON"
  Text: the reason string from GenLayer output
  Background: slightly lighter surface, --font-body, --text-sm, --leading-loose

Required Action:
  Mono tag: "release_payment" or "hold_funds"

Mandate compliance:
  Mini checklist — each mandate rule + pass/fail icon

[Release Payment] primary button (only visible if approved + operator)
[Override / Escalate] danger outline button (only if operator)
```

---

### 3.9 — Evidence (`/evidence`)

**Search + filter bar at top.**

**Masonry-like grid of evidence receipt cards:**
```
Each card:
  Header: Evidence type tag + timestamp
  Body: Description of what was verified
  Source URL + ExternalLink icon
  Associated execution ID (mono, links to /executions/:id)
  Verification state badge
  On hover: card border lightens to --color-border-hover
```

---

### 3.10 — Audit Log (`/audit`)

**Dense, terminal-inspired full-width log view.**

```
Background: #000000 (same as page but no surface lift)
Border: 1px solid var(--color-border) wrapping the log container
Font: --font-mono, --text-xs, --leading-loose

Each log line:
  [timestamp]  [actor-address]  [action-type]  [target-id]  [result]

Color coding (text only, no backgrounds):
  action-type: --color-text-secondary
  approved results: --color-success
  rejected results: --color-danger
  pending: --color-warning
  addresses: --color-lilac (dim)

Filters: Date range | Actor | Action type | Result
Export: "Export as CSV" ghost button top right
```

---

### 3.11 — Vault (`/vault`)

**Full-width hero strip:**
```
Left: "VAULT" label (--text-xs, --tracking-widest) + large USDC balance (--text-4xl, --weight-bold, white)
Right: [Deposit] secondary button   [Withdraw] danger outline button
```

**Two panels below:**
```
Left (60%): Transaction history table
  Columns: Type | Amount | From/To | Tx Hash | Time
  Type tags: Deposit | Release | Hold | Withdrawal

Right (40%): Vault metadata
  Vault address: AddressDisplay (full, with copy)
  Network: tag badge
  Escrow contract: AddressDisplay
  Created: date
  Authorized agents: list of AddressDisplay components
  Mandate count: number
```

---

## 4. CROSS-CUTTING UI REQUIREMENTS

### 4.1 — Text Selection
```css
::selection {
  background: var(--color-lilac-dim);
  color: var(--color-lilac);
}
```

### 4.2 — Scrollbar (WebKit)
```css
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--color-border-hover); }
```

### 4.3 — Focus Visible (Accessibility)
```css
:focus-visible {
  outline: 2px solid var(--color-lilac-border);
  outline-offset: 3px;
  border-radius: 4px;
}
```

### 4.4 — Page Transitions
Every route change: the incoming page fades from `opacity: 0` + `translateY(8px)` → `opacity: 1` + `translateY(0)` in 200ms ease-out. Implement with a route wrapper component using CSS.

### 4.5 — Loading States
Use the animated `Loader` SVG icon (spinning arc, CSS `animation: spin 1s linear infinite`). Never use browser-default spinners. Loading cards show a shimmer: `background: linear-gradient(90deg, var(--color-surface) 25%, rgba(255,255,255,0.04) 50%, var(--color-surface) 75%)` animated left-to-right. This is the ONLY permitted gradient — it is functional, not decorative.

### 4.6 — Empty States
Each list/table has a designed empty state:
- Relevant SVG icon (large, 48px, --color-text-disabled)
- Title: "No [items] yet" (--text-lg, white)
- Subtitle: contextual prompt (--text-sm, --color-text-secondary)
- CTA button if relevant

### 4.7 — Toast / Notification System
Small toasts, bottom-right, stacked:
- `background: var(--color-surface)`, `border: 1px solid var(--color-border)`, `border-radius: 8px`
- Left accent bar: 3px wide, `--color-success` | `--color-danger` | `--color-warning` | `--color-lilac`
- Auto-dismiss after 4 seconds with a shrinking progress line at bottom
- Slide-in from right on enter, slide-out on dismiss

### 4.8 — Tooltips
Plain, dark (`#111`), `border: 1px solid var(--color-border)`, `border-radius: 4px`, `--text-xs`, white text. Appear 200ms after hover, disappear immediately on mouse leave. No arrows.

---

## 5. RESPONSIVENESS RULES

### Breakpoints
```
--bp-mobile:  480px
--bp-tablet:  768px
--bp-desktop: 1024px
--bp-wide:    1280px
```

### Rules
- **Mobile-first** CSS. Write base styles for mobile, use `min-width` media queries to escalate.
- **Navbar** collapses to hamburger under 768px.
- **All grids** collapse: 3-col → 2-col (tablet) → 1-col (mobile).
- **Hero headline** scales: `clamp(32px, 6vw, 72px)` — fluid type scaling.
- **Tables** on mobile become card-based list views. No horizontal scroll.
- **Sticky right panel** on Execution Detail becomes a full-width section stacked below on mobile.
- **Tap targets** minimum 44×44px on mobile for all interactive elements.
- **Desktop zoom:** Use `rem`-based sizing with `html { font-size: 100%; }`. All layout values in `rem` or `%` — no fixed pixel widths except borders and decorative elements. This ensures zoom-in/zoom-out on desktop scales gracefully.

---

## 6. TECHNICAL STACK

```
Framework:       React 18 + TypeScript
Bundler:         Vite
Routing:         react-router-dom v6
Styling:         CSS Modules OR plain CSS custom properties (NO Tailwind — it conflicts with the font system)
State:           React Context + useReducer for global state (wallet, mandates, executions)
HTTP:            fetch (no axios)
Wallet:          wagmi + viem (for EVM wallet connection)
Build target:    ES2020, modern browsers only
```

No UI library (MUI, Chakra, Shadcn, etc.). Every component is built from scratch per the design system above. This is non-negotiable for design control.

---

## 7. MOCK DATA LAYER

Until real GenLayer integration is live, implement a `src/mock/` directory:
- `mandates.ts` — 5–8 realistic mandate objects with full natural-language mandate text
- `executions.ts` — 10–15 execution objects with varied statuses, risk levels, amounts
- `evidence.ts` — evidence items linked to executions
- `audit.ts` — 50+ audit log lines
- `vault.ts` — single vault object

All mock data should feel real. Use realistic USDC amounts ($50 – $5000), real-looking Ethereum addresses, realistic mandate text about software delivery, marketing work, and contractor payments.

---

## 8. FILE STRUCTURE

```
gen-os/
├── public/
│   └── fonts/                 ← extracted from fhex402
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Tag.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── AddressDisplay.tsx
│   │   │   ├── RiskMeter.tsx
│   │   │   ├── StatusDot.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── Tooltip.tsx
│   │   └── icons/
│   │       └── Icons.tsx
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Mandates.tsx
│   │   ├── MandateDetail.tsx
│   │   ├── MandateCreate.tsx
│   │   ├── Executions.tsx
│   │   ├── ExecutionDetail.tsx
│   │   ├── Evidence.tsx
│   │   ├── Audit.tsx
│   │   └── Vault.tsx
│   ├── mock/
│   │   ├── mandates.ts
│   │   ├── executions.ts
│   │   ├── evidence.ts
│   │   ├── audit.ts
│   │   └── vault.ts
│   ├── styles/
│   │   ├── tokens.css         ← all CSS custom properties
│   │   ├── global.css         ← reset, base, grid, fonts, selection, scrollbar
│   │   └── animations.css     ← all keyframes
│   ├── hooks/
│   │   ├── useWallet.ts
│   │   └── useToast.ts
│   ├── context/
│   │   └── AppContext.tsx
│   ├── App.tsx
│   └── main.tsx
```

---

## 9. QUALITY BAR — NON-NEGOTIABLES

Before marking any page as done, verify:

- [ ] Zero emoji characters in the entire codebase
- [ ] Zero hardcoded hex color values outside `tokens.css`
- [ ] Zero gradient declarations for decorative purposes
- [ ] Cross-hash grid visible on hero and persists subtly on all pages
- [ ] Fonts pulled correctly from fhex402, rendering at all sizes
- [ ] `::selection` shows lilac
- [ ] All hover states show lilac or correct semantic color within 150ms transition
- [ ] All focus states show lilac ring (`focus-visible` only)
- [ ] All buttons meet the variant spec — no default browser styling leaking
- [ ] Mobile nav works and closes on route change
- [ ] No horizontal scroll on any viewport width
- [ ] Execution detail decision panel is sticky on desktop, stacked on mobile
- [ ] All empty states are designed, not blank
- [ ] Loading states use the custom Loader icon, not browser spinners
- [ ] Toast system works for at least: success, error, and info types
- [ ] Audit log uses monospaced font with color-coded result values
- [ ] Page transitions are smooth and consistent across all routes
- [ ] RiskMeter renders correctly for all 5 levels (0–4) with correct colors
- [ ] AddressDisplay truncates correctly and copy-to-clipboard works

---

*This document is the single source of truth for the GenOS frontend. Do not deviate from the design tokens, color rules, or component specs. When in doubt, choose the option that is more restrained, more precise, and more typographically considered. Ship something that could sit on a stage at a Stripe developer conference without embarrassment.*