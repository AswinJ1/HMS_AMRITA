# HMS Amrita — System Documentation

> **Hostel Stayback Management System**
> Amrita Vishwa Vidyapeetham

---

## Table of Contents

1. [Overview](#overview)
2. [User Roles](#user-roles)
3. [Registration Flow](#registration-flow)
4. [Login Flow](#login-flow)
5. [Stayback Request Flow](#stayback-request-flow)
6. [Cascading Approval Flow](#cascading-approval-flow)
7. [Security Tracking](#security-tracking)
8. [Admin Capabilities](#admin-capabilities)
9. [Notifications](#notifications)
10. [Dashboard Pages](#dashboard-pages)
11. [Profile Management](#profile-management)
12. [Tech Stack](#tech-stack)

---

## Overview

HMS Amrita is a role-based multi-stage hostel stayback approval system. Students and team leads submit stayback requests, which go through a cascading approval chain (Team Lead → Staff → Hostel Warden). After approval, security personnel track entry/exit at the gate.

---

## User Roles

| Role | Created By | Login Method | Primary Purpose |
|------|-----------|-------------|-----------------|
| **ADMIN** | Seeded / Manual | Email + Password | System management, user creation |
| **STUDENT** | Self-registration | Email + Password | Submit stayback requests |
| **TEAM_LEAD** | Promoted by Staff | UID + Password | Approve student requests + submit own requests |
| **STAFF** | Admin | UID + Password | Approve requests, promote students to TL |
| **HOSTEL** (Warden) | Admin | UID + Password | Final approval of requests |
| **SECURITY** | Admin | UID + Password | Gate monitoring — mark IN/OUT |

---

## Registration Flow

> Only **Students** can self-register. All other roles are created by the Admin.

### Step 1 — Account Credentials
| Field | Validation |
|-------|-----------|
| Full Name | Min 2 characters |
| Email | Valid email, unique |
| University ID | 5–25 characters (letters, numbers, dots), unique |
| Password | Min 6 chars, 1 uppercase, 1 number |
| Confirm Password | Must match password |

### Step 2 — Personal Details
| Field | Source | Validation |
|-------|--------|-----------|
| Club / Team | Static list from `src/lib/clubs.ts` | Required (ICPC@Amrita, amFOSS, DreamTeam, bi0s) |
| Hostel | DB — from Hostel Warden records created by Admin | Required |
| Room Number | Manual input | Required |
| Phone Number | Manual input | Exactly 10 digits |

> **Note:** Club and Hostel can only be changed later by an Admin.

### What happens on submit
1. Creates a `User` record with role `STUDENT`
2. Hashes password with bcryptjs (12 rounds)
3. Creates a linked `Student` profile
4. Redirects to login page

---

## Login Flow

```
User selects role → enters credentials → server validates → JWT token → redirect to dashboard
```

| Role | Required Fields | Redirect |
|------|----------------|----------|
| ADMIN | Email + Password | `/admin` |
| STUDENT | Email + Password | `/student` |
| STAFF | UID + Password | `/staff` |
| TEAM_LEAD | UID + Password | `/team-lead` |
| HOSTEL | UID + Password | `/hostel` |
| SECURITY | UID + Password | `/security` |

### Error Messages
- No account found → "No account found with the provided email or UID."
- Wrong role → "Your account role does not match the selected role."
- Wrong password → "Incorrect password. Please try again."
- Missing fields → Field-specific message

---

## Stayback Request Flow

### Student Request (3-stage approval)

```
Student fills form → StaybackRequest created (stage: TEAM_LEAD_PENDING)
                   → 3 approval records created (Team Lead, Staff, Warden)
```

**Form fields:**
| Field | Behavior |
|-------|---------|
| Club / Team | Auto-filled from profile (locked) |
| Date | Date picker (today or future) |
| From Time | Time input (HH:MM) |
| To Time | Time input (HH:MM) |
| Remarks | Textarea (min 10 chars) |
| Team Lead | Auto-matched by club name (locked) |
| Staff Advisor | Manual selection from dropdown |
| Hostel Warden | Auto-matched by hostel name (locked) |

### Team Lead Request (2-stage approval)

```
Team Lead fills form → StaybackRequest created (stage: STAFF_PENDING)
                     → 2 approval records created (Staff, Warden)
```

Same form as student but:
- No team lead field (skips TL approval)
- Hostel warden auto-matched from their student record's hostel
- Starts at STAFF_PENDING stage

---

## Cascading Approval Flow

### Student Request — 3 Stages

```
┌─────────────────────────────────┐
│      TEAM_LEAD_PENDING          │
│  Team Lead approves / rejects   │
└──────────┬──────────────────────┘
           │ APPROVED
           ▼
┌─────────────────────────────────┐
│       STAFF_PENDING             │
│  Staff approves / rejects       │
└──────────┬──────────────────────┘
           │ APPROVED
           ▼
┌─────────────────────────────────┐
│      WARDEN_PENDING             │
│  Warden approves / rejects      │
└──────────┬──────────────────────┘
           │ APPROVED
           ▼
┌─────────────────────────────────┐
│       COMPLETED ✓               │
│  Security can now mark IN/OUT   │
└─────────────────────────────────┘

  * Any REJECT at any stage → REJECTED (terminal)
```

### Team Lead Request — 2 Stages

```
STAFF_PENDING → WARDEN_PENDING → COMPLETED
```

### What each approver sees
| Role | Sees requests at stage | Actions |
|------|----------------------|---------|
| Team Lead | `TEAM_LEAD_PENDING` | Approve / Reject + Comments |
| Staff | `STAFF_PENDING` | Approve / Reject + Comments |
| Hostel Warden | `WARDEN_PENDING` | Approve / Reject + Comments |

### On Approve
- Approval record status → `APPROVED`
- Request stage advances to next stage
- If warden approves → stage = `COMPLETED`, status = `APPROVED`

### On Reject
- Approval record status → `REJECTED`
- Request stage → `REJECTED`
- Request status → `REJECTED`

---

## Security Tracking

After a request reaches **COMPLETED** (fully approved), security can track it.

### Security Dashboard
| Stat | Description |
|------|------------|
| Active Requests | Requests at WARDEN_PENDING or COMPLETED stage |
| Checked In | Students currently marked IN |
| Checked Out | Students marked OUT |
| Today's Checks | Total IN/OUT actions today |

### Gate Monitoring Flow
```
Approved request appears in security panel
         │
    Security marks ──→ IN (student enters)
         │
    Security marks ──→ OUT (student leaves)
```

### Tracked Fields (on StaybackRequest)
| Field | Description |
|-------|------------|
| `securityStatus` | `IN`, `OUT`, or `null` (not checked) |
| `securityCheckedBy` | Name of security officer |
| `securityCheckedAt` | Timestamp of last check |

---

## Admin Capabilities

### User Management (`/admin/users`)
- **Create users:** Staff, Hostel Warden, Security
  - Fields: email, UID, password, name, role, department/hostelName
- **View all users** in a searchable table
- **Edit any user's profile:** email, UID, name, department, club, hostel, room, phone

### Activity Logs (`/admin/logs`)
- View all stayback requests system-wide
- Filter by: date range, status, stage, club, hostel
- Request statistics grouped by stage

### Student → Team Lead Promotion
- Staff promotes a student via `/api/users/promote`
- Creates `TeamLead` record linked to same user
- Updates user role to `TEAM_LEAD`
- Sets `student.isTeamLead = true`
- Student record persists (retains hostelName for stayback form)

---

## Notifications

### Notification Bell (header, all roles)
- Polls `/api/notifications` every 30 seconds
- Displays unread count badge
- Notification types:
  - ✅ **Approval** — request approved
  - ❌ **Rejection** — request rejected
  - ℹ️ **Info** — general updates
  - ⏳ **Pending** — awaiting action
- Mark individual or all as read

---

## Dashboard Pages

### Student (`/student`)
- **Stats:** Total requests, In Progress, Approved, Rejected
- Recent requests table with status badges
- Quick action: "New Request"
- Sub-pages: `/student/requests`, `/student/stayback`, `/student/profile`

### Team Lead (`/team-lead`)
- **Stats:** Pending reviews, Total assigned, My requests, My in progress
- Dual view: approvals to review + own requests
- Quick actions: "Approvals", "New Request"
- Sub-pages: `/team-lead/approvals`, `/team-lead/requests`, `/team-lead/stayback`

### Staff (`/staff`)
- **Stats:** Pending reviews, Total assigned, Approved, Rejected
- Pending approvals at STAFF_PENDING
- Quick action: "Review Approvals"
- Sub-pages: `/staff/approvals`, `/staff/students`

### Hostel Warden (`/hostel`)
- **Stats:** Pending reviews, Total assigned, Approved, Rejected
- Pending approvals at WARDEN_PENDING (final stage)
- Review dialog shows prior approvals + security status
- Sub-pages: `/hostel/approvals`

### Security (`/security`)
- **Stats:** Active requests, Checked In, Checked Out, Today's Checks
- Gate monitoring interface
- Sub-pages: `/security/gate`

### Admin (`/admin`)
- **Stats:** Total users, Staff & Wardens, Students & Team Leads, Total requests
- Stage breakdown
- Quick actions: "View Logs", "Manage Users"
- Sub-pages: `/admin/users`, `/admin/logs`, `/admin/settings`

---

## Profile Management

### What users can edit themselves
| Role | Editable Fields |
|------|----------------|
| Student | Name, Phone, Room Number, Password |
| Team Lead | Name, Password |
| Staff | Name, Department, Password |
| Hostel | Name, Password |
| Security | Name, Department, Password |
| Admin | Name, Password |

### Admin-only changes
- Club name (Student / Team Lead)
- Hostel name (Student)
- Email, UID (all roles)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | NextAuth.js (JWT strategy, bcryptjs) |
| UI | Tailwind CSS, shadcn/ui |
| Validation | Zod (server + client) |
| State | React hooks |
| Notifications | Polling-based |

### Key Files
| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database models |
| `src/lib/auth.ts` | NextAuth configuration |
| `src/lib/clubs.ts` | Static club list for registration |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/lib/validations/auth.ts` | Zod schemas for auth |
| `src/lib/validations/stayback.ts` | Zod schemas for stayback |
| `src/app/middleware.ts` | Route protection middleware |
