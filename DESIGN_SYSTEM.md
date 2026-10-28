# CaseSync Design System & Future Dashboard Contract

**Version:** 1.0.0  
**Scope:** Reusable Visual & Functional Design System for CaseSync (Citizen, Desk Officer, SHO, IO, Supervisor, Admin, Auditor)  
**Mandatory Reference:** `PROJECT_CONTEXT.md`

---

## 1. Primary Architecture & Brand Foundation

The entire CaseSync platform must maintain a cohesive, credible, and modern public-service aesthetic. It represents a statutory police investigation system under the **Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023**.

### Brand Tokens

| Token | Hex / Value | Semantic Role | Tailwind Class |
| :--- | :--- | :--- | :--- |
| **Navy (Primary)** | `#14213D` | Executive authority, primary buttons, headers, active navigation | `bg-navy`, `text-navy`, `border-navy` |
| **Navy Light** | `#1E325C` | Hover state for primary buttons, elevated surfaces | `bg-navy-light`, `hover:bg-navy-light` |
| **Navy Deep** | `#0B1323` | Dark sidebar canvas, high-contrast dark accents | `bg-navy-dark`, `bg-navy-deep` |
| **Ivory (Surface)** | `#F8F7F3` | Light civic canvas, warm backdrop, page background | `bg-ivory`, `bg-ivory-warm` |
| **Ivory Border** | `#ECEAE4` | Restrained neutral borders on light surfaces | `border-ivory-border`, `border-borderSoft` |
| **Saffron (Accent)**| `#FFB703` | National / statutory emblem accent, highlight badges | `bg-saffron`, `text-saffron`, `border-saffron` |
| **Slate (Muted)** | `#53657D` | Secondary text, subtle icons, inactive tabs | `text-slate`, `text-slate-muted` |
| **Civic Green** | `#15803D` | Verified badges, registered FIR status, disposal confirmation | `text-civicGreen`, `bg-civicGreen-light` |
| **Civic Red** | `#DC2626` | P1 urgent priority, rejection notices, destructive actions | `text-civicRed`, `bg-civicRed-light` |

### Typography Scale

- **Display & Headings:** `Plus Jakarta Sans` / `Manrope` (`font-display`) with tight letter spacing (`letter-spacing: -0.02em`).
- **Body & Controls:** `Inter` (`font-sans`) for optimal legibility at 12px–14px.
- **Reference Numbers & Cryptographic Hashes:** `ui-monospace`, `SFMono-Regular` (`font-mono`) for Tracking IDs, FIR numbers, Section citations, and SHA-256 digests.

---

## 2. Shared Component Library

All dashboards must reuse the standardized components located in `frontend/src/components/ui/`. **Do not build duplicate or ad-hoc versions in individual views.**

### A. `<StatusBadge />`
Centralizes the 13 BNSS complaint / FIR lifecycle states and P1/P2/P3 priority tiers.

```jsx
import { StatusBadge } from '@/components/ui';

// FIR Status Badge
<StatusBadge status="UNDER_INVESTIGATION" />
<StatusBadge status="INFO_REQUESTED" />
<StatusBadge status="CHARGESHEET_FILED" />

// Priority Badge
<StatusBadge priority={1} /> {/* P1 - High / Urgent */}
<StatusBadge priority={2} /> {/* P2 - Standard Priority */}
<StatusBadge priority={3} /> {/* P3 - Routine Inquiry */}
```

**State Matrix:**
- `DRAFT`: Slate neutral
- `SUBMITTED`: Sky blue
- `UNDER_REVIEW`: Indigo
- `INFO_REQUESTED`: Amber warning with ping indicator
- `REGISTERED`: Emerald green
- `ASSIGNED`: Royal blue
- `UNDER_INVESTIGATION`: Teal active investigation
- `PENDING_APPROVAL`: Purple review
- `CHARGESHEET_FILED`: Deep blue judicial milestone
- `CLOSURE_FILED`: Zinc neutral
- `QUASHED`: Rose disposal
- `REJECTED`: Rose triage non-cognizable
- `CLOSED`: Emerald concluded & disposed

### B. `<MetricCard />`
Standardized KPI metric card with responsive typography, icon badge, and click-to-filter capability.

```jsx
import { MetricCard } from '@/components/ui';

<MetricCard
  title="Under Investigation"
  value={investigationCount}
  icon="manage_search"
  variant="emerald"
  description="Active IO investigations"
  onClick={() => setActiveTab('active')}
  isActive={activeTab === 'active'}
/>
```

**Available Variants:** `navy`, `emerald`, `amber`, `slate`, `saffron`, `rose`.

### C. `<EmptyState />`
Honest, dignified empty state displaying a clear icon, title, message, and action button.

```jsx
import { EmptyState } from '@/components/ui';

// When an authenticated citizen has 0 complaints
<EmptyState
  icon="folder_open"
  title="No Police Dockets on Record"
  description="You have not submitted any complaints yet. Lodge your first complaint through the secure portal."
  action={{
    label: "+ Lodge New e-FIR",
    href: "/dashboard/file-fir",
    icon: "edit_document"
  }}
/>
```

### D. `<LoadingSkeleton />`
Accessible pulse skeletons with `motion-reduce:animate-none` compliance.

```jsx
import { MetricCardSkeleton, DocketCardSkeleton } from '@/components/ui';

{loading ? <MetricCardSkeleton count={4} /> : <MetricCardsGrid />}
{loading ? <DocketCardSkeleton count={3} /> : <DocketsList />}
```

### E. `<ErrorState />`
Honest server error notification with a retry callback. Never silently replace failed queries with mock data.

```jsx
import { ErrorState } from '@/components/ui';

{fetchError && !loading && (
  <ErrorState
    title="Secure Police Ledger Unavailable"
    message={fetchError}
    onRetry={loadDashboardData}
  />
)}
```

### F. `<Button />`
Standardized control component supporting all necessary dashboard actions.

```jsx
import { Button } from '@/components/ui';

<Button variant="primary">Submit</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="outline">Print Slip</Button>
<Button variant="destructive">Revoke</Button>
<Button variant="ghost">Dismiss</Button>
```

---

## 3. Operational Data Flow & Integrity Rules

1. **Zero Hardcoded Statistics:** All metrics (Total, Under Investigation, Action Required, Closed) must be calculated strictly from the authorized user's API response.
2. **Mutually Exclusive Lifecycle Counting:** Do not count the same case in conflicting categories.
   - **Active:** `!['CLOSED', 'REJECTED', 'QUASHED', 'CHARGESHEET_FILED', 'CLOSURE_FILED'].includes(status)`
   - **Disposed / Concluded:** `['CLOSED', 'REJECTED', 'QUASHED', 'CHARGESHEET_FILED', 'CLOSURE_FILED'].includes(status)`
   - **Investigation:** `['REGISTERED', 'ASSIGNED', 'UNDER_INVESTIGATION', 'PENDING_APPROVAL'].includes(status)`
   - **Action Required:** `status === 'INFO_REQUESTED'`
3. **No Mock Fallback on Failure:** When an API request fails, render an honest `<ErrorState />` with a retry button. Never silently inject demo records into failed operational flows.
4. **Stable Primary Identifiers:** Never rely on array indices as keys or tracking identifiers. Use `docket.tracking_id`, `docket.fir_number`, or `docket.fir_id`.
5. **Idempotent Database Seeding:** The backend seed script (`Backend/src/db/seed.js`) provides realistic data for development and live demonstration without duplicating records on repeated executions.

---

## 4. Accessibility & Quality Standards

- **Focus Visibility:** Every interactive control must declare `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2`.
- **Reduced Motion:** Every pulsing dot or animation must include `motion-reduce:animate-none`.
- **Accessible Roles:** Badges declare `role="status"` and `aria-label`. Empty and error states declare `role="region"` or `role="alert"`.
- **Responsive Layout:**
  - Sidebar: collapsible on desktop, drawer on mobile/tablet.
  - Max Canvas Width: `max-w-[1400px]` centered with `px-4 sm:px-6 lg:px-8`.
  - Grid: `grid-cols-2 sm:grid-cols-4` for metrics; `grid-cols-1 sm:grid-cols-3` for docket metadata.
