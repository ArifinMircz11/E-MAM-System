import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { Loader2 } from '@/shared/Icons';

const LazyBarChart = lazy(() =>
  import('recharts').then((module) => {
    return {
      default: ({ data }: { data: any[] }) => (
        <module.ResponsiveContainer width="100%" height="100%">
          <module.BarChart data={data}>
            <defs>
              <linearGradient id="colorViolations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorAchievements" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <module.CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
            <module.XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: '900' }}
              dy={10}
            />
            <module.YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: '900' }}
            />
            <module.Tooltip
              contentStyle={{
                borderRadius: '24px',
                border: 'none',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                fontSize: '11px',
                fontWeight: '900',
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                backdropFilter: 'blur(12px)',
                color: '#fff',
                padding: '12px 16px',
              }}
              itemStyle={{ color: '#fff' }}
              cursor={{ fill: 'rgba(0,0,0,0.02)' }}
            />
            <module.Bar
              dataKey="violations"
              name="Pelanggaran"
              fill="url(#colorViolations)"
              radius={[6, 6, 0, 0]}
              barSize={32}
            />
            <module.Bar
              dataKey="achievements"
              name="Prestasi"
              fill="url(#colorAchievements)"
              radius={[6, 6, 0, 0]}
              barSize={32}
            />
          </module.BarChart>
        </module.ResponsiveContainer>
      ),
    };
  }),
);

interface BehaviorChartProps {
  data: any[];
}

export const BehaviorChart = ({ data }: BehaviorChartProps) => {
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
    <div
      ref={containerRef}
      className="w-full h-[350px] min-h-[350px] bg-slate-900/5 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-inner mt-4 flex items-center justify-center"
    >
      {inView ? (
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          }
        >
          <LazyBarChart data={data} />
        </Suspense>
      ) : (
        <div className="text-slate-400 font-bold uppercase tracking-wide text-[10px] flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" /> Memuat Grafik...
        </div>
      )}
    </div>
  );
};
