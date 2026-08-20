import React from 'react';
import { WhatsAppIcon } from '@/shared/Icons';
import { DevTabLogs } from './DevTabLogs';
import { DevActionButton } from './DevActionButton';
import { DevConsoleActions } from '@/services/devConsoleActions';

interface DevTabIntegrationTestProps {
  testNumber: string;
  setTestNumber: (val: string) => void;
  testMessage: string;
  setTestMessage: (val: string) => void;
  sendTestWhatsApp: () => Promise<void>;
  sendingTest: boolean;
  whatsappLogs: any[];
}

export const DevTabIntegrationTest: React.FC<DevTabIntegrationTestProps> = ({
  testNumber,
  setTestNumber,
  testMessage,
  setTestMessage,
  sendTestWhatsApp,
  sendingTest,
  whatsappLogs,
}) => {
  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full pb-32 custom-scrollbar space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* WhatsApp API sandbox */}
        <div className="bg-white dark:bg-[#0B1121] rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <WhatsAppIcon className="w-5 h-5 text-emerald-500 animate-pulse" /> WhatsApp API
              Sandbox Gateway
            </h3>
            <p className="text-[10px] font-bold text-slate-500 mt-1">
              Gunakan gateway WhatsApp API terintegrasi untuk menguji pengiriman pesan massal
              langsung dari backend.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Nomor Telepon Tujuan
              </label>
              <input
                type="tel"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-[10px] font-bold text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/10"
                placeholder="Format internasional regional, misal: 6281234567890"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Isi Pesan Demo
              </label>
              <textarea
                rows={3}
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-[10px] font-bold text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/10 custom-scrollbar"
                placeholder="Pesan percobaan ini akan terkirim dengan parameter token WhatsApp API Gateway."
              />
            </div>

            <DevActionButton
              label="Kirim Pesan Tes WhatsApp"
              icon={<WhatsAppIcon className="w-4 h-4" />}
              variant="success"
              onAction={() => DevConsoleActions.testWhatsApp(testNumber, testMessage)}
            />
          </div>
        </div>

        {/* Logs of Delivery events */}
        <div className="space-y-6">
          <DevTabLogs whatsappLogs={whatsappLogs} />
        </div>
      </div>
    </div>
  );
};
