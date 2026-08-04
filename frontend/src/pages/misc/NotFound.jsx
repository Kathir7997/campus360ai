import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0f1117] text-center p-8">
    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-8 shadow-glow-blue animate-float">
        <GraduationCap className="w-12 h-12 text-white" />
      </div>
    </motion.div>
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
      <h1 className="text-8xl font-black text-gradient mb-2">404</h1>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Page Not Found</h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-3 justify-center">
        <Link to="/" className="btn-primary"><Home className="w-4 h-4" /> Go Home</Link>
        <button onClick={() => window.history.back()} className="btn-secondary"><ArrowLeft className="w-4 h-4" /> Go Back</button>
      </div>
    </motion.div>
  </div>
);

export default NotFound;
