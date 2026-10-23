import React from 'react';
import { motion } from 'framer-motion';

export function PageLoader({ text = 'Securing Digital Criminal Justice Dossier...' }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Pulsating outer halo */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-primary/10 border border-primary/20"
          animate={{ scale: [1, 1.15, 1], rotate: [0, 90, 180, 270, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Glowing inner core */}
        <motion.div
          className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center shadow-md shadow-primary/25"
          animate={{ scale: [0.9, 1.05, 0.9] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="material-symbols-outlined text-white text-xl animate-pulse">
            local_police
          </span>
        </motion.div>
      </div>

      <motion.p
        className="mt-5 text-xs font-semibold uppercase tracking-wider text-secondary"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {text}
      </motion.p>
      <div className="mt-2 w-32 h-1 bg-surface-container rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}

export default PageLoader;
