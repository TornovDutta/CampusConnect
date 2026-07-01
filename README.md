# 🎓 CampusConnect: Next-Gen Campus Recruitment Platform

[![Frontend: React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-blue?style=flat-square&logo=react)](https://react.dev)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Database: MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com)
[![Styling: Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)

**CampusConnect** is a comprehensive, full-stack recruitment platform designed to bridge the gap between Students, Educational Institutions (Colleges), and Corporate Recruiters (Companies). By unifying the campus placement process into a single, intuitive application, it streamlines job postings, application tracking, and talent discovery.

---

## 🚀 Why Use CampusConnect? (The Impact)

For recruiters and engineering managers reviewing this project, CampusConnect demonstrates my ability to:
- **Architect scalable full-stack solutions:** Designing a decoupled architecture using modern APIs (FastAPI) and a reactive frontend (React).
- **Implement complex Role-Based Access Control (RBAC):** Handling specialized dashboards and permissions for multiple user types (Super Admin, College Admin, Company Recruiter, Student).
- **Deliver production-ready features:** Utilizing JWT for secure authentication, integrating robust state management (`@tanstack/react-query`), and ensuring a responsive, modern UI/UX with Tailwind CSS.
- **Write clean, maintainable code:** Leveraging TypeScript for type safety on the frontend and Python type hints (Pydantic) on the backend for end-to-end reliability.

---

## ✨ Key Features

### 👨‍🎓 For Students
* **Profile Management:** Build a digital resume, highlight skills, and upload academic records.
* **Job Discovery:** Browse and filter job postings/internships tailored to their campus.
* **Application Tracking:** Apply for roles with a single click and track application status in real-time.

### 🏢 For Companies
* **Job Posting:** Publish job descriptions, requirements, and deadlines directly to target colleges.
* **Applicant Tracking System (ATS):** Review applications, shortlist candidates, and manage interview pipelines.
* **Talent Search:** Discover top-performing students based on academic criteria and skillsets.

### 🏫 For Colleges
* **Student & Company Management:** Oversee student registrations and approve company partnerships.
* **Placement Analytics:** Track overall placement success, average packages, and top recruiters.

### 🛡️ For System Admins
* **Centralized Dashboard:** Monitor platform health, manage user roles, and resolve disputes.

---

## 🛠️ Tech Stack

**Frontend:**
* **Core:** React 19, TypeScript, Vite
* **Routing:** React Router DOM v7
* **State Management & Data Fetching:** TanStack React Query v5, Axios
* **Styling:** Tailwind CSS, `clsx`, `tailwind-merge`
* **Icons:** Lucide React

**Backend:**
* **Framework:** FastAPI (Python)
* **Database:** MongoDB (Motor Async Driver)
* **Authentication:** JWT (JSON Web Tokens), bcrypt for password hashing
* **Data Validation:** Pydantic

---

## 🏗️ Technical Highlights

1. **High-Performance API:** Built with FastAPI, the backend handles asynchronous requests natively, ensuring high throughput and low latency, essential for concurrent user access during placement seasons.
2. **Optimized Client State:** Replaced legacy Redux with **TanStack Query** for automatic caching, background data synchronization, and optimistic UI updates, drastically reducing unnecessary network requests.
3. **Secure Authentication Flow:** Custom-built auth system with hashed passwords (bcrypt), HTTP-only cookies (or secure local storage), and route-level protection based on user roles (`RoleEnum`).
4. **Responsive Design System:** A mobile-first, highly accessible user interface crafted with Tailwind CSS utility classes, ensuring cross-device compatibility without bulky CSS files.

---

## ⚙️ Getting Started

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

# Create a .env file based on environment variables needed
# e.g., MONGO_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD

# Run the FastAPI server
uvicorn main:app --reload
```
*The backend will be available at `http://localhost:8000`. API documentation (Swagger) is automatically generated at `http://localhost:8000/docs`.*

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

## 🔮 Future Scope
* **Real-time Chat:** Integrating WebSockets for direct communication between recruiters and students.
* **AI-Powered Resume Parsing:** Using NLP to automatically extract skills from student resumes.
* **Automated Interview Scheduling:** Integration with Google Calendar/Outlook APIs for seamless scheduling.

---

*This project was built to solve real-world campus recruitment challenges and showcase enterprise-grade full-stack development skills.*
