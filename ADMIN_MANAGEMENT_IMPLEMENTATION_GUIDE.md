# Feature 7: System Administration, Master Data & SLA Governance Implementation Guide

This guide documents the full architecture, database schema, operational SLAs, user/officer lifecycle governance, and step-by-step code implementation for **Feature 7: System Administration, Master Data & SLA Governance** (Functional Requirements FR-AD1 to FR-AD3, PROJECT_CONTEXT.md §4.1, §5.8, §8.4, §8.6, §9).

This feature centralizes institutional configuration, manages police stations, official ranks hierarchy, legal sections under IPC & BNS, crime categories, user accounts, role reassignments, soft deactivation, and real-time SLA threshold monitoring with automatic audit logging into the cryptographic hash chain.

The work is strictly divided for a **team of 2 developers** working in parallel without merge conflicts.

---

## 1. System Contract & Architecture Blueprint

```mermaid
flowchart TD
    subgraph Administration & Governance Engine
        ADM[Admin Dashboard /api/admin]
        RBAC[RBAC Guard: requireRole 'ADMIN']
        AUDIT[Audit Service: Hash-Chained Cryptographic Logger]
    end

    subgraph Master Data (FR-AD1)
        STN[Police Stations<br/>CRUD + Active Toggle + Case Load]
        RNK[Police Ranks<br/>Hierarchy 1 to 7]
        CAT[Crime Categories<br/>Parent-Child Tree]
        SEC[Legal Sections<br/>IPC / BNS / NDPS]
    end

    subgraph User & Officer Lifecycle (FR-AD2)
        USR[Users & Staff Listing<br/>Filtered by Station / Role]
        ROL[Role Elevation / Reassignment<br/>Audited Transition]
        TRN[Station Transfer<br/>Active Officer Relocation]
        LCK[Soft Deactivation / Unlock<br/>Self-Deactivation Guard]
    end

    subgraph SLA Governance (FR-AD3)
        SLA_CFG[Configurable SLA Thresholds<br/>Review, IO Assign, Stale Case]
        SLA_MON[Real-Time Breach Monitor<br/>Hours Elapsed vs Threshold]
        ESC[Automatic Escalation Routing<br/>To SHO / SP / Supervisor]
    end

    ADM --> RBAC
    RBAC --> STN
    RBAC --> RNK
    RBAC --> CAT
    RBAC --> SEC
    RBAC --> USR
    RBAC --> ROL
    RBAC --> TRN
    RBAC --> LCK
    RBAC --> SLA_CFG
    RBAC --> SLA_MON

    STN -.-> AUDIT
    RNK -.-> AUDIT
    CAT -.-> AUDIT
    SEC -.-> AUDIT
    ROL -.-> AUDIT
    TRN -.-> AUDIT
    LCK -.-> AUDIT
    SLA_CFG -.-> AUDIT
```

### A. Core Architectural Guarantees & Security Guards
1. **Administrative Access Guard:** All administrative endpoints are guarded by `requireRole(['ADMIN'])` (with selective read/monitor access for `SUPERVISOR`). Unauthorized requests are logged as `ACCESS_DENIED` security events in the tamper-evident audit trail.
2. **Administrator Self-Deactivation Prevention Guard:** Under no circumstances may an administrator deactivate their own user account (`userId === actorId` throws 400 Bad Request). This prevents orphaned systems without active administrative governance.
3. **Collision-Free Master Identifiers:** Station codes, rank codes, crime category names, and legal section codes (Act + Section No) enforce unique database constraints.
4. **Append-Only Tamper-Evident Auditing:** Every administrative mutation (creation, modification, role change, station transfer, soft deactivation, SLA threshold adjustment) computes a SHA-256 hash chained into `audit_log`.
5. **Real-Time SLA Inactivity Detection (FR-AD3 & FR-M7):** Open complaints and active investigation cases calculate `hours_elapsed` vs configured `threshold_hours`. Breaches are categorized by operational stage with automated escalation assignment.

---

## 2. Member Responsibilities Split

| Area | Member 1: Database DDL, Master Data & Stations Engine | Member 2: User Governance, SLA Engine, API Routes & Tests |
|---|---|---|
| **Primary Domain** | Database DDL & Migrations, Police Stations CRUD, Ranks & Legal Sections Master Data, Station Metrics | User & Officer Account Management, Role Elevation, Soft Deactivation Guards, SLA Thresholds & Breach Monitor, Automated Test Suite |
| **Files to Implement** | 1. `src/db/migrations/07_administration_schema.sql`<br>2. `src/services/admin.service.js` (Stations & Master Data)<br>3. `src/validators/admin.validator.js` | 1. `src/services/admin.service.js` (Users & SLA Engine)<br>2. `src/controllers/admin.controller.js`<br>3. `src/routes/admin.route.js`<br>4. `src/app.js` (Mounting)<br>5. `test/test-admin-apis.js` |
| **Database Tables & Features** | `ranks`, `sla_configs`, `police_stations`, `crime_categories`, `legal_sections` | `users`, `officers`, `roles`, `permissions`, `audit_log`, `cases`, `fir` |

---

## 3. Database Schema (`07_administration_schema.sql`)

### Tables Created & Enhanced:
1. **`ranks`**: Standardized hierarchy for police personnel (Hierarchy Levels 1 to 7).
2. **`sla_configs`**: Dynamic operational SLA thresholds and escalation roles.
3. **`police_stations`**: Enhanced with contact phone, email, and active status flag.
4. **`crime_categories`**: Enhanced with active status flag.
5. **`legal_sections`**: Enhanced with active status flag and statutory punishment guideline years.

```sql
-- 1. Master Ranks Table
CREATE TABLE IF NOT EXISTS ranks (
  rank_id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(60) NOT NULL,
  hierarchy_level INT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Master SLA Configuration Table
CREATE TABLE IF NOT EXISTS sla_configs (
  sla_id SERIAL PRIMARY KEY,
  config_key VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  threshold_hours INT NOT NULL,
  escalation_role VARCHAR(20) NOT NULL DEFAULT 'SUPERVISOR',
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by BIGINT REFERENCES users(user_id)
);
```

---

## 4. API Specification & Endpoints

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/admin/stations` | `ADMIN`, `SUPERVISOR` | List all police stations with officer and active case counts |
| `GET` | `/api/admin/stations/:id` | `ADMIN`, `SUPERVISOR` | Retrieve station details and list assigned officers |
| `POST` | `/api/admin/stations` | `ADMIN` | Create new police station jurisdiction |
| `PUT` | `/api/admin/stations/:id` | `ADMIN` | Update station address, contact phone, or name |
| `PATCH` | `/api/admin/stations/:id/status` | `ADMIN` | Soft deactivate or reactivate station |
| `GET` | `/api/admin/ranks` | `ADMIN`, `SUPERVISOR` | List official police ranks ordered by hierarchy |
| `POST` | `/api/admin/ranks` | `ADMIN` | Define new rank code, title, and hierarchy level |
| `GET` | `/api/admin/categories` | `ADMIN`, `SUPERVISOR` | List crime categories with FIR usage counts |
| `POST` | `/api/admin/categories` | `ADMIN` | Add new crime category or subcategory |
| `GET` | `/api/admin/legal-sections` | `ADMIN`, `SUPERVISOR` | Search and filter IPC / BNS legal sections |
| `POST` | `/api/admin/legal-sections` | `ADMIN` | Add statutory section with cognizable/bailable tags |
| `GET` | `/api/admin/users` | `ADMIN` | List users with role, station, and active status filters |
| `GET` | `/api/admin/users/:id` | `ADMIN` | View detailed user account and linked officer profile |
| `PATCH` | `/api/admin/users/:id/role` | `ADMIN` | Reassign user role (e.g. elevate IO to SHO) |
| `PATCH` | `/api/admin/users/:id/station` | `ADMIN` | Transfer officer to another police station |
| `PATCH` | `/api/admin/users/:id/status` | `ADMIN` | Soft deactivation/activation (self-deactivation blocked) |
| `POST` | `/api/admin/users/:id/unlock` | `ADMIN` | Unlock account locked due to repeated failed logins |
| `GET` | `/api/admin/sla` | `ADMIN`, `SUPERVISOR` | View all operational SLA threshold configurations |
| `PUT` | `/api/admin/sla/:key` | `ADMIN` | Update SLA threshold hours and escalation roles |
| `GET` | `/api/admin/sla/breaches` | `ADMIN`, `SUPERVISOR` | Real-time monitoring of overdue complaints and stale cases |

---

## 5. Automated Verification

Execute the Feature 7 test suite:
```bash
npm run test:admin
```

Execute all test suites across the entire system (Features 0 to 7):
```bash
npm test
```

The automated test suite verifies:
1. RBAC authorization barriers rejecting unauthorized citizen/officer requests.
2. Station creation with auto-calculated officer and case metrics.
3. Ranks, Crime Categories, and Legal Sections CRUD.
4. User listing, filtering, and role reassignment.
5. Officer station transfer updating jurisdiction.
6. User soft deactivation and reactivation.
7. Defense in Depth: Administrative self-deactivation rejection guard.
8. Operational SLA configuration updates and breach monitoring calculations.
9. End-to-end cryptographic SHA-256 hash-chain verification across all audit events.
