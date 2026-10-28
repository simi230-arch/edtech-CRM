# Complete Sales CRM & Outreach Tracking Dashboard

A production-minded, responsive, multi-device web application engineered for sales, outreach tracking, and business development for an EdTech startup selling industry-oriented IT training courses to BTech engineering colleges across India.

---

## 🌟 Key Capabilities & Features

### 1. Authentication & Security
- **Bcrypt Password Hashing**: Passwords are never stored in plaintext.
- **JWT Session Tokens**: 7-day expiration with secure bearer header authorization.
- **Multi-Tenant Ownership Isolation**: Strict server-side user scoping (`WHERE user_id = ?`) preventing one user from accessing another user's leads or notes.
- **Persistent Storage**: Real relational SQLite database (`crm.sqlite`) that survives server restarts.

### 2. Main Executive Dashboard
- **10 Dynamic Summary Cards** (Calculated directly from real database records, never hardcoded):
  1. Total Colleges Added
  2. New Leads
  3. Calls Made
  4. Connected Calls (with connection rate percentage)
  5. Meetings Scheduled
  6. Proposals Sent
  7. Interested Colleges
  8. Converted Customers (Won deals with closed revenue)
  9. Follow-ups Due Today
  10. Overdue Follow-ups
- **Live Interactive Charts**:
  - Leads by Status (Distribution breakdown across all 12 pipeline stages)
  - Conversion Funnel (Leads → Engaged → Demo → Proposal → Won)
  - Calls & Outreach Activity (Daily call volume and connected calls over 30 days)
  - Geographic Footprint across India (Top States & Tech Hub Cities)
  - Lead Acquisition Sources & Referral Efficiency (Channel win rates & Top Startup Partners)
- **Urgent Action Hub**: Real-time alerts for overdue calls and tasks due today with 1-click access to the college dossier.

### 3. College Lead Management
- Dedicated fields specifically tailored to Indian engineering colleges:
  - **College Name, Type** (Government, Private, Autonomous, Other)
  - **State, City, Full Address, Official Email, Phone, Website**
  - **Student Population**, **Target Student Years** (2nd, 3rd, 4th year)
  - **Relevant BTech Branches** (CSE, IT, ECE, AI&DS, ISE, Cyber Security)
  - **Placement Cell Contact Person**, **Designation** (Placement Head, TPO, HOD CSE)
  - **Contact Direct Phone & Email**
  - **Lead Source** (Cold Call, Referral, LinkedIn, Email, Event, Other)
  - **Linked Startup Partner** & **Referred By**
  - **Priority** (High, Medium, Low) & **Estimated Batch Students**
- **Proactive Duplicate Prevention**: Automatically warns when a college with the same name, website, or phone number already exists in your CRM before saving.
- **Fast Filtering, Sorting & Pagination**: Search by college name, city, placement head, phone; filter by stage, state, priority, or follow-up schedule.
- **Archive / Restore & Soft Deletion**: Archive inactive leads or permanently delete with confirmation safety dialogs.

### 4. Call & Communication Tracker
- Every college has its own chronological interaction history.
- Log interactions with:
  - **Channel**: Phone, Email, WhatsApp, Meeting (In-person / Virtual), Other
  - **Call Outcome**: No Answer, Busy, Connected, Interested, Not Interested, Callback Requested, Meeting Scheduled, Wrong Number
  - **Conversation Notes**
  - **Questions Asked by the Placement Head**
  - **Objections Raised** (e.g. VTU/Anna University syllabus clash, lab availability)
  - **Promised Documents or Information** (e.g. curriculum mapping against AICTE credits)
  - **Next Action & Next Follow-up Date/Time**
- Automatic task creation linked to call logs.
- Previous notes are never overwritten.

### 5. Follow-up & Task Management
- Dedicated Follow-up Center grouped into:
  - **Overdue Tasks** (clearly highlighted in red with alert flags)
  - **Due Today** (amber highlight)
  - **Upcoming Scheduled Tasks**
  - **Completed Tasks History**
- **1-Click Task Completion** with automated timestamp recording.
- **Reschedule Modal**: Reschedule tasks with custom reasoning and preserve prior dates for accountability.
- Next follow-up date displayed directly in main lead table.

### 6. 12-Stage Sales Pipeline
1. `New Lead`
2. `Contact Identified`
3. `First Call Attempted`
4. `Connected`
5. `Interested`
6. `Meeting Scheduled`
7. `Demo Completed`
8. `Proposal Sent`
9. `Negotiation`
10. `Won`
11. `Lost`
12. `Follow-up Later`
- **Interactive Kanban Board & Table Views**.
- **Stage Transition Audit Trail**: Full historical log (`stage_history`) recording timestamps and reasons for every move.
- **Data Integrity Safeguards**:
  - When marked **Lost**: Enforces recording the reason for deal loss.
  - When marked **Won**: Enforces saving the formal Agreement Date, Agreed Pricing per Student, and Expected Student Count.
  - Never treats verbal interest or scheduled meetings as confirmed sales.

### 7. Startup Connections & Referral Network
- Track founder's network across tech startups in Bengaluru, Pune, Hyderabad, Gurugram, and Noida.
- Stores:
  - Startup Name, Industry, Website, City
  - Contact Person & Designation, Email & Phone
  - Relationship Strength (Strong, Warm, Acquaintance)
  - Collaboration Types (Guest Lectures, Industry Mentors, Course Design, Projects, Internships, Hiring Partnerships, Referrals)
  - Current Collaboration Status (Exploring, Active Partner, On Hold, Inactive)
- **Referral Attribution**: Links startup contacts to college leads when introduced. Automatically tracks which startup partners generate qualified leads and closed revenue.

### 8. Course Catalogue & Commercial Proposals
- **Standardized IT Course Catalogue**:
  - Full Stack MERN & Next.js Production Engineering
  - Applied Generative AI & Machine Learning with Python
  - Enterprise Cloud Infrastructure & DevOps Pipeline
  - Enterprise Java, Microservices & Spring Boot 3
- Stores syllabus links, accredited certificate details, fee models (per student), minimum batch sizes, placement guidance, and approved claims & limitations.
- **Proposal Creator & Commercial Tracker**:
  - Links courses to colleges.
  - Tracks status (Draft, Sent, Under Review, Revised, Accepted, Rejected), quoted fee, student count, total deal value, and next action.

### 9. Data Export & CSV Import
- **CSV Exports**:
  - College Leads CSV
  - Call Activity Logs CSV
  - Follow-up Tasks CSV
  - Startup Partners CSV
  - Proposals Pipeline CSV
- **Full Database Binary Backup**: 1-click raw download of `crm_backup.sqlite` for external archiving or DBeaver analysis.
- **CSV Import with Header Mapping**: Import college lists from spreadsheets with automated column header detection and duplicate skipping.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18+ or v20+ or v24+)
- npm

### 1. Clone or Open Project
```powershell
cd C:\Users\simi\CRM
```

### 2. Environment Setup
The repository includes pre-configured `.env` and `.env.example` files:
```env
PORT=5000
JWT_SECRET=super-secure-edtech-crm-jwt-secret-key-2026-btech
NODE_ENV=development
DB_PATH=./crm.sqlite
```

### 3. Run the Application
You can run both the Express backend and React Vite frontend together:
```powershell
npm run dev
```
Or run the production server (which serves the compiled frontend bundle):
```powershell
npm start
```

- **Web Application URL**: [http://localhost:5000](http://localhost:5000)
- **Vite Hot-Reload Dev URL**: [http://localhost:5173](http://localhost:5173)

---

## 🔑 Default Credentials & First Account Setup

You can immediately sign in using the pre-seeded Founder account or click **"Create Account"** on the login screen to register your own account:

- **Email**: `founder@edtech-btech.com`
- **Password**: `Password123!`

---

## 📱 Mobile & Android Tablet Access

The server binds to `0.0.0.0:5000`, allowing access from your phone or tablet on the same Wi-Fi network:

1. Open PowerShell and run:
   ```powershell
   ipconfig
   ```
2. Locate your **IPv4 Address** (e.g., `192.168.1.45`).
3. Open Chrome or any browser on your Android phone or iPad:
   ```
   http://192.168.1.45:5000
   ```
4. Sign in to review leads, log calls while on campus visits, and manage follow-ups.

---

## 💾 Backing Up Your Data

1. **Via UI**: Navigate to **Settings & Data** and click **"Download Database Backup"** to save `crm_backup.sqlite`.
2. **Via File System**: Copy `C:\Users\simi\CRM\crm.sqlite` to your Google Drive, OneDrive, or backup drive.
3. **Via Spreadsheets**: Export individual CSV reports for Colleges, Activities, Tasks, Startups, and Proposals.

---

## ☁️ Secure Cloud Deployment (Render / Railway / VPS)

1. **Docker / Container / Node.js Host**:
   - Build frontend: `npm run build`
   - Start command: `node server/index.js`
   - Set environment variables: `JWT_SECRET`, `NODE_ENV=production`, `PORT=5000`.
2. Ensure persistent disk volume is mounted at `./crm.sqlite` to preserve records across deployments.
