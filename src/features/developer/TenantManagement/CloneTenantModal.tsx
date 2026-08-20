import React, { useState } from 'react';
import {
  XMarkIcon,
  Square2StackIcon,
  IdentificationIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import type { TenantData } from '@/types';
import { useOrganizations } from '@/hooks/useTenants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sourceTenant: TenantData | null;
  isSubmitting: boolean;
}

const CloneTenantModal: React.FC<Props> = ({ isOpen, onClose, sourceTenant, isSubmitting }) => {
  const { clone } = useOrganizations();
  const [targetId, setTargetId] = useState('');
  const [newName, setNewName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceTenant || !targetId || !newName) return;
    try {
      await clone(sourceTenant.id!, targetId, newName);
      onClose();
      setTargetId('');
      setNewName('');
    } catch (err) {
      // Handled in hook
    }
  };

  if (!isOpen || !sourceTenant) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-purple-500/20"
        >
          <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-purple-50/30 dark:bg-purple-950/20">
            <div>
              <h2 className="text-lg font-bold text-purple-900 dark:text-purple-400 uppercase tracking-tight flex items-center gap-2">
                <Square2StackIcon className="w-5 h-5" />
                Clone Tenant
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-wide">
                Infrastucture Replication Engine
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mb-6">
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Source Tenant</p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {sourceTenant.identitas.namaMadrasah}
              </p>
              <p className="text-[9px] font-mono text-indigo-500 mt-1">ID: {sourceTenant.id}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide ml-1">
                  ID Target Tenant
                </label>
                <div className="relative">
                  <IdentificationIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    placeholder="e.g. 12345678"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide ml-1">
                  Nama Madrasah Baru
                </label>
                <div className="relative">
                  <BuildingOfficeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    placeholder="MAN Baru Copy"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold uppercase text-xs tracking-wide shadow-xl shadow-purple-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Processing...' : 'Execute Cloning'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CloneTenantModal;
