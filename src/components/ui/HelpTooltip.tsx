import React, { useState } from 'react';
import { HelpCircleIcon } from '@/shared/Icons';

interface HelpTooltipProps {
  text: string;
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({ text }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block cursor-help">
      <div
        role="button"
        onClick={() => setShow(!show)}
        className="focus:outline-none cursor-pointer"
      >
        <HelpCircleIcon className="w-4 h-4 text-slate-400 hover:text-indigo-500" />
      </div>
      {show && (
        <div className="absolute z-50 p-3 text-xs bg-slate-800 text-white rounded-xl shadow-xl w-64 mt-2 border border-slate-700">
          {text}
          <div
            className="block mt-2 text-[10px] text-slate-300 underline cursor-pointer"
            role="button"
            onClick={() => setShow(false)}
          >
            Tutup
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpTooltip;
