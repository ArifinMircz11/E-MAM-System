import { useState, useEffect, useRef, useMemo } from 'react';

interface UseVirtualTableProps {
  itemsCount: number;
  estimateRowHeight: number;
  overscan?: number;
}

export function useVirtualTable({
  itemsCount,
  estimateRowHeight,
  overscan = 5,
}: UseVirtualTableProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(500);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      setScrollTop(el.scrollTop);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        // Use clientHeight/contentRect to avoid layout jitter
        setContainerHeight(entries[0].contentRect.height || el.clientHeight || 500);
      }
    });

    el.addEventListener('scroll', handleScroll, { passive: true });
    resizeObserver.observe(el);

    // Initial values
    setScrollTop(el.scrollTop);
    setContainerHeight(el.clientHeight || 500);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [containerRef.current]);

  const { startIndex, endIndex, startOffset, endOffset } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / estimateRowHeight) - overscan);
    const end = Math.min(
      itemsCount,
      Math.ceil((scrollTop + containerHeight) / estimateRowHeight) + overscan,
    );

    const startOffset = start * estimateRowHeight;
    const endOffset = Math.max(0, (itemsCount - end) * estimateRowHeight);

    return {
      startIndex: start,
      endIndex: end,
      startOffset,
      endOffset,
    };
  }, [scrollTop, containerHeight, itemsCount, estimateRowHeight, overscan]);

  return {
    containerRef,
    startIndex,
    endIndex,
    startOffset,
    endOffset,
  };
}
