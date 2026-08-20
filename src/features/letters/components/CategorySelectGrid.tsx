import React from 'react';
import { ServiceCategory } from '@/types';
import {
  BriefcaseIcon,
  AcademicCapIcon,
  UsersIcon,
  GlobeAltIcon,
} from '@/shared/Icons';

interface CategorySelectGridProps {
  onSelectCategory: (category: ServiceCategory) => void;
}

const categories = [
  {
    id: ServiceCategory.GTK,
    title: 'Layanan GTK',
    icon: <BriefcaseIcon className="w-6 h-6" />,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    desc: 'Guru & Tenaga Kependidikan',
  },
  {
    id: ServiceCategory.SISWA,
    title: 'Layanan Siswa',
    icon: <AcademicCapIcon className="w-6 h-6" />,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    desc: 'Siswa Aktif Madrasah',
  },
  {
    id: ServiceCategory.ALUMNI,
    title: 'Layanan Alumni',
    icon: <UsersIcon className="w-6 h-6" />,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    desc: 'Lulusan & Alumni',
  },
  {
    id: ServiceCategory.TAMU,
    title: 'Layanan Tamu',
    icon: <GlobeAltIcon className="w-6 h-6" />,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    desc: 'Umum & Instansi Luar',
  },
];

export const CategorySelectGrid: React.FC<CategorySelectGridProps> = ({
  onSelectCategory,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelectCategory(cat.id)}
          className="flex flex-col items-center text-center p-6 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all group"
        >
          <div
            className={`w-14 h-14 ${cat.bg} ${cat.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
          >
            {cat.icon}
          </div>
          <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{cat.title}</h4>
          <p className="text-[10px] text-slate-400 font-medium">{cat.desc}</p>
        </button>
      ))}
    </div>
  );
};

export default CategorySelectGrid;
