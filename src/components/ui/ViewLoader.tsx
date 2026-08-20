import React from 'react';
import { Loader2 } from '@/shared/Icons';

export const ViewLoader = () => (
  <div className="h-full w-full flex items-center justify-center bg-[#020617]">
    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
  </div>
);
