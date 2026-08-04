# Campus360 AI – Smart College ERP Platform

A production-ready, enterprise-grade College ERP built with the **MERN Stack** (MongoDB, Express.js, React.js, Node.js) featuring AI-ready architecture, role-based dashboards, automated marks processing, and real-time analytics.

## 🚀 Tech Stack

### Frontend
- **React.js** (Vite)
- **Tailwind CSS** (Custom design system)
- **Framer Motion** (Animations)
- **Redux Toolkit** (State management)
- **React Router DOM** (Routing)
- **Recharts** (Analytics charts)
- **React Hook Form** (Forms)
- **React Hot Toast** (Notifications)

### Backend
- **Node.js + Express.js** (REST API)
- **MongoDB + Mongoose** (Database)
- **JWT Authentication** (Secure auth)
- **Bcrypt** (Password hashing)
- **Multer + XLSX** (Excel upload & processing)
- **Socket.IO** (Real-time notifications)
- **Nodemailer** (Email service)

---

## 📁 Project Structure

```
ee project/
├── backend/            ← Express.js API server
│   ├── src/
│   │   ├── config/     (db.js)
│   │   ├── controllers/ (auth, student, mentor, hod, admin)
│   │   ├── middleware/  (auth, errorHandler, upload)
│   │   ├── models/      (User, Student, Mentor, HOD, Department, Subject, Attendance, InternalMarks, Notification, Event, AuditLog)
│   │   ├── routes/      (auth, student, mentor, hod, admin)
│   │   └── utils/       (seeder.js)
│   └── server.js
│
└── frontend/           ← React.js SPA
    └── src/
        ├── components/  (layout, common)
        ├── layouts/     (DashboardLayout)
        ├── pages/       (auth, student, mentor, hod, admin, misc)
        ├── redux/       (store, authSlice, notificationSlice, uiSlice)
        ├── routes/      (AppRouter, ProtectedRoute)
        └── services/    (api.js)
```

---

## 🔐 User Roles & Demo Credentials

| Role    | Email                      | Password    |
|---------|----------------------------|-------------|
| Admin   | admin@campus360.edu        | admin@123   |
| HOD     | hod@campus360.edu          | hod@123     |
| Mentor  | mentor@campus360.edu       | mentor@123  |
| Student | student@campus360.edu      | student@123 |

---

## ⚡ Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### 1. Backend Setup
```bash
cd backend
npm install
# Configure .env (copy from .env.example and update MONGO_URI)
npm run seed        # Seed demo data
npm run dev         # Start server (port 5000)
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev         # Start dev server (port 5173)
```

### 3. Access the App
Open [http://localhost:5173](http://localhost:5173) and login with any demo credentials.

---

## 📋 API Endpoints

### Auth
- `POST /api/auth/login` – Login
- `GET /api/auth/me` – Get current user
- `PUT /api/auth/update-password` – Update password
- `POST /api/auth/logout` – Logout

### Student
- `GET /api/student/dashboard` – Dashboard data
- `GET /api/student/attendance` – Attendance records
- `GET /api/student/marks` – Internal marks
- `GET /api/student/profile` – Profile

### Mentor
- `GET /api/mentor/dashboard` – Dashboard
- `GET /api/mentor/students` – My students
- `GET/POST /api/mentor/attendance` – Attendance CRUD
- `PUT/DELETE /api/mentor/attendance/:id` – Edit/Delete attendance
- `POST /api/mentor/marks/upload` – Upload Excel marks
- `GET/PUT/DELETE /api/mentor/marks/:id` – Marks management

### HOD
- `GET /api/hod/dashboard` – Department overview
- `GET /api/hod/students` – Department students
- `GET /api/hod/analytics/marks` – Marks analytics
- `GET /api/hod/faculty` – Faculty list

### Admin
- `GET/POST /api/admin/users` – User management
- `PUT/DELETE /api/admin/users/:id` – Edit/Delete user
- `PUT /api/admin/users/:id/reset-password` – Reset password
- `GET/POST/PUT/DELETE /api/admin/departments` – Departments
- `GET/POST/PUT/DELETE /api/admin/subjects` – Subjects
- `GET/POST /api/admin/notifications` – Notifications
- `GET/POST /api/admin/events` – Events
- `DELETE /api/admin/events/:id` – Delete event
- `GET /api/admin/audit-logs` – Audit logs

---

## 🎯 Features

### Student Portal
- ✅ Personal dashboard with stats
- ✅ Subject-wise attendance with charts
- ✅ Internal marks table (IA1 + IA2 + Assignment)
- ✅ Performance radar chart
- ✅ Notifications feed
- ✅ Upcoming events
- ✅ Profile management

### Mentor Portal
- ✅ Students overview with low-attendance alerts
- ✅ Attendance management (Add/Edit/Delete)
- ✅ One-click Excel upload for marks (auto-processing)
- ✅ Student search and filters
- ✅ Marks management

### HOD Portal
- ✅ Department-wide statistics
- ✅ Monthly attendance trends
- ✅ Year-wise student distribution
- ✅ Faculty performance overview
- ✅ Subject-wise marks analytics

### Admin Portal
- ✅ Complete user management (CRUD + password reset)
- ✅ Department management
- ✅ Subject management
- ✅ System notifications
- ✅ Events management
- ✅ Audit logs

---

## 🎨 UI/UX Features

- Dark/Light mode toggle
- Glassmorphism design system
- Premium gradient cards
- Animated sidebar with collapse
- Smooth page transitions (Framer Motion)
- Skeleton loading states
- Responsive design (mobile-first)
- Interactive charts (Recharts)
- Toast notifications
- Empty states
- Form validation

---

## 🔮 Future-Ready Architecture

The application is designed to support:
- 🤖 AI Face Recognition Attendance
- 📱 Mobile Application (React Native)
- 👨‍👩‍👧 Parent Portal
- 📊 AI Performance Prediction
- 📧 SMS & Email Notifications
- 💼 Placement Dashboard
- ☁️ Cloud File Storage (AWS S3)

---

## 🔒 Security

- JWT token authentication (7-day expiry)
- Role-based access control (RBAC)
- Password hashing with Bcrypt (12 salt rounds)
- Rate limiting (200 req/15min, 10 login attempts/15min)
- CORS configuration
- HTTP security headers (Helmet)
- Input validation
- SQL injection protection (Mongoose)

---

## 📦 Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Deploy dist/ to Vercel
```

### Backend → Render / Railway
- Set environment variables from `.env.example`
- Use MongoDB Atlas for production database

---

Built with ❤️ for engineering final-year projects and real-world deployment.
