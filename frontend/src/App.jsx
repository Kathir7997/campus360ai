import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster, toast } from 'react-hot-toast';
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import store from './redux/store';
import AppRouter from './routes/AppRouter';
import { getMe } from './redux/slices/authSlice';
import { addNotification } from './redux/slices/notificationSlice';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
  autoConnect: false,
});

const AppContent = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const dm = useSelector((s) => s.ui.darkMode);

  // Apply dark mode class on mount
  useEffect(() => {
    if (dm) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [dm]);

  // Fetch user profile on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getMe());
    }
  }, [isAuthenticated, dispatch]);

  // Setup Socket.IO connections and listeners
  useEffect(() => {
    if (isAuthenticated) {
      socket.connect();
      if (user?._id) {
        socket.emit('join_room', `user_${user._id}`);
      }

      socket.on('attendance:marked', (data) => {
        if (data?.results?.length) {
          dispatch(addNotification({
            _id: `attendance-${Date.now()}`,
            title: 'Attendance Updated',
            message: `${data.results.length} attendance entries processed`,
            type: 'attendance',
            createdAt: new Date().toISOString(),
          }));
        }
        toast.success(`Attendance marked: ${data.window}`, { icon: '📷' });
      });
      
      socket.on('od:approved', (data) => {
        dispatch(addNotification({
          _id: `od-approved-${Date.now()}`,
          title: 'OD Approved',
          message: data.message,
          type: 'od',
          createdAt: new Date().toISOString(),
        }));
        toast.success(`OD Approved for ${data.date}`, { icon: '✅' });
      });
      
      socket.on('od:rejected', (data) => {
        dispatch(addNotification({
          _id: `od-rejected-${Date.now()}`,
          title: 'OD Rejected',
          message: data.message,
          type: 'od',
          createdAt: new Date().toISOString(),
        }));
        toast.error(`OD Rejected: ${data.message}`, { icon: '❌' });
      });

      socket.on('teacher:presence', (data) => {
        dispatch(addNotification({
          _id: `teacher-${Date.now()}`,
          title: 'Teacher Presence Updated',
          message: `${data.classroomName || data.classroomId} ${data.teacherPresent ? 'started' : 'ended'} the lecture`,
          type: 'teacher_presence',
          createdAt: new Date().toISOString(),
        }));
        toast.success(`Lecture ${data.teacherPresent ? 'started' : 'ended'}`, { icon: '🏫' });
      });

      socket.on('device:offline', (data) => {
        dispatch(addNotification({
          _id: `device-${Date.now()}`,
          title: 'Device Offline',
          message: data?.notification?.message || 'Device heartbeat lost',
          type: 'device',
          createdAt: new Date().toISOString(),
        }));
        toast.error(data?.notification?.message || 'Device offline detected');
      });

      socket.on('firmware:update', (data) => {
        dispatch(addNotification({
          _id: `firmware-${Date.now()}`,
          title: 'Firmware Update Queued',
          message: `Firmware update queued for ${data.deviceId}`,
          type: 'firmware',
          createdAt: new Date().toISOString(),
        }));
      });

      socket.on('iat:uploaded', (data) => {
        dispatch(addNotification({
          _id: `iat-${Date.now()}`,
          title: 'IAT Uploaded',
          message: `Uploaded IAT marks for semester ${data.semester}`,
          type: 'iat',
          createdAt: new Date().toISOString(),
        }));
      });

      socket.on('attendance:synced', (data) => {
        dispatch(addNotification({
          _id: `sync-${Date.now()}`,
          title: 'Attendance Synced',
          message: `${data.count} offline attendance items synced`,
          type: 'system',
          createdAt: new Date().toISOString(),
        }));
      });

      const handleMarks = (data) => {
        if (data.userIds && user?._id && data.userIds.includes(user._id)) {
          toast.success(`Internal marks published for Semester ${data.semester}!`, { icon: '📝' });
        }
      };
      socket.on('marks:published', handleMarks);

      return () => {
        socket.disconnect();
        socket.off('attendance:marked');
        socket.off('od:approved');
        socket.off('od:rejected');
        socket.off('teacher:presence');
        socket.off('device:offline');
        socket.off('firmware:update');
        socket.off('iat:uploaded');
        socket.off('attendance:synced');
        socket.off('marks:published', handleMarks);
      };
    }
  }, [isAuthenticated, user?._id]);

  return (
    <>
      <AppRouter />
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: dm ? '#1a2035' : '#fff',
            color: dm ? '#f1f5f9' : '#1e293b',
            border: dm ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
            borderRadius: '12px',
            fontSize: '14px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
        }}
      />
    </>
  );
};

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
