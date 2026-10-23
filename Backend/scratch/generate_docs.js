const fs = require('fs');
const path = require('path');

const openapi = {
  openapi: "3.0.3",
  info: {
    title: "CaseSync - Police FIR & Criminal Investigation Management API",
    version: "1.0.0",
    description: "Production-grade RESTful API for CaseSync, a state-of-the-art Police FIR, Investigation, Evidence, and Chain-of-Custody Management System. Built with Node.js, Express, and PostgreSQL with tamper-evident SHA-256 hash chaining, optimistic concurrency control, and role-based access control.",
    contact: {
      name: "CaseSync Engineering Team",
      email: "support@casesync.police.gov.in"
    },
    license: {
      name: "Proprietary / Law Enforcement Restricted"
    }
  },
  servers: [
    {
      url: "http://localhost:5000/api",
      description: "Local Development Server"
    },
    {
      url: "https://api.casesync.police.gov.in/api",
      description: "Production Enforcement Cloud"
    }
  ],
  tags: [
    { name: "Authentication", description: "User onboarding, login, session management, and RBAC profile endpoints" },
    { name: "Complaints", description: "Citizen complaint submission, draft auto-save, duplicate checking, and acknowledgement slip" },
    { name: "FIR Registration", description: "Station triage, desk officer review, section tagging, rejection, and SHO registration" },
    { name: "Case Management", description: "IO assignment, case diaries, suspect profiling, chargesheet submission, and case reopening" },
    { name: "Evidence & Custody", description: "Evidence intake, SHA-256 integrity verification, and tamper-proof chain of custody transfers" },
    { name: "Appeals", description: "Citizen appeals against rejected complaints and supervisory administrative reviews" },
    { name: "Case Transfers", description: "Inter-station jurisdiction transfer requests, approvals, and Zero FIR flows" },
    { name: "Court Outcomes", description: "Judicial proceedings, conviction/acquittal recording, and final case closure" },
    { name: "Tracking & Timeline", description: "Public tracking by Tracking ID, authenticated chronological timeline, and citizen feedback" },
    { name: "Notifications", description: "In-app notification retrieval, unread counts, and read status management" },
    { name: "Reports & Analytics", description: "Analytical intelligence reports (disposal rate, pending aging, hotspots, SLA breaches) and CSV export" },
    { name: "Audit Trail", description: "Cryptographically forward-chained audit log exploration and SHA-256 hash continuity verification" },
    { name: "Administration", description: "Police stations, master categories, legal sections, user management, and SLA thresholds" }
  ],
  paths: {
    // -------------------------------------------------------------
    // AUTHENTICATION
    // -------------------------------------------------------------
    "/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register new citizen account",
        description: "Enables public citizens to self-register an account with encrypted password and demographic info.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["full_name", "email", "password", "phone"],
                properties: {
                  full_name: { type: "string", example: "Rajesh Kumar" },
                  email: { type: "string", format: "email", example: "rajesh.kumar@example.com" },
                  password: { type: "string", format: "password", example: "SecurePass@123" },
                  phone: { type: "string", example: "9876543210" },
                  address: { type: "string", example: "42 MG Road, Bangalore" },
                  id_proof_type: { type: "string", example: "AADHAAR" },
                  id_proof_number: { type: "string", example: "XXXX-XXXX-1234" }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Citizen registered successfully",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } }
          },
          400: { description: "Validation error or email already in use" }
        }
      }
    },
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Authenticate user and generate JWT token",
        description: "Validates credentials and returns a signed JWT Bearer token containing user roles and station jurisdiction.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "sho.central@police.gov.in" },
                  password: { type: "string", format: "password", example: "ShoPass@123" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Authentication successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                    user: { $ref: "#/components/schemas/UserProfile" }
                  }
                }
              }
            }
          },
          401: { description: "Invalid credentials or account locked" }
        }
      }
    },
    "/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get current authenticated user profile",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Current user profile with role permissions and station jurisdiction",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } }
          },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Log out current session",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Successfully logged out" }
        }
      }
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Authentication"],
        summary: "Request password reset token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", format: "email", example: "citizen@example.com" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Password reset instructions dispatched" }
        }
      }
    },
    "/auth/reset-password": {
      post: {
        tags: ["Authentication"],
        summary: "Reset password using token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "new_password"],
                properties: {
                  token: { type: "string", example: "reset-token-uuid-1234" },
                  new_password: { type: "string", format: "password", example: "NewSecurePass@2026" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Password reset successful" }
        }
      }
    },
    "/auth/register-officer": {
      post: {
        tags: ["Authentication"],
        summary: "Onboard new police officer (Admin only)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "full_name", "badge_number", "rank_id", "station_id", "role"],
                properties: {
                  email: { type: "string", format: "email", example: "io.sharma@police.gov.in" },
                  password: { type: "string", example: "OfficerPass@123" },
                  full_name: { type: "string", example: "Sub-Inspector Sharma" },
                  badge_number: { type: "string", example: "KA-BLR-0841" },
                  rank_id: { type: "integer", example: 4 },
                  station_id: { type: "integer", example: 1 },
                  role: { type: "string", enum: ["DESK_OFFICER", "IO", "SHO", "SUPERVISOR", "AUDITOR"], example: "IO" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Officer onboarded successfully" },
          403: { description: "Admin privileges required" }
        }
      }
    },

    // -------------------------------------------------------------
    // COMPLAINTS
    // -------------------------------------------------------------
    "/complaints": {
      post: {
        tags: ["Complaints"],
        summary: "Create complaint (draft or submitted)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["station_id", "incident_date", "incident_place", "incident_description", "category_id"],
                properties: {
                  station_id: { type: "integer", example: 1 },
                  category_id: { type: "integer", example: 2 },
                  incident_date: { type: "string", format: "date-time", example: "2026-10-23T10:30:00Z" },
                  incident_place: { type: "string", example: "Brigade Road Junction, Bengaluru" },
                  incident_description: { type: "string", example: "Two individuals snatched golden necklace and fled on black motorbike." },
                  is_draft: { type: "boolean", default: false, example: false }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Complaint created with unique tracking ID",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } }
          }
        }
      }
    },
    "/complaints/check-duplicate": {
      post: {
        tags: ["Complaints"],
        summary: "Check for duplicate complaints in same station & time window",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["station_id", "incident_date", "incident_place", "category_id"],
                properties: {
                  station_id: { type: "integer", example: 1 },
                  category_id: { type: "integer", example: 2 },
                  incident_date: { type: "string", format: "date-time", example: "2026-10-23T10:30:00Z" },
                  incident_place: { type: "string", example: "Brigade Road Junction" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "List of possible duplicate complaints within proximity threshold",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } }
          }
        }
      }
    },
    "/complaints/my": {
      get: {
        tags: ["Complaints"],
        summary: "Get all complaints filed by authenticated citizen",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Citizen complaint history with live statuses" }
        }
      }
    },
    "/complaints/{id}": {
      get: {
        tags: ["Complaints"],
        summary: "Get complaint details by ID",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Detailed complaint dossier including attachments and history" },
          404: { description: "Complaint not found" }
        }
      },
      put: {
        tags: ["Complaints"],
        summary: "Update draft complaint",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  incident_place: { type: "string" },
                  incident_description: { type: "string" },
                  category_id: { type: "integer" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Draft complaint updated" },
          400: { description: "Cannot edit non-draft complaint" }
        }
      }
    },
    "/complaints/{id}/submit": {
      post: {
        tags: ["Complaints"],
        summary: "Formally submit a draft complaint to station inbox",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Draft transitioned to SUBMITTED state in station inbox" }
        }
      }
    },
    "/complaints/{id}/attachments": {
      post: {
        tags: ["Complaints"],
        summary: "Upload evidentiary file attachment to complaint",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "File securely uploaded and SHA-256 hashed" }
        }
      }
    },
    "/complaints/{id}/respond": {
      post: {
        tags: ["Complaints"],
        summary: "Citizen response to officer clarification request",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["response_text"],
                properties: {
                  response_text: { type: "string", example: "The vehicle license plate was KA-01-MJ-9922." }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Clarification recorded and case returned to REVIEW_IN_PROGRESS" }
        }
      }
    },
    "/complaints/{id}/acknowledgement": {
      get: {
        tags: ["Complaints"],
        summary: "Download official Citizen Acknowledgement Slip",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: {
            description: "JSON acknowledgement receipt with QR verification token",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } }
          }
        }
      }
    },

    // -------------------------------------------------------------
    // FIR REGISTRATION & STATION INBOX
    // -------------------------------------------------------------
    "/station/inbox": {
      get: {
        tags: ["FIR Registration"],
        summary: "View police station incoming complaints triage inbox",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
        ],
        responses: {
          200: { description: "List of complaints assigned to user's police station jurisdiction" }
        }
      }
    },
    "/firs/master/legal-sections": {
      get: {
        tags: ["FIR Registration"],
        summary: "List all active legal penal code sections (BNS / IPC)",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Active legal sections list for FIR tagging" }
        }
      }
    },
    "/firs/{id}/review": {
      post: {
        tags: ["FIR Registration"],
        summary: "Start preliminary inquiry / review on complaint",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Status transitioned to REVIEW_IN_PROGRESS" }
        }
      }
    },
    "/firs/{id}/request-info": {
      post: {
        tags: ["FIR Registration"],
        summary: "Request clarification or additional evidence from complainant",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["clarification_notes"],
                properties: {
                  clarification_notes: { type: "string", example: "Please provide the IMEI numbers of the stolen mobile phones." }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Notification dispatched to citizen; status transitioned to INFO_REQUESTED" }
        }
      }
    },
    "/firs/{id}/reject": {
      post: {
        tags: ["FIR Registration"],
        summary: "Reject complaint with statutory justification",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rejection_reason"],
                properties: {
                  rejection_reason: { type: "string", example: "Matter constitutes a non-cognizable civil property boundary dispute." }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Complaint rejected; right to appeal notification issued" }
        }
      }
    },
    "/firs/{id}/sections": {
      post: {
        tags: ["FIR Registration"],
        summary: "Tag applicable penal code legal sections to FIR",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["section_ids"],
                properties: {
                  section_ids: { type: "array", items: { type: "integer" }, example: [1, 2] }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Legal sections mapped successfully" }
        }
      }
    },
    "/firs/{id}/register": {
      post: {
        tags: ["FIR Registration"],
        summary: "SHO approval and formal FIR registration",
        description: "Atomically generates sequential FIR number (pessimistic lock) and advances status to REGISTERED.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  notes: { type: "string", example: "Cognizable offense established under BNS Section 303(2). Approved for registration." }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "FIR registered with formal FIR number",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } }
          },
          403: { description: "Only Station SHO can formally register FIRs" }
        }
      }
    },
    "/firs/{id}/slip": {
      get: {
        tags: ["FIR Registration"],
        summary: "Get formal FIR registration slip",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Official FIR registration document with sections and timestamps" }
        }
      }
    },

    // -------------------------------------------------------------
    // CASE MANAGEMENT & INVESTIGATION
    // -------------------------------------------------------------
    "/cases/workload": {
      get: {
        tags: ["Case Management"],
        summary: "Get station IO workload summary",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "List of active Investigating Officers and their current active caseloads" }
        }
      }
    },
    "/cases/{id}/assign": {
      post: {
        tags: ["Case Management"],
        summary: "Assign Investigating Officer (IO) to registered FIR",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["io_id"],
                properties: {
                  io_id: { type: "integer", example: 3 }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "IO assigned; notification dispatched" }
        }
      }
    },
    "/cases/{id}/accept": {
      post: {
        tags: ["Case Management"],
        summary: "IO formally accepts case investigation",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Case status advanced to UNDER_INVESTIGATION" }
        }
      }
    },
    "/cases/{id}/updates": {
      post: {
        tags: ["Case Management"],
        summary: "Add Case Diary entry (IO only)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["entry_date", "activity_details"],
                properties: {
                  entry_date: { type: "string", format: "date-time", example: "2026-10-23T14:00:00Z" },
                  activity_details: { type: "string", example: "Inspected crime scene; recovered CCTV footage from junction camera #4." },
                  location: { type: "string", example: "Brigade Road Junction" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Case diary entry recorded with timestamp" }
        }
      }
    },
    "/cases/{id}/persons": {
      post: {
        tags: ["Case Management"],
        summary: "Record person involved in investigation (Accused, Witness, Suspect)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["person_type", "name"],
                properties: {
                  person_type: { type: "string", enum: ["ACCUSED", "SUSPECT", "WITNESS", "VICTIM"], example: "SUSPECT" },
                  name: { type: "string", example: "Vikas Patel" },
                  contact_number: { type: "string", example: "9811223344" },
                  address: { type: "string", example: "12 Indira Nagar, Bengaluru" },
                  statement: { type: "string", example: "Witness states motorbike had broken tail light." }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Person profile recorded in case dossier" }
        }
      }
    },
    "/cases/{id}/submit-report": {
      post: {
        tags: ["Case Management"],
        summary: "IO submits Chargesheet or Final Closure Report",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["report_type", "summary"],
                properties: {
                  report_type: { type: "string", enum: ["CHARGESHEET", "CLOSURE"], example: "CHARGESHEET" },
                  summary: { type: "string", example: "Investigation concluded. Direct CCTV and physical evidence implicates primary accused." }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Report submitted; status transitioned to CHARGESHEET_SUBMITTED or CLOSURE_REQUESTED" }
        }
      }
    },
    "/cases/{id}/review-report": {
      post: {
        tags: ["Case Management"],
        summary: "SHO reviews and approves/rejects final report",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["approved"],
                properties: {
                  approved: { type: "boolean", example: true },
                  review_notes: { type: "string", example: "Approved for filing before the jurisdictional Magistrate." }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Report approved; case status updated to CHARGESHEETED or CLOSED" }
        }
      }
    },
    "/cases/{id}/reopen": {
      post: {
        tags: ["Case Management"],
        summary: "Reopen closed case upon discovery of new material evidence",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["reopen_reason"],
                properties: {
                  reopen_reason: { type: "string", example: "Forensic ballistic report received linking weapon to unsolved cold case." }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Case successfully reopened and moved back to UNDER_INVESTIGATION" }
        }
      }
    },
    "/cases/{id}": {
      get: {
        tags: ["Case Management"],
        summary: "Get complete comprehensive case dossier",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Complete case details with diary, persons, evidence, sections, and timeline" }
        }
      }
    },

    // -------------------------------------------------------------
    // EVIDENCE & CUSTODY
    // -------------------------------------------------------------
    "/cases/{caseId}/evidence": {
      post: {
        tags: ["Evidence & Custody"],
        summary: "Log physical or digital evidence item into case",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "caseId", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["evidence_type", "description", "storage_location"],
                properties: {
                  evidence_type: { type: "string", enum: ["PHYSICAL", "DIGITAL", "DOCUMENTARY", "FORENSIC"], example: "PHYSICAL" },
                  description: { type: "string", example: "Recovered gold necklace weighing 24 grams." },
                  storage_location: { type: "string", example: "Malkhana Vault Shelf B-12" },
                  file: { type: "string", format: "binary" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Evidence item logged with initial custody entry and SHA-256 hash" }
        }
      },
      get: {
        tags: ["Evidence & Custody"],
        summary: "List all evidence logged for a case",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "caseId", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "List of evidence items with custody summary" }
        }
      }
    },
    "/evidence/{id}": {
      get: {
        tags: ["Evidence & Custody"],
        summary: "Get evidence details and complete chain of custody ledger",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Evidence metadata and chronological custody transfer log" }
        }
      }
    },
    "/evidence/{id}/verify": {
      get: {
        tags: ["Evidence & Custody"],
        summary: "Verify cryptographic SHA-256 integrity of evidence file",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: {
            description: "Cryptographic verification result comparing stored hash vs current file hash",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } }
          }
        }
      }
    },
    "/evidence/{id}/transfer": {
      post: {
        tags: ["Evidence & Custody"],
        summary: "Record custody transfer of evidence",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["to_officer_id", "to_location", "purpose"],
                properties: {
                  to_officer_id: { type: "integer", example: 5 },
                  to_location: { type: "string", example: "State Forensic Science Laboratory (FSL)" },
                  purpose: { type: "string", example: "Chemical analysis and fingerprint lifting" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Tamper-proof custody transfer logged" }
        }
      }
    },

    // -------------------------------------------------------------
    // APPEALS & TRANSFERS
    // -------------------------------------------------------------
    "/firs/{id}/appeal": {
      post: {
        tags: ["Appeals"],
        summary: "Citizen submits appeal against rejected complaint",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["appeal_reason"],
                properties: {
                  appeal_reason: { type: "string", example: "Evidence of physical coercion was omitted during initial desk triage." }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Appeal logged into station and supervisory queue" }
        }
      }
    },
    "/station/appeals": {
      get: {
        tags: ["Appeals"],
        summary: "Get pending appeals queue for station / supervisor",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "List of unreviewed rejection appeals" }
        }
      }
    },
    "/firs/{id}/review-appeal": {
      post: {
        tags: ["Appeals"],
        summary: "SHO / Supervisor reviews rejection appeal",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["decision", "decision_notes"],
                properties: {
                  decision: { type: "string", enum: ["UPHELD", "OVERTURNED"], example: "OVERTURNED" },
                  decision_notes: { type: "string", example: "Appeal accepted. Cognizable threshold satisfied. Remanded for FIR registration." }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Appeal decided. Overturned appeals return to SUBMITTED state" }
        }
      }
    },
    "/cases/{id}/transfer": {
      post: {
        tags: ["Case Transfers"],
        summary: "Initiate inter-station case transfer",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["to_station_id", "transfer_reason"],
                properties: {
                  to_station_id: { type: "integer", example: 2 },
                  transfer_reason: { type: "string", example: "Incident occurred outside station jurisdiction (Zero FIR transfer)." }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Transfer requested; status moved to TRANSFER_PENDING" }
        }
      }
    },
    "/station/transfers": {
      get: {
        tags: ["Case Transfers"],
        summary: "Get incoming transfer queue for current police station",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "List of pending incoming case transfers" }
        }
      }
    },
    "/cases/{id}/accept-transfer": {
      post: {
        tags: ["Case Transfers"],
        summary: "Accept incoming case transfer into current station",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Case jurisdiction transferred; status returned to REGISTERED" }
        }
      }
    },
    "/cases/{id}/reject-transfer": {
      post: {
        tags: ["Case Transfers"],
        summary: "Reject incoming case transfer",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rejection_reason"],
                properties: {
                  rejection_reason: { type: "string", example: "Jurisdiction verified to belong to North East Police Division." }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Transfer rejected and returned to originating station" }
        }
      }
    },

    // -------------------------------------------------------------
    // COURT OUTCOMES
    // -------------------------------------------------------------
    "/cases/{id}/court-outcome": {
      post: {
        tags: ["Court Outcomes"],
        summary: "Record judicial trial outcome / court verdict",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["court_name", "judge_name", "verdict_date", "verdict_type", "disposal_nature"],
                properties: {
                  court_name: { type: "string", example: "Chief Metropolitan Magistrate Court - 3" },
                  judge_name: { type: "string", example: "Hon. Justice V. Ramaswamy" },
                  verdict_date: { type: "string", format: "date", example: "2026-10-23" },
                  verdict_type: { type: "string", enum: ["CONVICTION", "ACQUITTAL", "DISMISSED", "COMPOUNDED"], example: "CONVICTION" },
                  sentence_details: { type: "string", example: "3 years rigorous imprisonment and INR 25,000 fine." },
                  disposal_nature: { type: "string", example: "JUDICIAL_CONVICTION" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Judicial verdict recorded and case permanently CLOSED" }
        }
      },
      get: {
        tags: ["Court Outcomes"],
        summary: "Retrieve judicial trial outcome for a case",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Judicial trial outcome and sentencing details" }
        }
      }
    },

    // -------------------------------------------------------------
    // TRACKING & NOTIFICATIONS
    // -------------------------------------------------------------
    "/tracking/track/{trackingId}": {
      get: {
        tags: ["Tracking & Timeline"],
        summary: "Public lookup of complaint/FIR status by tracking ID",
        parameters: [{ name: "trackingId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: {
            description: "Public status details with PII redaction",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } }
          },
          404: { description: "Invalid tracking number" }
        }
      }
    },
    "/tracking/firs/{id}/timeline": {
      get: {
        tags: ["Tracking & Timeline"],
        summary: "Get authenticated chronological case progression timeline",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Complete audit history entries formatted as a timeline" }
        }
      }
    },
    "/tracking/firs/{id}/feedback": {
      post: {
        tags: ["Tracking & Timeline"],
        summary: "Citizen submits satisfaction rating & feedback on closed FIR",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rating"],
                properties: {
                  rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
                  comments: { type: "string", example: "Prompt investigation and courteous handling by the IO." }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Feedback recorded successfully" }
        }
      },
      get: {
        tags: ["Tracking & Timeline"],
        summary: "Retrieve feedback submitted for an FIR",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Citizen feedback details" }
        }
      }
    },
    "/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "Get notifications for authenticated user",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "List of notifications sorted by creation date" }
        }
      }
    },
    "/notifications/unread-count": {
      get: {
        tags: ["Notifications"],
        summary: "Get unread notifications count badge",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    unreadCount: { type: "integer", example: 3 }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/notifications/{id}/read": {
      patch: {
        tags: ["Notifications"],
        summary: "Mark a single notification as read",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Notification marked read" }
        }
      }
    },
    "/notifications/read-all": {
      patch: {
        tags: ["Notifications"],
        summary: "Mark all notifications as read for current user",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "All notifications updated" }
        }
      }
    },

    // -------------------------------------------------------------
    // REPORTS & AUDIT TRAIL
    // -------------------------------------------------------------
    "/reports/{reportType}": {
      get: {
        tags: ["Reports & Analytics"],
        summary: "Generate analytical intelligence report",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "reportType",
            in: "path",
            required: true,
            schema: {
              type: "string",
              enum: ["disposal-rate", "pending-firs", "crime-hotspots", "io-performance", "category-breakdown", "sla-breaches"]
            }
          },
          { name: "stationId", in: "query", schema: { type: "integer" } },
          { name: "from", in: "query", schema: { type: "string", format: "date" } },
          { name: "to", in: "query", schema: { type: "string", format: "date" } }
        ],
        responses: {
          200: { description: "Structured analytical aggregations and statistics" }
        }
      }
    },
    "/reports/{reportType}/export": {
      get: {
        tags: ["Reports & Analytics"],
        summary: "Export report dataset as CSV file",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "reportType", in: "path", required: true, schema: { type: "string" } },
          { name: "stationId", in: "query", schema: { type: "integer" } }
        ],
        responses: {
          200: {
            description: "Downloadable CSV data stream",
            content: { "text/csv": { schema: { type: "string" } } }
          }
        }
      }
    },
    "/audit": {
      get: {
        tags: ["Audit Trail"],
        summary: "Query system-wide immutable audit trail",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "actor_id", in: "query", schema: { type: "integer" } },
          { name: "action", in: "query", schema: { type: "string" } },
          { name: "entity_name", in: "query", schema: { type: "string" } },
          { name: "entity_id", in: "query", schema: { type: "integer" } },
          { name: "from_date", in: "query", schema: { type: "string", format: "date" } },
          { name: "to_date", in: "query", schema: { type: "string", format: "date" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 50 } }
        ],
        responses: {
          200: { description: "Chronological audit records with SHA-256 forward hashes" }
        }
      }
    },
    "/audit/verify": {
      get: {
        tags: ["Audit Trail"],
        summary: "Cryptographically verify complete SHA-256 hash-chain integrity",
        description: "Recomputes and verifies the mathematical continuity of the entire forward-chained audit ledger.",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Verification report indicating intact hash chain or pinpointing tampered log IDs",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    valid: { type: "boolean", example: true },
                    verifiedCount: { type: "integer", example: 148 },
                    message: { type: "string", example: "Audit log chain verified intact. Zero tampering detected." }
                  }
                }
              }
            }
          }
        }
      }
    },

    // -------------------------------------------------------------
    // SYSTEM ADMINISTRATION
    // -------------------------------------------------------------
    "/admin/stations": {
      get: {
        tags: ["Administration"],
        summary: "List all police stations",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "List of police stations with jurisdictional metadata" } }
      },
      post: {
        tags: ["Administration"],
        summary: "Create new police station",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["station_code", "name", "division", "district", "contact_phone"],
                properties: {
                  station_code: { type: "string", example: "PS-05" },
                  name: { type: "string", example: "Koramangala Police Station" },
                  division: { type: "string", example: "South Division" },
                  district: { type: "string", example: "Bengaluru City" },
                  contact_phone: { type: "string", example: "080-22942588" },
                  address: { type: "string", example: "80 Feet Road, 4th Block, Koramangala" }
                }
              }
            }
          }
        },
        responses: { 201: { description: "Police station created" } }
      }
    },
    "/admin/stations/{id}": {
      get: {
        tags: ["Administration"],
        summary: "Get police station by ID",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Police station details" } }
      },
      put: {
        tags: ["Administration"],
        summary: "Update police station",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  contact_phone: { type: "string" },
                  address: { type: "string" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Station updated" } }
      }
    },
    "/admin/stations/{id}/status": {
      patch: {
        tags: ["Administration"],
        summary: "Toggle active/inactive status of police station",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Station status updated" } }
      }
    },
    "/admin/users": {
      get: {
        tags: ["Administration"],
        summary: "List all users and officers",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "User catalog with roles, station, and active status" } }
      }
    },
    "/admin/users/{id}": {
      get: {
        tags: ["Administration"],
        summary: "Get user details by ID",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Detailed user and officer record" } }
      }
    },
    "/admin/users/{id}/role": {
      patch: {
        tags: ["Administration"],
        summary: "Update user role",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["role_id"],
                properties: { role_id: { type: "integer", example: 4 } }
              }
            }
          }
        },
        responses: { 200: { description: "Role updated" } }
      }
    },
    "/admin/users/{id}/station": {
      patch: {
        tags: ["Administration"],
        summary: "Transfer officer to a different police station",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["station_id"],
                properties: { station_id: { type: "integer", example: 2 } }
              }
            }
          }
        },
        responses: { 200: { description: "Officer station updated" } }
      }
    },
    "/admin/users/{id}/status": {
      patch: {
        tags: ["Administration"],
        summary: "Toggle active / deactivated status for user",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["is_active"],
                properties: { is_active: { type: "boolean", example: false } }
              }
            }
          }
        },
        responses: { 200: { description: "User status updated" } }
      }
    },
    "/admin/users/{id}/unlock": {
      post: {
        tags: ["Administration"],
        summary: "Unlock locked user account after failed attempts",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "User account unlocked" } }
      }
    },
    "/admin/ranks": {
      get: {
        tags: ["Administration"],
        summary: "List police rank hierarchies",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "List of police ranks" } }
      },
      post: {
        tags: ["Administration"],
        summary: "Create police rank",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "code", "level"],
                properties: {
                  name: { type: "string", example: "Inspector of Police" },
                  code: { type: "string", example: "IP" },
                  level: { type: "integer", example: 5 }
                }
              }
            }
          }
        },
        responses: { 201: { description: "Rank created" } }
      }
    },
    "/admin/categories": {
      get: {
        tags: ["Administration"],
        summary: "List crime categories",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "List of categories" } }
      },
      post: {
        tags: ["Administration"],
        summary: "Create crime category",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "code", "severity"],
                properties: {
                  name: { type: "string", example: "Cyber Financial Fraud" },
                  code: { type: "string", example: "CYBER_FRAUD" },
                  severity: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], example: "HIGH" }
                }
              }
            }
          }
        },
        responses: { 201: { description: "Category created" } }
      }
    },
    "/admin/legal-sections": {
      get: {
        tags: ["Administration"],
        summary: "List legal sections catalog",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Legal sections list" } }
      },
      post: {
        tags: ["Administration"],
        summary: "Create legal section",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["act_name", "section_code", "title", "is_cognizable"],
                properties: {
                  act_name: { type: "string", example: "BNS" },
                  section_code: { type: "string", example: "318(4)" },
                  title: { type: "string", example: "Cheating and dishonestly inducing delivery of property" },
                  is_cognizable: { type: "boolean", example: true }
                }
              }
            }
          }
        },
        responses: { 201: { description: "Legal section registered" } }
      }
    },
    "/admin/sla": {
      get: {
        tags: ["Administration"],
        summary: "List SLA duration configurations",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "SLA threshold settings" } }
      }
    },
    "/admin/sla/{key}": {
      put: {
        tags: ["Administration"],
        summary: "Update SLA threshold for workflow step",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "key", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["duration_hours"],
                properties: {
                  duration_hours: { type: "integer", example: 48 },
                  description: { type: "string", example: "Desk officer initial review maximum window" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "SLA setting updated" } }
      }
    },
    "/admin/sla/breaches": {
      get: {
        tags: ["Administration"],
        summary: "Monitor active SLA breaches across all stations",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "List of cases currently exceeding SLA deadlines" } }
      }
    }
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Standard JSON Web Token authorization header: Bearer <token>"
      }
    },
    schemas: {
      SuccessEnvelope: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Operation executed successfully" },
          data: { type: "object" }
        }
      },
      ErrorEnvelope: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Detailed error message" },
          error: { type: "string" }
        }
      },
      UserProfile: {
        type: "object",
        properties: {
          user_id: { type: "integer", example: 2 },
          email: { type: "string", example: "sho.central@police.gov.in" },
          role: { type: "string", example: "SHO" },
          station_id: { type: "integer", example: 1 },
          full_name: { type: "string", example: "Inspector Vikramaditya" }
        }
      }
    }
  }
};

const postmanCollection = {
  info: {
    _postman_id: "casesync-api-v1-collection-postman-2026",
    name: "CaseSync - Police FIR & Case Management API Collection",
    description: "Complete Postman v2.1.0 collection for CaseSync covering end-to-end workflows: Authentication, Citizen Filing, Station Inbox Review, Legal Section Mapping, FIR Registration, Case Management, Evidence Vault & Custody Transfer, Rejection Appeals, Zero FIR Transfers, Court Outcomes, SLA Breaches, and Cryptographic Audit Verification.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:5000/api", type: "string" },
    { key: "token", value: "", type: "string" },
    { key: "citizenToken", value: "", type: "string" },
    { key: "deskToken", value: "", type: "string" },
    { key: "ioToken", value: "", type: "string" },
    { key: "shoToken", value: "", type: "string" },
    { key: "supervisorToken", value: "", type: "string" },
    { key: "auditorToken", value: "", type: "string" },
    { key: "adminToken", value: "", type: "string" },
    { key: "complaintId", value: "1", type: "string" },
    { key: "trackingId", value: "TRK-2026-PS01-00001", type: "string" },
    { key: "firId", value: "1", type: "string" },
    { key: "caseId", value: "1", type: "string" },
    { key: "evidenceId", value: "1", type: "string" }
  ],
  item: [
    {
      name: "1. Authentication & Profiles",
      item: [
        {
          name: "Register Citizen",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                full_name: "Aaditya Narayan",
                email: "aaditya.narayan@example.com",
                password: "SecurePass@123",
                phone: "9876543210",
                address: "42 Indiranagar, Bengaluru",
                id_proof_type: "AADHAAR",
                id_proof_number: "XXXX-XXXX-9941"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/auth/register", host: ["{{baseUrl}}"], path: ["auth", "register"] }
          }
        },
        {
          name: "Login Citizen",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "var jsonData = pm.response.json();",
                  "if (jsonData.token) {",
                  "  pm.collectionVariables.set('citizenToken', jsonData.token);",
                  "  pm.collectionVariables.set('token', jsonData.token);",
                  "}"
                ]
              }
            }
          ],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                email: "aaditya.narayan@example.com",
                password: "SecurePass@123"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/auth/login", host: ["{{baseUrl}}"], path: ["auth", "login"] }
          }
        },
        {
          name: "Login Desk Officer",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "var jsonData = pm.response.json();",
                  "if (jsonData.token) {",
                  "  pm.collectionVariables.set('deskToken', jsonData.token);",
                  "}"
                ]
              }
            }
          ],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                email: "desk.central@police.gov.in",
                password: "OfficerPass@123"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/auth/login", host: ["{{baseUrl}}"], path: ["auth", "login"] }
          }
        },
        {
          name: "Login SHO",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "var jsonData = pm.response.json();",
                  "if (jsonData.token) {",
                  "  pm.collectionVariables.set('shoToken', jsonData.token);",
                  "}"
                ]
              }
            }
          ],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                email: "sho.central@police.gov.in",
                password: "OfficerPass@123"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/auth/login", host: ["{{baseUrl}}"], path: ["auth", "login"] }
          }
        },
        {
          name: "Login IO",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "var jsonData = pm.response.json();",
                  "if (jsonData.token) {",
                  "  pm.collectionVariables.set('ioToken', jsonData.token);",
                  "}"
                ]
              }
            }
          ],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                email: "io.patil@police.gov.in",
                password: "OfficerPass@123"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/auth/login", host: ["{{baseUrl}}"], path: ["auth", "login"] }
          }
        },
        {
          name: "Login Admin",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "var jsonData = pm.response.json();",
                  "if (jsonData.token) {",
                  "  pm.collectionVariables.set('adminToken', jsonData.token);",
                  "}"
                ]
              }
            }
          ],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                email: "admin@casesync.police.gov.in",
                password: "AdminPass@123"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/auth/login", host: ["{{baseUrl}}"], path: ["auth", "login"] }
          }
        },
        {
          name: "Get Current Profile (Me)",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{token}}" }],
            url: { raw: "{{baseUrl}}/auth/me", host: ["{{baseUrl}}"], path: ["auth", "me"] }
          }
        }
      ]
    },
    {
      name: "2. Complaint Filing & Citizen Portal",
      item: [
        {
          name: "File New Complaint (Submitted)",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "var res = pm.response.json();",
                  "if (res.data && res.data.fir_id) {",
                  "  pm.collectionVariables.set('complaintId', res.data.fir_id);",
                  "  pm.collectionVariables.set('firId', res.data.fir_id);",
                  "  pm.collectionVariables.set('trackingId', res.data.tracking_id);",
                  "}"
                ]
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{citizenToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                station_id: 1,
                category_id: 2,
                incident_date: "2026-10-23T09:15:00Z",
                incident_place: "Brigade Road, Bengaluru",
                incident_description: "Two men on a red pulsar snatched a handbag containing laptop and wallet.",
                is_draft: false
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/complaints", host: ["{{baseUrl}}"], path: ["complaints"] }
          }
        },
        {
          name: "Save Complaint as Draft",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{citizenToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                station_id: 1,
                category_id: 2,
                incident_date: "2026-10-23T09:15:00Z",
                incident_place: "MG Road Metro Station",
                incident_description: "Lost gold chain while exiting the train.",
                is_draft: true
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/complaints", host: ["{{baseUrl}}"], path: ["complaints"] }
          }
        },
        {
          name: "Check Duplicate Complaints",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{citizenToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                station_id: 1,
                category_id: 2,
                incident_date: "2026-10-23T09:15:00Z",
                incident_place: "Brigade Road"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/complaints/check-duplicate", host: ["{{baseUrl}}"], path: ["complaints", "check-duplicate"] }
          }
        },
        {
          name: "Get My Complaints",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{citizenToken}}" }],
            url: { raw: "{{baseUrl}}/complaints/my", host: ["{{baseUrl}}"], path: ["complaints", "my"] }
          }
        },
        {
          name: "Get Complaint Details",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{citizenToken}}" }],
            url: { raw: "{{baseUrl}}/complaints/{{complaintId}}", host: ["{{baseUrl}}"], path: ["complaints", "{{complaintId}}"] }
          }
        },
        {
          name: "Download Acknowledgement Slip",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{citizenToken}}" }],
            url: { raw: "{{baseUrl}}/complaints/{{complaintId}}/acknowledgement", host: ["{{baseUrl}}"], path: ["complaints", "{{complaintId}}", "acknowledgement"] }
          }
        }
      ]
    },
    {
      name: "3. Police Station Triage & FIR Registration",
      item: [
        {
          name: "Get Station Inbox (Desk Officer / SHO)",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{deskToken}}" }],
            url: { raw: "{{baseUrl}}/station/inbox?status=SUBMITTED", host: ["{{baseUrl}}"], path: ["station", "inbox"], query: [{ key: "status", value: "SUBMITTED" }] }
          }
        },
        {
          name: "Start Complaint Review",
          request: {
            method: "POST",
            header: [{ key: "Authorization", value: "Bearer {{deskToken}}" }],
            url: { raw: "{{baseUrl}}/firs/{{firId}}/review", host: ["{{baseUrl}}"], path: ["firs", "{{firId}}", "review"] }
          }
        },
        {
          name: "Tag Legal Penal Sections",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{deskToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                section_ids: [1, 2]
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/firs/{{firId}}/sections", host: ["{{baseUrl}}"], path: ["firs", "{{firId}}", "sections"] }
          }
        },
        {
          name: "Formal FIR Registration (SHO Approval)",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{shoToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                notes: "Cognizable complaint verified and sections approved."
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/firs/{{firId}}/register", host: ["{{baseUrl}}"], path: ["firs", "{{firId}}", "register"] }
          }
        },
        {
          name: "Get Registered FIR Slip",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{shoToken}}" }],
            url: { raw: "{{baseUrl}}/firs/{{firId}}/slip", host: ["{{baseUrl}}"], path: ["firs", "{{firId}}", "slip"] }
          }
        }
      ]
    },
    {
      name: "4. Investigation & Case Management",
      item: [
        {
          name: "Check IO Caseload Workload",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{shoToken}}" }],
            url: { raw: "{{baseUrl}}/cases/workload", host: ["{{baseUrl}}"], path: ["cases", "workload"] }
          }
        },
        {
          name: "Assign Investigating Officer (SHO)",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{shoToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                io_id: 3
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/cases/{{firId}}/assign", host: ["{{baseUrl}}"], path: ["cases", "{{firId}}", "assign"] }
          }
        },
        {
          name: "Accept Investigation Case (IO)",
          request: {
            method: "POST",
            header: [{ key: "Authorization", value: "Bearer {{ioToken}}" }],
            url: { raw: "{{baseUrl}}/cases/{{firId}}/accept", host: ["{{baseUrl}}"], path: ["cases", "{{firId}}", "accept"] }
          }
        },
        {
          name: "Add Case Diary Entry (IO)",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{ioToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                entry_date: "2026-10-23T14:30:00Z",
                activity_details: "Inspected robbery scene and interrogated local shopkeepers. Obtained security footage.",
                location: "Brigade Road Junction"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/cases/{{firId}}/updates", host: ["{{baseUrl}}"], path: ["cases", "{{firId}}", "updates"] }
          }
        },
        {
          name: "Add Suspect / Accused (IO)",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{ioToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                person_type: "SUSPECT",
                name: "Ramesh alias Kali",
                contact_number: "9812345678",
                address: "Shivajinagar, Bengaluru",
                statement: "Seen fleeing scene on black pulsar."
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/cases/{{firId}}/persons", host: ["{{baseUrl}}"], path: ["cases", "{{firId}}", "persons"] }
          }
        },
        {
          name: "Submit Chargesheet (IO)",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{ioToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                report_type: "CHARGESHEET",
                summary: "Investigation completed. Stolen property recovered and identified by victim."
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/cases/{{firId}}/submit-report", host: ["{{baseUrl}}"], path: ["cases", "{{firId}}", "submit-report"] }
          }
        },
        {
          name: "Review & Approve Chargesheet (SHO)",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{shoToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                approved: true,
                review_notes: "Approved for filing before Chief Metropolitan Magistrate."
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/cases/{{firId}}/review-report", host: ["{{baseUrl}}"], path: ["cases", "{{firId}}", "review-report"] }
          }
        },
        {
          name: "Get Full Case Details",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{shoToken}}" }],
            url: { raw: "{{baseUrl}}/cases/{{firId}}", host: ["{{baseUrl}}"], path: ["cases", "{{firId}}"] }
          }
        }
      ]
    },
    {
      name: "5. Evidence Management & Chain of Custody",
      item: [
        {
          name: "List Case Evidence",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{ioToken}}" }],
            url: { raw: "{{baseUrl}}/cases/{{firId}}/evidence", host: ["{{baseUrl}}"], path: ["cases", "{{firId}}", "evidence"] }
          }
        },
        {
          name: "Get Evidence Details & Custody Log",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{ioToken}}" }],
            url: { raw: "{{baseUrl}}/evidence/{{evidenceId}}", host: ["{{baseUrl}}"], path: ["evidence", "{{evidenceId}}"] }
          }
        },
        {
          name: "Verify Cryptographic SHA-256 Hash",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{ioToken}}" }],
            url: { raw: "{{baseUrl}}/evidence/{{evidenceId}}/verify", host: ["{{baseUrl}}"], path: ["evidence", "{{evidenceId}}", "verify"] }
          }
        },
        {
          name: "Log Custody Transfer to FSL Lab",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{ioToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                to_officer_id: 5,
                to_location: "State Forensic Science Laboratory (FSL) Madiwala",
                purpose: "Chemical and ballistic examination"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/evidence/{{evidenceId}}/transfer", host: ["{{baseUrl}}"], path: ["evidence", "{{evidenceId}}", "transfer"] }
          }
        }
      ]
    },
    {
      name: "6. Rejection Appeals & Transfers",
      item: [
        {
          name: "Citizen Files Rejection Appeal",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{citizenToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                appeal_reason: "CCTV footage proves assault occurred within station limits."
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/firs/{{firId}}/appeal", host: ["{{baseUrl}}"], path: ["firs", "{{firId}}", "appeal"] }
          }
        },
        {
          name: "Get Station Appeals Queue (SHO / Supervisor)",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{shoToken}}" }],
            url: { raw: "{{baseUrl}}/station/appeals", host: ["{{baseUrl}}"], path: ["station", "appeals"] }
          }
        },
        {
          name: "Review Appeal Decision (SHO / Supervisor)",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{shoToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                decision: "OVERTURNED",
                decision_notes: "Cognizable threshold satisfied upon re-review. Order registration."
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/firs/{{firId}}/review-appeal", host: ["{{baseUrl}}"], path: ["firs", "{{firId}}", "review-appeal"] }
          }
        },
        {
          name: "Initiate Zero FIR Transfer",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{shoToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                to_station_id: 2,
                transfer_reason: "Zero FIR transfer to jurisdictional police station."
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/cases/{{firId}}/transfer", host: ["{{baseUrl}}"], path: ["cases", "{{firId}}", "transfer"] }
          }
        },
        {
          name: "Get Incoming Station Transfers",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{shoToken}}" }],
            url: { raw: "{{baseUrl}}/station/transfers", host: ["{{baseUrl}}"], path: ["station", "transfers"] }
          }
        },
        {
          name: "Accept Case Transfer",
          request: {
            method: "POST",
            header: [{ key: "Authorization", value: "Bearer {{shoToken}}" }],
            url: { raw: "{{baseUrl}}/cases/{{firId}}/accept-transfer", host: ["{{baseUrl}}"], path: ["cases", "{{firId}}", "accept-transfer"] }
          }
        }
      ]
    },
    {
      name: "7. Court Outcomes & Case Reopening",
      item: [
        {
          name: "Record Court Trial Outcome (Conviction)",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{shoToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                court_name: "Chief Metropolitan Magistrate Court - 3",
                judge_name: "Hon. Justice V. Ramaswamy",
                verdict_date: "2026-10-23",
                verdict_type: "CONVICTION",
                sentence_details: "3 years rigorous imprisonment and INR 25,000 fine.",
                disposal_nature: "JUDICIAL_CONVICTION"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/cases/{{firId}}/court-outcome", host: ["{{baseUrl}}"], path: ["cases", "{{firId}}", "court-outcome"] }
          }
        },
        {
          name: "Get Court Trial Outcome",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{shoToken}}" }],
            url: { raw: "{{baseUrl}}/cases/{{firId}}/court-outcome", host: ["{{baseUrl}}"], path: ["cases", "{{firId}}", "court-outcome"] }
          }
        },
        {
          name: "Reopen Case on New Material Evidence",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{shoToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                reopen_reason: "New ballistic ballistics match linking secondary accomplice."
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/cases/{{firId}}/reopen", host: ["{{baseUrl}}"], path: ["cases", "{{firId}}", "reopen"] }
          }
        }
      ]
    },
    {
      name: "8. Public Tracking & Timeline",
      item: [
        {
          name: "Public Status Lookup (No Auth)",
          request: {
            method: "GET",
            url: { raw: "{{baseUrl}}/tracking/track/{{trackingId}}", host: ["{{baseUrl}}"], path: ["tracking", "track", "{{trackingId}}"] }
          }
        },
        {
          name: "Get Chronological Case Progression Timeline",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{citizenToken}}" }],
            url: { raw: "{{baseUrl}}/tracking/firs/{{firId}}/timeline", host: ["{{baseUrl}}"], path: ["tracking", "firs", "{{firId}}", "timeline"] }
          }
        },
        {
          name: "Submit Citizen Feedback on Closed Case",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{citizenToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                rating: 5,
                comments: "Exceptional promptness and transparent updates from the station."
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/tracking/firs/{{firId}}/feedback", host: ["{{baseUrl}}"], path: ["tracking", "firs", "{{firId}}", "feedback"] }
          }
        }
      ]
    },
    {
      name: "9. Notifications",
      item: [
        {
          name: "Get All Notifications",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{token}}" }],
            url: { raw: "{{baseUrl}}/notifications", host: ["{{baseUrl}}"], path: ["notifications"] }
          }
        },
        {
          name: "Get Unread Notifications Count",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{token}}" }],
            url: { raw: "{{baseUrl}}/notifications/unread-count", host: ["{{baseUrl}}"], path: ["notifications", "unread-count"] }
          }
        },
        {
          name: "Mark All Notifications as Read",
          request: {
            method: "PATCH",
            header: [{ key: "Authorization", value: "Bearer {{token}}" }],
            url: { raw: "{{baseUrl}}/notifications/read-all", host: ["{{baseUrl}}"], path: ["notifications", "read-all"] }
          }
        }
      ]
    },
    {
      name: "10. Audit Trail & Cryptographic Verification",
      item: [
        {
          name: "Query Audit Log Explorer",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
            url: { raw: "{{baseUrl}}/audit?limit=25", host: ["{{baseUrl}}"], path: ["audit"], query: [{ key: "limit", value: "25" }] }
          }
        },
        {
          name: "Verify Cryptographic SHA-256 Forward Hash Chain",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
            url: { raw: "{{baseUrl}}/audit/verify", host: ["{{baseUrl}}"], path: ["audit", "verify"] }
          }
        }
      ]
    },
    {
      name: "11. Reports & Analytical Intelligence",
      item: [
        {
          name: "Disposal Rate Report",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
            url: { raw: "{{baseUrl}}/reports/disposal-rate", host: ["{{baseUrl}}"], path: ["reports", "disposal-rate"] }
          }
        },
        {
          name: "Pending FIRs Aging Analysis",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
            url: { raw: "{{baseUrl}}/reports/pending-firs", host: ["{{baseUrl}}"], path: ["reports", "pending-firs"] }
          }
        },
        {
          name: "Crime Hotspots Analysis",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
            url: { raw: "{{baseUrl}}/reports/crime-hotspots", host: ["{{baseUrl}}"], path: ["reports", "crime-hotspots"] }
          }
        },
        {
          name: "IO Performance Matrix",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
            url: { raw: "{{baseUrl}}/reports/io-performance", host: ["{{baseUrl}}"], path: ["reports", "io-performance"] }
          }
        },
        {
          name: "Crime Category Breakdown",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
            url: { raw: "{{baseUrl}}/reports/category-breakdown", host: ["{{baseUrl}}"], path: ["reports", "category-breakdown"] }
          }
        },
        {
          name: "Active SLA Breaches Report",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
            url: { raw: "{{baseUrl}}/reports/sla-breaches", host: ["{{baseUrl}}"], path: ["reports", "sla-breaches"] }
          }
        },
        {
          name: "Export Disposal Report as CSV",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
            url: { raw: "{{baseUrl}}/reports/disposal-rate/export", host: ["{{baseUrl}}"], path: ["reports", "disposal-rate", "export"] }
          }
        }
      ]
    },
    {
      name: "12. System Administration",
      item: [
        {
          name: "List Police Stations",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
            url: { raw: "{{baseUrl}}/admin/stations", host: ["{{baseUrl}}"], path: ["admin", "stations"] }
          }
        },
        {
          name: "Create Police Station",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{adminToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                station_code: "PS-06",
                name: "Whitefield Tech Police Station",
                division: "East Division",
                district: "Bengaluru City",
                contact_phone: "080-22942599",
                address: "ITPL Main Road, Whitefield"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/admin/stations", host: ["{{baseUrl}}"], path: ["admin", "stations"] }
          }
        },
        {
          name: "List All Users & Officers",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
            url: { raw: "{{baseUrl}}/admin/users", host: ["{{baseUrl}}"], path: ["admin", "users"] }
          }
        },
        {
          name: "List Crime Categories",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
            url: { raw: "{{baseUrl}}/admin/categories", host: ["{{baseUrl}}"], path: ["admin", "categories"] }
          }
        },
        {
          name: "List Legal Penal Sections",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
            url: { raw: "{{baseUrl}}/admin/legal-sections", host: ["{{baseUrl}}"], path: ["admin", "legal-sections"] }
          }
        },
        {
          name: "Get SLA Configurations",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
            url: { raw: "{{baseUrl}}/admin/sla", host: ["{{baseUrl}}"], path: ["admin", "sla"] }
          }
        },
        {
          name: "Update SLA Configuration Threshold",
          request: {
            method: "PUT",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{adminToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                duration_hours: 48,
                description: "Desk officer initial review window"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/admin/sla/DESK_REVIEW_HOURS", host: ["{{baseUrl}}"], path: ["admin", "sla", "DESK_REVIEW_HOURS"] }
          }
        }
      ]
    }
  ]
};

// Target docs directory
const docsDir = path.resolve(__dirname, '../../docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// 1. Write openapi_spec.json
const openApiPath = path.join(docsDir, 'openapi_spec.json');
fs.writeFileSync(openApiPath, JSON.stringify(openapi, null, 2), 'utf-8');
console.log(`[OK] Successfully wrote OpenAPI 3.0 specification to: ${openApiPath}`);

// 2. Write CaseSync_Postman_Collection.json
const postmanPath = path.join(docsDir, 'CaseSync_Postman_Collection.json');
fs.writeFileSync(postmanPath, JSON.stringify(postmanCollection, null, 2), 'utf-8');
console.log(`[OK] Successfully wrote Postman Collection v2.1.0 to: ${postmanPath}`);
