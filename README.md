# CADD Centre Lanka — Unified Management System

A single Next.js 15 application combining:
- **ASMS** — Academic & Student Management System (student-facing portal + academic admin)
- **IMS** — Institute Management System (operations, marketing, finance, HR)

---

## Architecture Overview

```
cadd-centre-unified/
├── app/
│   ├── (main)/              # Student-facing public site
│   │   ├── page.tsx         # Landing page
│   │   ├── dashboard/       # Student portal
│   │   ├── courses/         # Course catalogue
│   │   ├── my-courses/      # Enrolled courses
│   │   ├── my-attendance/   # Attendance tracker
│   │   ├── my-progress/     # Module progress
│   │   ├── my-results/      # Exam results
│   │   ├── my-certificates/ # Certificates
│   │   ├── resources/       # Learning materials
│   │   └── verify/[id]/     # Certificate QR verification
│   │
│   ├── admin/               # ASMS Admin (admin/academic_manager roles)
│   │   ├── students/        # Student management
│   │   ├── courses/         # Course CRUD
│   │   ├── modules/         # Module management
│   │   ├── batches/         # Batch scheduling
│   │   ├── trainers/        # Trainer management
│   │   ├── enrollments/     # Enrollment management
│   │   ├── attendance/      # Attendance marking
│   │   ├── assessments/     # Exam management
│   │   ├── certificates/    # Certificate generation
│   │   ├── resources/       # Resource library
│   │   ├── leads/           # Student leads (ASMS)
│   │   ├── reports/         # Academic reports
│   │   └── ims/             # ← IMS NESTED SECTION
│   │       ├── page.tsx     # IMS overview
│   │       ├── marketing/   # Leads pipeline & campaigns
│   │       ├── academic/    # IMS-side academic ops
│   │       ├── finance/     # Payments, invoices, expenses
│   │       ├── hr/          # Leaves, salary, performance
│   │       ├── users/       # Staff user management
│   │       ├── tasks/       # Cross-dept shared tasks
│   │       ├── roster/      # Duty/shift scheduling
│   │       └── control-panel/ # System commands (super admin)
│   │
│   └── auth/
│       ├── login/
│       └── register/
│
├── components/
│   ├── layout/
│   │   ├── admin-sidebar.tsx  # Unified sidebar (ASMS + IMS sections)
│   │   ├── navbar.tsx
│   │   └── footer.tsx
│   └── ui/                    # shadcn/ui components
│
├── lib/
│   ├── auth.ts                # Supabase auth (unified roles)
│   ├── data.ts                # ASMS data layer
│   ├── ims-data.ts            # IMS data layer (replaces Firebase)
│   ├── supabase.ts            # Browser client
│   └── supabase-server.ts     # Server client
│
├── types/
│   └── index.ts               # All types (ASMS + IMS)
│
├── DB_UNIFIED_SCHEMA.sql      # ← Run this first
└── DB_IMS_ACADEMIC_MIGRATION.sql # ← Run this second
```

---

## User Roles & Access

| Role | Area | Access |
|------|------|--------|
| `admin` / `super_admin` | Both ASMS + IMS | Full control |
| `branch_manager` | Both ASMS + IMS | View all + reports |
| `academic_manager` | ASMS Admin | Courses, batches, trainers |
| `trainer` | ASMS Admin | Attendance, progress |
| `coordinator` | ASMS Admin | Enrollment, scheduling |
| `marketing_staff` | IMS → Marketing | Leads & campaigns |
| `academic_staff` | IMS → Academic | Students, courses, batches |
| `finance_officer` | IMS → Finance | Payments, invoices |
| `hr_officer` | IMS → HR | Staff, leaves, salary |
| `staff` | IMS → Tasks/Roster | Shared tasks only |
| `student` | Student Portal | Own data only |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. .env.local is already included with Project 1's real Supabase keys.
#    No configuration needed.

# 3. Add IMS tables to the live Project 1 database (ONE-TIME, safe)
#    Go to: https://supabase.com/dashboard/project/srpigxhvwmirvlouxxxa/sql/new
#    Paste the contents of DB_IMS_ADDON.sql → click Run
#    This NEVER drops or touches any existing ASMS data.

# 4. Start the dev server
npm run dev
```

Visit `http://localhost:3000`

> **Your existing Project 1 data** (students, courses, batches, enrollments, etc.)
> loads immediately — no migration needed, same database, same keys.

---

## Database

Single Supabase (PostgreSQL) instance with:
- **ASMS tables**: `profiles`, `courses`, `modules`, `batches`, `enrollments`, `attendance`, `assessments`, `certificates`, `learning_resources`, `events`
- **IMS tables**: `marketing_leads`, `marketing_campaigns`, `ims_payments`, `ims_invoices`, `ims_expenses`, `hr_leave_requests`, `hr_salary_payouts`, `hr_performance_reviews`, `hr_roster`, `ops_tasks`, `ops_minute_trackers`, `ims_login_history`, `ims_system_commands`
- **Row Level Security** on all tables
- **Realtime subscriptions** for marketing leads and tasks

---

## Firebase Migration

Firebase data has been exported to CSV files in `project_2_datastore_firebase.zip`. See `DB_IMS_ACADEMIC_MIGRATION.sql` for the complete migration guide.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **Database**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **PDF**: jsPDF
- **Excel**: xlsx
- **Animations**: Framer Motion
- **Notifications**: Sonner
