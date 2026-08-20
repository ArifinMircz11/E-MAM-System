import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { UserRole } from '@/types';

interface GreetingProps {
  userName: string;
  userRole: UserRole;
  madrasahInfo: any;
  roleLabels: Record<string, string>;
  referenceId?: string | null;
}

const Greeting: React.FC<GreetingProps> = ({
  userName,
  userRole,
  madrasahInfo,
  roleLabels,
  referenceId,
}) => {
  const greetingMessage = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 11) return 'selamat pagi';
    if (hour < 15) return 'selamat siang';
    if (hour < 19) return 'selamat sore';
    return 'selamat malam';
  }, []);

  return (
    <div className="px-6 md:px-0">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight">
          {greetingMessage},<br />
          <span className="text-emerald-500">{userName.toLowerCase()}</span>
        </h1>
      </motion.div>
    </div>
  );
};

export default React.memo(Greeting);
