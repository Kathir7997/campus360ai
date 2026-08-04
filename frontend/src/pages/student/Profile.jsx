import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { User, Mail, Phone, BookOpen, Calendar, Users, MapPin } from 'lucide-react';
import { DashboardCard, Avatar, Badge } from '../../components/common/index';

const StudentProfile = () => {
  const { user, profile } = useSelector((s) => s.auth);
  const student = profile;

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      </div>
      <div>
        <p className="text-xs text-slate-400 dark:text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <h2 className="section-title">My Profile</h2>
      <p className="section-subtitle">Your academic profile and personal information</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <DashboardCard>
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{user?.name}</h3>
              <p className="text-sm text-slate-500 mt-1">{student?.registerNumber}</p>
              <div className="flex justify-center gap-2 mt-3">
                <Badge variant="info">Year {student?.year}</Badge>
                <Badge variant="info">Sem {student?.semester}</Badge>
                <Badge variant="success">Section {student?.section}</Badge>
              </div>
            </div>

            <div className="mt-6 space-y-0">
              <InfoRow icon={Mail} label="Email" value={user?.email} />
              <InfoRow icon={Phone} label="Phone" value={user?.phone} />
              <InfoRow icon={BookOpen} label="Department" value={student?.department?.name} />
              <InfoRow icon={Calendar} label="Batch" value={student?.batch} />
              <InfoRow icon={MapPin} label="Address" value={student?.address} />
            </div>
          </DashboardCard>
        </motion.div>

        {/* Academic Info */}
        <div className="lg:col-span-2 space-y-4">
          <DashboardCard title="Academic Information">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Register Number', value: student?.registerNumber },
                { label: 'Roll Number', value: student?.rollNumber },
                { label: 'Department', value: student?.department?.name },
                { label: 'Department Code', value: student?.department?.code },
                { label: 'Year', value: student?.year ? `${student.year}${['st','nd','rd','th'][student.year-1]} Year` : '—' },
                { label: 'Semester', value: student?.semester ? `Semester ${student.semester}` : '—' },
                { label: 'Section', value: student?.section },
                { label: 'Batch', value: student?.batch },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{item.value || '—'}</p>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard title="Parent / Guardian Information">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500">Parent Name</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{student?.parentName || '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500">Parent Phone</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{student?.parentPhone || '—'}</p>
              </div>
            </div>
          </DashboardCard>

          {student?.mentor && (
            <DashboardCard title="Assigned Mentor">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {student.mentor?.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{student.mentor.name}</p>
                  <p className="text-sm text-slate-500">{student.mentor.email}</p>
                  {student.mentor.phone && <p className="text-xs text-slate-400 mt-0.5">{student.mentor.phone}</p>}
                </div>
                <Badge variant="info" className="ml-auto">Assigned Mentor</Badge>
              </div>
            </DashboardCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
