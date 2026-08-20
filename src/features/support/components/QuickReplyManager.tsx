import React, { useState } from 'react';
import { Zap, Check } from 'lucide-react';
import type { ChatTemplate } from '@/types'; // Asumsi ChatTemplate didefinisikan di types.ts

interface QuickReplyManagerProps {
  onSelect: (message: string) => void;
  onAutoSend: (message: string) => void;
}

export const QuickReplyManager = ({ onSelect, onAutoSend }: QuickReplyManagerProps) => {
  const [filter, setFilter] = useState('Semua');
  // Contoh data, dalam produksi ini akan ditarik dari Firestore
  const templates: ChatTemplate[] = [
    {
      id: '1',
      label: 'Reset Password',
      message: 'Halo {nama}, link reset password Anda adalah: ...',
      category: 'Teknis',
    },
    {
      id: '2',
      label: 'Absensi',
      message: 'Halo {nama}, data absensi telah kami terima.',
      category: 'Akademik',
    },
  ];

  const filtered = filter === 'Semua' ? templates : templates.filter((t) => t.category === filter);

  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-500" /> Balasan Cepat
      </h3>
      <select
        onChange={(e) => setFilter(e.target.value)}
        className="w-full p-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 mb-3"
      >
        <option>Semua</option>
        <option value="Akademik">Akademik</option>
        <option value="Teknis">Teknis</option>
      </select>
      <div className="space-y-2">
        {filtered.map((t) => (
          <div key={t.id} className="flex items-center gap-2">
            <button
              onClick={() => onSelect(t.message)}
              className="flex-1 text-left p-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
            >
              {t.label}
            </button>
            <button
              onClick={() => onAutoSend(t.message)}
              className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"
              title="Kirim Otomatis"
            >
              <Check className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickReplyManager;
