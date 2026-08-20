import React, { useState, useEffect } from 'react';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import type { UserRole } from '@/types';
import { XMarkIcon } from '@/shared/Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface EmergencyAlertProps {
  userRole: UserRole;
}

const EmergencyAlert: React.FC<EmergencyAlertProps> = ({ userRole }) => {
  const { emergencyAlert, loading } = useSystemConfig();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!loading && emergencyAlert && emergencyAlert.isActive) {
      const targetRoles = (emergencyAlert as any).targetRoles || ['ALL'];
      if (targetRoles.includes('ALL') || targetRoles.includes(userRole)) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    } else {
      setIsVisible(false);
    }
  }, [emergencyAlert, userRole, loading]);

  if (!emergencyAlert || !isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && emergencyAlert && (
        <div className="fixed inset-x-0 top-6 z-[9999999] flex justify-center pointer-events-none px-4">
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="pointer-events-auto w-full max-w-sm bg-rose-600/40 backdrop-blur-md text-white overflow-hidden shadow-xl rounded-2xl border border-white/20"
          >
            <div className="px-5 py-4 flex flex-col items-center text-center gap-2 relative">
              <button
                onClick={() => setIsVisible(false)}
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-full transition-all active:scale-90"
              >
                <XMarkIcon className="w-4 h-4 opacity-70" />
              </button>

              <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold  tracking-[0.2em] leading-none mb-1.5 opacity-80">
                  {emergencyAlert.title}
                </span>
                <p className="text-[11px] font-semibold leading-snug opacity-90">
                  {emergencyAlert.message}
                </p>
              </div>
            </div>
            {/* Progress Loader Effect Background */}
            <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full overflow-hidden">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="h-full bg-gradient-to-r from-transparent via-white/40 to-transparent w-full"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EmergencyAlert;
