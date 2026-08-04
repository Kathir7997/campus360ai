import { useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Globe, ArrowRight, Users, BarChart2, ShieldCheck } from 'lucide-react';
import './Hero.css';
// Inline SVG social icons (lucide-react v1.x doesn't include brand icons)
const InstagramIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const XIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.265 5.637L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
  </svg>
);

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4';

const FADE_IN_DURATION = 500;
const FADE_OUT_DURATION = 500;
const FADE_OUT_BEFORE_END = 0.55;

const Hero = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const rafRef = useRef(null);
  const fadingOutRef = useRef(false);

  const cancelRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const animateOpacity = useCallback(
    (video, fromOpacity, toOpacity, duration, onComplete) => {
      cancelRaf();
      const start = performance.now();
      const delta = toOpacity - fromOpacity;
      const step = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        video.style.opacity = String(fromOpacity + delta * eased);
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          rafRef.current = null;
          onComplete && onComplete();
        }
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [cancelRaf]
  );

  const fadeIn = useCallback(
    (video) => {
      fadingOutRef.current = false;
      const from = parseFloat(video.style.opacity) || 0;
      animateOpacity(video, from, 1, FADE_IN_DURATION, null);
    },
    [animateOpacity]
  );

  const fadeOut = useCallback(
    (video, onComplete) => {
      if (fadingOutRef.current) return;
      fadingOutRef.current = true;
      const from = parseFloat(video.style.opacity) ?? 1;
      animateOpacity(video, from, 0, FADE_OUT_DURATION, onComplete);
    },
    [animateOpacity]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.style.opacity = '0';

    const handleCanPlay = () => fadeIn(video);
    const handleTimeUpdate = () => {
      if (!video.duration || fadingOutRef.current) return;
      const timeLeft = video.duration - video.currentTime;
      if (timeLeft <= FADE_OUT_BEFORE_END) fadeOut(video, null);
    };
    const handleEnded = () => {
      cancelRaf();
      video.style.opacity = '0';
      fadingOutRef.current = false;
      setTimeout(() => {
        video.currentTime = 0;
        video.play().catch(() => {});
        fadeIn(video);
      }, 100);
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      cancelRaf();
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [fadeIn, fadeOut, cancelRaf]);

  return (
    <section className="hero-root" aria-label="Campus360 AI hero section">
      {/* Background video */}
      <video
        ref={videoRef}
        className="hero-video"
        src={VIDEO_URL}
        muted
        autoPlay
        loop={false}
        playsInline
        aria-hidden="true"
        preload="auto"
      />

      <div className="hero-overlay" aria-hidden="true" />

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <nav className="hero-nav" aria-label="Primary navigation">
        <a
          href="/"
          className="hero-nav-logo liquid-glass"
          aria-label="Campus360 AI home"
          onClick={(e) => e.preventDefault()}
        >
          <GraduationCap size={15} aria-hidden="true" />
          <span>Campus360 AI</span>
        </a>

        <div className="hero-nav-links" role="list">
          {[
            { label: 'Features', href: '#features' },
            { label: 'Portals',  href: '#portals'  },
            { label: 'About',    href: '#about'     },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="hero-nav-link"
              role="listitem"
              aria-label={`Navigate to ${item.label}`}
              onClick={(e) => e.preventDefault()}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="hero-nav-actions">
          <a
            href="/login"
            className="hero-btn-signup"
            aria-label="Sign in to Campus360 AI"
            onClick={(e) => {
              e.preventDefault();
              navigate('/login');
            }}
          >
            Sign In
          </a>
        </div>
      </nav>

      {/* ── Hero Content ────────────────────────────────────────────────── */}
      <div className="hero-content">
        {/* Badge */}
        <div className="hero-badge liquid-glass" aria-label="Platform type">
          <span className="hero-badge-dot" aria-hidden="true" />
          Smart College ERP Platform
        </div>

        {/* Heading */}
        <h1
          className="hero-heading"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          The Future of Campus Management is Here
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle">
          AI-powered attendance tracking, automated marks processing &amp; real-time analytics
          <br />
          for Students, Mentors, HODs &amp; Administrators — all in one unified platform.
        </p>

        {/* Feature pills */}
        <div className="hero-pills" aria-label="Key features">
          {[
            { icon: ShieldCheck, label: 'Role-Based Access' },
            { icon: BarChart2,   label: 'Real-time Analytics' },
            { icon: Users,       label: '4 User Portals' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="hero-pill liquid-glass">
              <Icon size={13} aria-hidden="true" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          type="button"
          className="hero-cta-btn"
          aria-label="Access the Campus360 AI portal"
          onClick={() => navigate('/login')}
        >
          <span>Access Portal</span>
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>

      {/* ── Footer social icons ──────────────────────────────────────────── */}
      <div className="hero-footer-icons" role="list" aria-label="Social media links">
        <button
          type="button"
          className="hero-icon-btn liquid-glass"
          aria-label="Follow Campus360 AI on Instagram"
          role="listitem"
        >
          <InstagramIcon size={16} />
        </button>
        <button
          type="button"
          className="hero-icon-btn liquid-glass"
          aria-label="Follow Campus360 AI on X"
          role="listitem"
        >
          <XIcon size={15} />
        </button>
        <button
          type="button"
          className="hero-icon-btn liquid-glass"
          aria-label="Visit Campus360 AI website"
          role="listitem"
        >
          <Globe size={16} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
};

export default Hero;
