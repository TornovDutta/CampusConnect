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

## Technical Point of View (Architecture)

To support high-concurrency placement drives (where thousands of students might apply for a role in minutes), the platform is architected for maximum scalability and speed.

1. **High-Performance Asynchronous Backend (FastAPI + Motor):** 
   Built with Python's FastAPI, the backend handles asynchronous requests natively. Paired with MongoDB's Motor async driver, it ensures non-blocking I/O operations, providing high throughput and low latency essential for traffic spikes.
2. **Optimized Client-Side Caching (React + TanStack Query):** 
   We utilize TanStack Query for automatic background data synchronization and caching. This drastically reduces unnecessary network payloads and ensures optimistic UI updates for a seamless user experience, even under heavy load.
3. **Decoupled & Scalable Design:** 
   The frontend and backend are entirely decoupled, communicating via RESTful APIs. This allows independent scaling of the API servers and the static frontend delivery via CDNs.
4. **Strict Role-Based Access Control (RBAC):** 
   A custom, highly secure authentication flow utilizing JWT and bcrypt. It routes and isolates data access across four distinct tenancy levels: Super Admin, College Admin, Company Recruiter, and Student.

---

## Platform Features

### For Students
* **Merit-Based Profiling:** Build digital resumes highlighting skills and achievements rather than just institution names.
* **Universal Job Discovery:** Browse internships and jobs from companies extending offers across the platform network.
* **One-Click Applications:** Apply and track application statuses in real-time.

### For Companies
* **Centralized ATS:** Review applications, shortlist candidates, and manage interview pipelines across multiple colleges from a single dashboard.
* **Skill-First Talent Search:** Query the global student database for specific skillsets, ignoring institutional biases.
* **Broadcast Postings:** Publish job descriptions directly to multiple targeted colleges simultaneously.

### For Colleges
* **Streamlined Management:** Oversee student registrations and approve authentic company partnerships.
* **Placement Analytics:** Track placement success, average packages, and top recruiters through visual dashboards.

---

## Getting Started

Follow these instructions to run the project locally.

### Prerequisites
* Node.js (v18+)
* Python (v3.9+)
* MongoDB (Local or Atlas URI)

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn main:app --reload
```
*API documentation (Swagger) is automatically generated at `http://localhost:8000/docs`.*

### 2. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
*The frontend will be available at `http://localhost:5173`.*

---

## Future Scope
* **AI-Powered Resume Parsing:** Using NLP to automatically extract and verify skills from student resumes, further reducing recruiter bias.
* **Real-time Chat & WebSockets:** For instant communication between recruiters and shortlisted candidates.
* **Automated Interview Scheduling:** Integration with Google Workspace/Outlook for seamless remote interviews.
