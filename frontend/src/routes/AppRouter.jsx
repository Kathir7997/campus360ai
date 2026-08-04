import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ProtectedRoute, RoleRoute } from './ProtectedRoute';

// Layouts
import VisionLayout from '../layouts/VisionLayout';

// Auth Pages
import Login from '../pages/auth/Login';

// Student Pages
import StudentDashboard from '../pages/student/Dashboard';
import StudentAttendance from '../pages/student/Attendance';
import StudentMarks from '../pages/student/Marks';
import StudentProfile from '../pages/student/Profile';
import FaceRegistration from '../pages/student/FaceRegistration';

// Mentor Pages
import MentorDashboard from '../pages/mentor/Dashboard';
import MentorStudents from '../pages/mentor/Students';
import MentorAttendance from '../pages/mentor/ManageAttendance';
import MentorUploadMarks from '../pages/mentor/UploadMarks';

// HOD Pages
import HODDashboard from '../pages/hod/Dashboard';
import HODStudents from '../pages/hod/Students';
import HODAnalytics from '../pages/hod/Analytics';
import HODFaculty from '../pages/hod/Faculty';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import AdminUsers from '../pages/admin/ManageUsers';
import AdminDepartments from '../pages/admin/Departments';
import AdminSubjects from '../pages/admin/Subjects';
import AdminNotifications from '../pages/admin/Notifications';
import AdminEvents from '../pages/admin/Events';
import AdminAuditLogs from '../pages/admin/AuditLogs';
import AdminIoTDevices from '../pages/admin/IoTDevices';
import AdminIoTConfig from '../pages/admin/IoTConfig';
import AdminFaceDataset from '../pages/admin/FaceDataset';
import IoTScannerSimulator from '../pages/admin/IoTScannerSimulator';
import SmartClassroomMonitoring from '../pages/admin/SmartClassroomMonitoring';

// Misc
import NotFound from '../pages/misc/NotFound';
import Unauthorized from '../pages/misc/Unauthorized';
import Landing from '../pages/misc/Landing';

const ROLE_HOME = {
  student: '/student/dashboard',
  mentor: '/mentor/dashboard',
  hod: '/hod/dashboard',
  admin: '/admin/dashboard',
};

const RootRedirect = () => {
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  // Show the public landing page when not authenticated
  if (!isAuthenticated) return <Landing />;
  const homePath = ROLE_HOME[user?.role?.toLowerCase()];
  if (!homePath) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return null;
  }
  return <Navigate to={homePath} replace />;
};

const AppRouter = () => (
  <Routes>
    {/* Public */}
    <Route path="/login" element={<Login />} />
    <Route path="/unauthorized" element={<Unauthorized />} />
    <Route path="/iot-simulator" element={<IoTScannerSimulator />} />
    <Route path="/" element={<RootRedirect />} />

    {/* Student Routes */}
    <Route path="/student" element={<RoleRoute allowedRoles={['student']}><VisionLayout /></RoleRoute>}>
      <Route path="dashboard" element={<StudentDashboard />} />
      <Route path="attendance" element={<StudentAttendance />} />
      <Route path="marks" element={<StudentMarks />} />
      <Route path="profile" element={<StudentProfile />} />
      <Route path="face-registration" element={<FaceRegistration />} />
    </Route>

    {/* Mentor Routes */}
    <Route path="/mentor" element={<RoleRoute allowedRoles={['mentor']}><VisionLayout /></RoleRoute>}>
      <Route path="dashboard" element={<MentorDashboard />} />
      <Route path="students" element={<MentorStudents />} />
      <Route path="attendance" element={<MentorAttendance />} />
      <Route path="marks/upload" element={<MentorUploadMarks />} />
    </Route>

    {/* HOD Routes */}
    <Route path="/hod" element={<RoleRoute allowedRoles={['hod']}><VisionLayout /></RoleRoute>}>
      <Route path="dashboard" element={<HODDashboard />} />
      <Route path="students" element={<HODStudents />} />
      <Route path="analytics" element={<HODAnalytics />} />
      <Route path="faculty" element={<HODFaculty />} />
    </Route>

    {/* Admin Routes */}
    <Route path="/admin" element={<RoleRoute allowedRoles={['admin']}><VisionLayout /></RoleRoute>}>
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="monitoring" element={<SmartClassroomMonitoring />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="departments" element={<AdminDepartments />} />
      <Route path="subjects" element={<AdminSubjects />} />
      <Route path="face-dataset" element={<AdminFaceDataset />} />
      <Route path="notifications" element={<AdminNotifications />} />
      <Route path="events" element={<AdminEvents />} />
      <Route path="audit-logs" element={<AdminAuditLogs />} />
      <Route path="iot-devices" element={<AdminIoTDevices />} />
      <Route path="iot-config" element={<AdminIoTConfig />} />
    </Route>

    {/* 404 */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRouter;
