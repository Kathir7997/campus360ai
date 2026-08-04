import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldX, Home } from 'lucide-react';

const Unauthorized = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0f1117] text-center p-8">
    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center mx-auto mb-8 shadow-lg">
        <ShieldX className="w-12 h-12 text-white" />
      </div>
    </motion.div>
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
      <h1 className="text-6xl font-black text-rose-500 mb-2">403</h1>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Access Denied</h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8">
        You don't have permission to access this page. Please contact your administrator.
      </p>
      <Link to="/" className="btn-primary"><Home className="w-4 h-4" /> Return to Dashboard</Link>
    </motion.div>
  </div>
);

export default Unauthorized;
