# CampusConnect: Democratizing Campus Recruitment

**CampusConnect** is a comprehensive, full-stack recruitment platform designed to bridge the gap between Students, Educational Institutions, and Corporate Recruiters. More than just a job board, it is an ecosystem built to ensure equal opportunity for all graduates.

---

## The Problem It Solves: Breaking the College Monopoly

Historically, premium companies have focused their campus recruitment efforts almost exclusively on elite or "famous" universities. This creates an institutional monopoly where brilliant students from lesser-known, regional, or tier-2/tier-3 colleges are marginalized simply because of their college's brand name. 

**CampusConnect democratizes opportunity.** By unifying talent pools across multiple colleges into a single, standardized platform, recruiters can filter and discover candidates based on verified skills, projects, and academic merit rather than college prestige. It breaks the geographical and institutional barriers, ensuring that top talent is discovered regardless of where they study.

---

## Business Model & Competitive Advantage

CampusConnect operates on a **B2B2C model** where Colleges and Companies are the primary stakeholders, and Students are the end-users. 

### When to use CampusConnect over other platforms?
* **Vs. Generic Job Boards (LinkedIn, Indeed):** Generic boards are too broad and lack the specific workflow required for campus placement drives (like college verifications, placement officer approvals, and bulk campus hiring). CampusConnect is purpose-built for the campus recruitment lifecycle.
* **Vs. Legacy Placement Software:** Most existing college software operates in a silo—useful only for managing a single college's internal database. CampusConnect acts as a network, connecting multiple colleges to a centralized pool of companies, vastly expanding the opportunities available to any single institution.
* **For Companies:** Use CampusConnect when you want to scale your fresh-graduate hiring without the logistical nightmare of physically traveling to 50 different campuses. 
* **For Colleges:** Use CampusConnect to replace fragmented WhatsApp groups and Excel sheets with a professional, trackable portal that guarantees your students broader corporate visibility.

---

## Technical Architecture

To support high-concurrency placement drives (where thousands of students might apply for a role in minutes), the platform is architected for maximum scalability, security, and responsiveness.

1. **High-Performance Asynchronous Backend (FastAPI + Motor):** 
   Built with Python's FastAPI, the backend handles asynchronous requests natively. Paired with MongoDB's Motor async driver, it ensures non-blocking I/O operations, providing high throughput and low latency essential for traffic spikes.
2. **Optimized Client-Side State & Caching (React + TanStack Query):** 
   Utilizes TanStack Query for automatic background data synchronization, periodic polling (e.g., real-time notifications every 8s), and client-side caching. This drastically reduces unnecessary network payloads and ensures optimistic UI updates.
3. **Decoupled & Scalable Design:** 
   The frontend and backend are completely decoupled, communicating via RESTful APIs. This allows independent scaling of the API servers and static frontend delivery via CDNs.
4. **Strict Role-Based Access Control (RBAC):** 
   A custom, highly secure authentication flow utilizing JWT and bcrypt. It routes and isolates data access across four distinct tenancy levels: Super Admin, College Admin, Company Recruiter, and Student.

---

## Platform Features

### For Super Admin
* **Real-Time Login Alerts:** Receive instant in-app notification alerts whenever any user (Student, College, or Company) logs into CampusConnect.
* **Live Activity Logs & Analytics:** Track user logins, signups, and password events with interactive 7-day visual engagement charts.
* **Institutional Governance:** Review, verify, and suspend or unsuspend colleges and corporate accounts.
* **Platform Contact Settings:** Dynamically update public contact info and external channels directly from the dashboard.

### For Students
* **Merit-Based Profiling:** Build digital resumes highlighting skills and achievements rather than just institution names.
* **Universal Job Discovery:** Browse internships and jobs from companies extending offers across the platform network.
* **One-Click Applications:** Apply and track application statuses (in review, shortlisted, selected) in real time.

### For Companies
* **Centralized ATS:** Review applications, shortlist candidates, and manage interview pipelines across multiple colleges from a single dashboard.
* **Skill-First Talent Search:** Query the global student database for specific skill sets, ignoring institutional biases.
* **Broadcast Postings:** Publish job descriptions directly to multiple targeted colleges simultaneously.

### For Colleges
* **Streamlined Placement Cell:** Oversee student registrations and approve authentic company partnerships.
* **Placement Analytics:** Track placement success, average packages, and top recruiters through visual dashboards.
* **Selected Job Management:** Monitor confirmed job opportunities and candidate shortlists for institutional students.

### Customization & User Experience
* **Preferences & Appearance:** Fully customizable **Language** (English, Hindi, Spanish, French, German, Japanese), **Timezone** (IST, UTC, EST, GMT, etc.), **Theme Mode** (Light, Dark, System Default), **Brand Accent Color**, and **Compact Mode**.
* **Dual Persistence:** User settings persist instantly in `localStorage` and sync to MongoDB via `/auth/preferences`.
* **Split-Screen Authentication:** Modern SaaS split-screen login layout with brand showcase, value pillars, and responsive form controls.
* **Interactive Notifications:** Notification bell with animated ping badge, unread counters, filter tabs, single-click mark as read, and bulk clear actions.

---

## Project Structure

```text
CampusConnect/
├── backend/
│   ├── core/
│   │   ├── config.py           # Pydantic Settings & environment variables
│   │   └── security.py         # Passlib bcrypt hashing & JWT token handling
│   ├── models/
│   │   └── user.py             # User models and RBAC enums
│   ├── routes/
│   │   ├── admin.py            # Super Admin metrics, activity logs & settings
│   │   ├── auth.py             # Authentication, registration & user preferences
│   │   ├── college.py          # College portal & student verification
│   │   ├── company.py          # Job posting, applicants & pipeline ATS
│   │   ├── notifications.py    # Notification feed, mark-read & clear endpoints
│   │   └── student.py          # Student dashboard & job applications
│   ├── database.py             # Motor async MongoDB client & activity logger
│   ├── main.py                 # FastAPI application factory & CORS configuration
│   ├── requirements.txt        # Backend dependencies
│   ├── .env.example            # Backend environment template
│   └── .env                    # Active backend environment variables (gitignored)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DashboardLayout.tsx  # Responsive sidebar & header with notification bell
│   │   │   └── NotificationBell.tsx # Real-time notification popover & unread badge
│   │   ├── context/
│   │   │   └── AuthContext.tsx      # Auth token & user state management
│   │   ├── pages/
│   │   │   ├── dashboards/          # Role-specific dashboard views & Settings
│   │   │   ├── LandingPage.tsx      # Public landing page with metrics & animations
│   │   │   ├── Login.tsx            # Modern split-screen authentication UI
│   │   │   └── Register.tsx         # Role-based registration flow
│   │   ├── services/
│   │   │   └── api.ts               # Axios instance with auth interceptor
│   │   ├── App.tsx                  # App routes & role guards
│   │   └── main.tsx                 # Entrypoint
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── .env.example            # Frontend environment template
│   └── .env                    # Active frontend environment variables (gitignored)
│
├── .gitignore
├── .env.example                # Root environment template
├── .env                        # Active root environment variables (gitignored)
└── README.md
```

---

## Getting Started

Follow these instructions to run the project locally.

### Prerequisites
* **Node.js**: v18+
* **Python**: v3.9+
* **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or a MongoDB Atlas URI

---

### 1. Environment Configuration

CampusConnect uses environment variables for database connections, JWT secrets, super admin accounts, and API URLs.

#### Backend Configuration
Copy the template in the `backend` directory:
```bash
# Windows (PowerShell)
Copy-Item backend\.env.example backend\.env

# macOS / Linux
cp backend/.env.example backend/.env
```

Review or edit `backend/.env`:
```env
# MongoDB Database
MONGO_URI=mongodb://localhost:27017
DATABASE_NAME=campusconnect

# JWT Security
SECRET_KEY=replace_with_a_secure_random_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Super Admin Account (automatically seeded on first startup)
ADMIN_NAME=Super Admin
ADMIN_EMAIL=admin@campusconnect.com
ADMIN_PASSWORD=Admin@123
```

#### Frontend Configuration
Copy the template in the `frontend` directory:
```bash
# Windows (PowerShell)
Copy-Item frontend\.env.example frontend\.env

# macOS / Linux
cp frontend/.env.example frontend/.env
```

Review or edit `frontend/.env`:
```env
# Backend API Base URL
VITE_API_URL=http://localhost:8000
```

---

### 2. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows (PowerShell):
.\venv\Scripts\activate
# Windows (cmd):
.\venv\Scripts\activate.bat
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server with reload
uvicorn main:app --reload
```
* The backend API server will run on `http://localhost:8000`.
* Interactive Swagger API docs are available at `http://localhost:8000/docs`.
* ReDoc documentation is available at `http://localhost:8000/redoc`.

---

### 3. Frontend Setup

In a new terminal window:

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
* The frontend will be available at `http://localhost:5173`.

---

## Default Super Admin Credentials

When the backend initializes for the first time, it automatically creates the Super Admin account configured in your `.env`:
* **Email:** `admin@campusconnect.com`
* **Password:** `Admin@123`
* **Role:** `super_admin`

You can use these credentials on `/login` to access the Super Admin Portal, view user activity logs, and observe real-time login alerts.

---

## Future Scope
* **AI-Powered Resume Parsing:** Using NLP to automatically extract and verify skills from student resumes, further reducing recruiter bias.
* **Real-time Chat & WebSockets:** For instant communication between recruiters and shortlisted candidates.
* **Automated Interview Scheduling:** Integration with Google Workspace/Outlook for seamless remote interviews.
