import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import {
  Eye, EyeOff, GraduationCap, Loader2, ArrowRight, Lock, Mail,
} from 'lucide-react';
import { login, clearError } from '../../redux/slices/authSlice';
import toast from 'react-hot-toast';
import './Login.css';
const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4';

const ROLE_HOME = {
  student: '/student/dashboard',
  mentor:  '/mentor/dashboard',
  hod:     '/hod/dashboard',
  admin:   '/admin/dashboard',
};

const DEMO_CREDENTIALS = [
  { role: 'Student', email: 'student@campus360.edu', password: 'student@123', color: '#3b82f6' },
  { role: 'Mentor',  email: 'mentor@campus360.edu',  password: 'mentor@123',  color: '#6366f1' },
  { role: 'HOD',     email: 'hod@campus360.edu',     password: 'hod@123',     color: '#10b981' },
  { role: 'Admin',   email: 'admin@campus360.edu',   password: 'admin@123',   color: '#f43f5e' },
];

const Login = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { loading, error, user, isAuthenticated } = useSelector((s) => s.auth);
  const [showPassword, setShowPassword] = useState(false);

  const videoRef     = useRef(null);
  const rafRef       = useRef(null);
  const fadingOutRef = useRef(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  /* ── auth redirect ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (isAuthenticated && user) {
      const homePath = ROLE_HOME[user.role?.toLowerCase()];
      if (homePath) {
        navigate(homePath);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
      }
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  /* ── video fade helpers ─────────────────────────────────────────────────── */
  const cancelRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const animateOpacity = useCallback(
    (video, from, to, duration, onComplete) => {
      cancelRaf();
      const start = performance.now();
      const delta = to - from;
      const step = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const e = p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p+2,3)/2;
        video.style.opacity = String(from + delta * e);
        if (p < 1) { rafRef.current = requestAnimationFrame(step); }
        else        { rafRef.current = null; onComplete?.(); }
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [cancelRaf]
  );

  const fadeIn = useCallback((video) => {
    fadingOutRef.current = false;
    animateOpacity(video, parseFloat(video.style.opacity) || 0, 1, 500, null);
  }, [animateOpacity]);

  const fadeOut = useCallback((video) => {
    if (fadingOutRef.current) return;
    fadingOutRef.current = true;
    animateOpacity(video, parseFloat(video.style.opacity) ?? 1, 0, 500, null);
  }, [animateOpacity]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.style.opacity = '0';

    const onCanPlay    = () => fadeIn(video);
    const onTimeUpdate = () => {
      if (!video.duration || fadingOutRef.current) return;
      if (video.duration - video.currentTime <= 0.55) fadeOut(video);
    };
    const onEnded = () => {
      cancelRaf();
      video.style.opacity = '0';
      fadingOutRef.current = false;
      setTimeout(() => {
        video.currentTime = 0;
        video.play().catch(() => {});
        fadeIn(video);
      }, 100);
    };

    video.addEventListener('canplay',    onCanPlay);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended',      onEnded);
    return () => {
      cancelRaf();
      video.removeEventListener('canplay',    onCanPlay);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended',      onEnded);
    };
  }, [fadeIn, fadeOut, cancelRaf]);

  /* ── handlers ───────────────────────────────────────────────────────────── */
  const onSubmit = async (data) => { await dispatch(login(data)); };
  const fillDemo = (cred) => {
    setValue('email',    cred.email);
    setValue('password', cred.password);
  };

  /* ── render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="login-root">
      {/* Background video */}
      <video
        ref={videoRef}
        className="login-video"
        src={VIDEO_URL}
        muted autoPlay loop={false} playsInline preload="auto"
        aria-hidden="true"
      />
      <div className="login-overlay" aria-hidden="true" />

      {/* Back to home */}
      <Link
        to="/"
        className="login-back"
        aria-label="Back to Campus360 AI home"
      >
        <GraduationCap size={15} aria-hidden="true" />
        <span>Campus360 AI</span>
      </Link>

      {/* ── Centred card ──────────────────────────────────────────────────── */}
      <div className="login-center">
        <div className="login-card lc-glass">

          {/* Header */}
          <div className="login-card-header">
            <div className="login-logo" aria-hidden="true">
              <GraduationCap size={20} />
            </div>
            <h1 className="login-title">Welcome back</h1>
            <p className="login-sub">Sign in to your Campus360 AI portal</p>
          </div>

          {/* Demo quick-login */}
          <div className="login-demo-section" aria-label="Demo credentials">
            <p className="login-demo-label">Quick Demo Login</p>
            <div className="login-demo-grid">
              {DEMO_CREDENTIALS.map((cred) => (
                <button
                  key={cred.role}
                  type="button"
                  className="login-demo-btn lc-glass"
                  onClick={() => fillDemo(cred)}
                  aria-label={`Fill ${cred.role} demo credentials`}
                >
                  <span
                    className="login-demo-dot"
                    style={{ background: cred.color, boxShadow: `0 0 8px ${cred.color}` }}
                    aria-hidden="true"
                  />
                  <span className="login-demo-role">{cred.role}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="login-divider" aria-hidden="true">
            <span className="login-divider-line" />
            <span className="login-divider-text">or sign in manually</span>
            <span className="login-divider-line" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="login-form" noValidate>
            {/* Email */}
            <div className="login-field">
              <label htmlFor="login-email" className="login-label">
                Email Address
              </label>
              <div className="login-input-wrap lc-glass">
                <Mail size={15} className="login-input-icon" aria-hidden="true" />
                <input
                  id="login-email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' },
                  })}
                  type="email"
                  placeholder="you@campus360.edu"
                  className="login-input"
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="login-error" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="login-field">
              <label htmlFor="login-password" className="login-label">
                Password
              </label>
              <div className="login-input-wrap lc-glass">
                <Lock size={15} className="login-input-icon" aria-hidden="true" />
                <input
                  id="login-password"
                  {...register('password', { required: 'Password is required' })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="login-input"
                  aria-describedby={errors.password ? 'pwd-error' : undefined}
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword
                    ? <EyeOff size={15} aria-hidden="true" />
                    : <Eye     size={15} aria-hidden="true" />
                  }
                </button>
              </div>
              {errors.password && (
                <p id="pwd-error" className="login-error" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="login-submit-btn"
              aria-label="Sign in to Campus360 AI"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="login-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={15} aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="login-footer">
            Campus360 AI © {new Date().getFullYear()} · Enterprise College ERP Platform
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
