import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

export const HeroBanner = ({ 
  title, 
  subtitle, 
  imageSrc, 
  delay = 0,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={clsx(
        "relative w-full h-[280px] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(139,92,246,0.15)] group",
        className
      )}
    >
      {/* Dynamic Animated Gradient Background mimicking Sapphire UI's AI visual */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-[#1e103c] to-[#09090B] z-0" />
      
      {/* Animated glowing orbs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/30 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary-500/40 transition-colors duration-1000 z-0" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-500/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 group-hover:bg-pink-500/30 transition-colors duration-1000 z-0" />
      
      <div className="relative z-10 p-8 md:p-10 h-full flex flex-col justify-center max-w-lg">
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.2 }}
          className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3 font-heading"
        >
          {title}
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.3 }}
          className="text-sm md:text-base text-white/70 leading-relaxed"
        >
          {subtitle}
        </motion.p>
      </div>
      
      {/* Optional Right-aligned 3D Graphic placeholder */}
      {imageSrc && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay + 0.4 }}
          className="absolute right-0 bottom-0 top-0 w-1/2 hidden md:block z-0 opacity-80 mix-blend-screen"
          style={{
            backgroundImage: `url(${imageSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'left center'
          }}
        />
      )}
      
      {/* Premium Glass Overlay Border */}
      <div className="absolute inset-0 rounded-3xl border border-white/10 pointer-events-none z-20" />
    </motion.div>
  );
};

export default HeroBanner;
