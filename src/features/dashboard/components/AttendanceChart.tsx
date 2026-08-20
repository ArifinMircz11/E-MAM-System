import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { Loader2 } from '@/shared/Icons';

const LazyChart = lazy(() =>
  import('recharts').then((module) => {
    return {
      default: ({ data }: { data: any[] }) => (
        <module.ResponsiveContainer width="100%" height="100%">
          <module.PieChart>
            <module.Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={34}
              outerRadius={42}
              paddingAngle={0}
              dataKey="value"
              startAngle={90}
              endAngle={450}
              stroke="none"
            >
              {data.map((entry, index) => (
                <module.Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </module.Pie>
          </module.PieChart>
        </module.ResponsiveContainer>
      ),
    };
  }),
);

interface AttendanceChartProps {
  data: any[];
  percentage: number;
}

export const AttendanceChart = ({ data, percentage }: AttendanceChartProps) => {
  const [inView, setInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-24 h-[96px] min-h-[96px] shrink-0 relative">
      {inView ? (
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-white/50 animate-spin" />
            </div>
          }
        >
          <LazyChart data={data} />
        </Suspense>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-white/20 animate-spin" />
        </div>
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-lg font-black text-white leading-none">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
};
