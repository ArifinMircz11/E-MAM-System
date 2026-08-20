import React, { useRef } from 'react';

interface Props {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export const PullToRefreshWrapper: React.FC<Props> = ({ onRefresh, children }) => {
  const startY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].pageY;
  };

  const handleTouchEnd = async (e: React.TouchEvent) => {
    const endY = e.changedTouches[0].pageY;
    // Check if at the top and pulled down enough
    if (window.scrollY === 0 && endY - startY.current > 100) {
      await onRefresh();
    }
  };

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} className="w-full h-full">
      {children}
    </div>
  );
};
