# Workflow 3: Court Outcome Recording & Judicial Case Closure Implementation Guide

This guide documents the full architecture, database schema, state machine transition (`CHARGESHEET_FILED` -> `CLOSED`), defense-in-depth security guards, and step-by-step code implementation for **Workflow 3: Court Outcome Recording & Judicial Case Closure** (Functional Requirements FR-M4, PROJECT_CONTEXT.md §5.4, §6.2, §6.4, §7.1 Step 11, §10.1, §12.2).

---

## 1. System Contract & Architecture Blueprint

```mermaid
flowchart TD
    subgraph Active Investigation & Prosecution
        INV[Case: UNDER_INVESTIGATION]
        REP[IO Submits Chargesheet: PENDING_APPROVAL]
        CRT[SHO Approves Filing: CHARGESHEET_FILED<br/>Court Trial Commences]
        INV --> REP
        REP --> CRT
    end

    subgraph Judicial Adjudication & Outcome Recording
        SHO[Station House Officer (SHO) / District SUPERVISOR]
        POST_OUTCOME[Record Verdict: POST /api/cases/:id/court-outcome<br/>Court Name, Trial No, Verdict, Sentence/Fine, Judgment Date]
        CRT --> SHO
        SHO --> POST_OUTCOME
    end

    subgraph Database State Transition & Case Closure
        DB_LOCK[Row Lock FIR & Case FOR UPDATE]
        INSERT_OUTCOME[Insert Structured Record in court_outcomes]
        UPDATE_CASE[cases.closed_at = now()<br/>cases.outcome = Summary]
        UPDATE_FIR[fir.status = CLOSED<br/>version = version + 1]
        HIST[case_status_history: CHARGESHEET_FILED -> CLOSED]
        
        POST_OUTCOME --> DB_LOCK
        DB_LOCK --> INSERT_OUTCOME
        INSERT_OUTCOME --> UPDATE_CASE
        UPDATE_CASE --> UPDATE_FIR
        UPDATE_FIR --> HIST
    end

    subgraph Citizen Experience & Audit
        NOTIF[In-App Notification to Complainant Citizen]
        FDBK[Unlocks Citizen Satisfaction Feedback FR-T4]
        AUDIT[Cryptographic SHA-256 Hash Chained Audit Log<br/>Action: COURT_OUTCOME_RECORDED]
        
        UPDATE_FIR -.-> NOTIF
        NOTIF -.-> FDBK
        UPDATE_FIR -.-> AUDIT
    end
```

### A. State Machine Transition Specification (§6.4)
| From State | To State | Trigger | Actor Role | Guard Conditions | Side Effects |
|---|---|---|---|---|---|
| `CHARGESHEET_FILED` | `CLOSED` | SHO / Supervisor records court judgment | `SHO` (station jurisdiction), `SUPERVISOR` | Case must be in `CHARGESHEET_FILED`; mandatory valid verdict (`CONVICTED`, `ACQUITTED`, `COMPOUNDED`, `QUASHED`, `DISCHARGED`), court name, judgment date | Status becomes `CLOSED`; sets `cases.closed_at = now()`; inserts into `court_outcomes`; records status history; delivers in-app closure notification to complainant; logs audit entry into hash chain |

---

## 2. Core Architectural Guarantees & Defense-in-Depth Guards

1. **Trial Stage Guard:**  
   Court outcomes can only be recorded for cases currently in the `CHARGESHEET_FILED` state. Cases still under investigation, pending approval, already closed, or transferred cannot record a court outcome (`400 Bad Request`).
2. **Station Jurisdiction Guard:**  
   Only the Station House Officer (`SHO`) of the police station holding jurisdiction over the case (`fir.station_id === req.user.stationId`) or a district `SUPERVISOR` has legal authority to record trial outcomes. Unauthorized officers receive `403 Forbidden`.
3. **Structured Verdict & Legal Validation:**  
   The recorded verdict must be one of the recognized statutory dispositions:
   - `CONVICTED`: Accused found guilty; mandatory sentence/fine details.
   - `ACQUITTED`: Accused acquitted of charges; acquittal grounds recorded.
   - `COMPOUNDED`: Parties settled per statutory compounding provisions.
   - `QUASHED`: Proceedings quashed by High Court / Supreme Court.
   - `DISCHARGED`: Court discharged accused before framing charges.
4. **Single Final Adjudication Guard:**  
   A case can have only one final court outcome recorded (`UNIQUE(case_id)` and `UNIQUE(fir_id)`). Subsequent attempts return `409 Conflict`.
5. **Complainant Empowerment & Feedback Enablement:**  
   Transitioning to `CLOSED` triggers a notification to the complainant citizen. This enables the citizen to submit their satisfaction rating and remarks under Feature 5 (`FR-T4`).
6. **Append-Only Tamper-Evident Auditing:**  
   Recording a court outcome logs `COURT_OUTCOME_RECORDED` into the SHA-256 cryptographic hash chain in `audit_log`.

---

## 3. Database Schema (`10_court_outcome_schema.sql`)

### Tables Created & Permissions Configured:
1. **`court_outcomes`**: Stores structured court trial outcomes, judicial bench details, verdict, sentencing, and remarks.
2. **Permissions**: Maps `case:record_outcome` to `SHO`, `SUPERVISOR`, and `ADMIN`.
3. **State Transition**: Ensures `CHARGESHEET_FILED -> CLOSED` exists in `state_transitions`.

```sql
CREATE TABLE IF NOT EXISTS court_outcomes (
  outcome_id BIGSERIAL PRIMARY KEY,
  case_id BIGINT UNIQUE NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
  fir_id BIGINT UNIQUE NOT NULL REFERENCES fir(fir_id) ON DELETE CASCADE,
  court_name VARCHAR(120) NOT NULL,
  case_court_number VARCHAR(60),
  verdict VARCHAR(25) NOT NULL CHECK (
    verdict IN ('CONVICTED', 'ACQUITTED', 'COMPOUNDED', 'QUASHED', 'DISCHARGED')
  ),
  judgment_date DATE NOT NULL,
  judge_name VARCHAR(120),
  sentence_details TEXT,
  fine_amount NUMERIC(12,2) DEFAULT 0,
  remarks TEXT NOT NULL,
  recorded_by BIGINT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_court_outcomes_case ON court_outcomes(case_id);
CREATE INDEX IF NOT EXISTS idx_court_outcomes_fir ON court_outcomes(fir_id);
CREATE INDEX IF NOT EXISTS idx_court_outcomes_verdict ON court_outcomes(verdict);
```

---

## 4. REST API Specification

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `POST` | `/api/cases/:id/court-outcome` | `SHO`, `SUPERVISOR` | Record court trial outcome and close the case |
| `GET` | `/api/cases/:id/court-outcome` | `CITIZEN`, `IO`, `SHO`, `SUPERVISOR`, `AUDITOR`, `ADMIN` | Retrieve full court verdict and sentencing details |

### Request & Response Examples

#### A. Record Court Outcome: `POST /api/cases/:id/court-outcome`
**Headers:** `Authorization: Bearer <sho_or_supervisor_token>`  
**Body:**
```json
{
  "courtName": "District & Sessions Court, Central Division",
  "caseCourtNumber": "SC-2026/894",
  "verdict": "CONVICTED",
  "judgmentDate": "2026-10-20",
  "judgeName": "Hon. Justice P. K. Singhal",
  "sentenceDetails": "Rigorous imprisonment for 3 years under BNS 303(2)",
  "fineAmount": 10000.00,
  "remarks": "Accused found guilty of robbery based on forensic exhibit and eyewitness testimonies."
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Court verdict recorded successfully. Case formally closed.",
  "data": {
    "outcome_id": 1,
    "case_id": 5,
    "fir_id": 25,
    "verdict": "CONVICTED",
    "court_name": "District & Sessions Court, Central Division",
    "judgment_date": "2026-10-20",
    "fir_status": "CLOSED",
    "closed_at": "2026-10-23T14:45:00.000Z"
  }
}
```

#### B. Get Court Outcome: `GET /api/cases/:id/court-outcome`
**Headers:** `Authorization: Bearer <token>`  
**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "outcome_id": 1,
    "case_id": 5,
    "fir_id": 25,
    "court_name": "District & Sessions Court, Central Division",
    "case_court_number": "SC-2026/894",
    "verdict": "CONVICTED",
    "judgment_date": "2026-10-20",
    "judge_name": "Hon. Justice P. K. Singhal",
    "sentence_details": "Rigorous imprisonment for 3 years under BNS 303(2)",
    "fine_amount": "10000.00",
    "remarks": "Accused found guilty...",
    "recorded_by_email": "sho.central@casesync.gov.in",
    "created_at": "2026-10-23T14:45:00.000Z"
  }
}
```

---

## 5. Implementation Files & Step-by-Step Plan

1. **Migration File**: `src/db/migrations/10_court_outcome_schema.sql`
2. **Validator File**: `src/validators/court-outcome.validator.js`
3. **Service Layer**: Add `recordCourtOutcome` and `getCourtOutcome` to `src/services/case.service.js`
4. **Controller Layer**: Add `recordCourtOutcome` and `getCourtOutcome` to `src/controllers/case.controller.js`
5. **Route Mounting**: Add endpoints to `src/routes/case.route.js`
6. **Integration Test Suite**: `test/test-court-outcome-apis.js`
7. **Test Runner Update**: Add suite to `test/run-all-tests.js` and `package.json`
8. **Verification**: Run complete test suite and confirm 100% pass rate.
