import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { WhatsAppIcon } from '@/shared/Icons';
import { sendComplaintSecure } from '@/services/complaintService';
import { QuickReplyManager } from './QuickReplyManager';
import { placeholderReplacer } from '@/utils/chatUtils';
import { useLiveComplaint } from '@/hooks/useLiveComplaint';
import { useAutoFix } from '@/hooks/useAutoFix';

interface LiveComplaintWindowProps {
  userSessionId: string; // Pola 4: studentsid (idUnik), teachersid (NIP), atau Session Tamu
  userNama: string;
  peranUser: 'siswa' | 'guru' | 'orang_tua' | 'publik';
  filterRombelCurrent: string; // Pola 2
  fallbackClass: string; // Pola 2
  isDarkMode: boolean; // Pola 5
  pageContext?: 'login' | 'dashboard' | 'other';
  isAdmin?: boolean;
  onClose: () => void;
}

export const LiveComplaintWindow = ({
  userSessionId,
  userNama,
  peranUser,
  filterRombelCurrent,
  fallbackClass,
  isDarkMode,
  pageContext = 'other',
  isAdmin = false,
  onClose,
}: LiveComplaintWindowProps) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const draftKey = `draft_${userSessionId}`;

  const { safeCall } = useAutoFix();

  // Pola 2: Alihkan cakupan grup secara otomatis jika mendeteksi pencarian massal
  const activeScope = filterRombelCurrent === 'semua rombel' ? fallbackClass : filterRombelCurrent;

  const roomId =
    peranUser === 'publik'
      ? `complaint_publik_${userSessionId}`
      : `complaint_internal_${userSessionId}`;

  // Call decoupled custom hook instead of Firebase methods directly in UI
  const { messages, errorBanner: hookError } = useLiveComplaint(roomId, userSessionId);

  const errorBanner = customError || hookError;

  // --- Auto-Draft Logic ---
  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) setInputText(savedDraft);
  }, [userSessionId]);

  useEffect(() => {
    localStorage.setItem(draftKey, inputText);
  }, [inputText, draftKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFormSubmit = async (e?: React.FormEvent, textToSubmit = inputText) => {
    if (e) e.preventDefault();
    if (!textToSubmit.trim() || isSending) return;

    setIsSending(true);
    setCustomError(null);
    const textSnapshot = textToSubmit;
    setInputText('');
    localStorage.removeItem(draftKey);

    try {
      const priority = pageContext === 'login' ? 'high' : 'normal';
      // Wrap send operation in useAutoFix safeCall
      await safeCall(async () => {
        await sendComplaintSecure(
          userSessionId,
          userNama,
          peranUser,
          activeScope,
          textSnapshot,
          priority,
        );
      }, 'Complaint.Send');
    } catch (err: any) {
      setCustomError(err.message || String(err));
      setInputText(textSnapshot);
    } finally {
      setIsSending(false);
    }
  };

  // --- Quick Reply Logic ---
  const handleSelectTemplate = (template: string) => {
    const filled = placeholderReplacer(template, { nama: userNama });
    setInputText((prev) => (prev ? prev + ' ' + filled : filled));
  };

  const handleAutoSendTemplate = (template: string) => {
    const filled = placeholderReplacer(template, { nama: userNama });
    handleFormSubmit(undefined, filled);
  };

  // Pola 5: Token Desain Glassmorphism Slate-950 / Slate-200
  const theme = {
    card: isDarkMode
      ? 'bg-slate-950/40 border-slate-800 text-slate-200'
      : 'bg-white/70 border-slate-200 text-slate-900',
    header: isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100/80 border-slate-200',
    bubbleMe: isDarkMode
      ? 'bg-slate-800 border-slate-700 text-slate-100'
      : 'bg-slate-200 border-slate-300 text-slate-900',
    bubbleAdmin: 'bg-rose-500/20 border-rose-500/30 text-rose-400',
  };

  return (
    <div
      className={`flex flex-col h-[520px] max-h-[75vh] w-[92vw] sm:w-[410px] rounded-3xl border backdrop-blur-md overflow-hidden shadow-2xl ${theme.card}`}
    >
      <div
        className={`flex items-center justify-between p-3 border-b backdrop-blur-lg ${theme.header}`}
      >
        <div>
          <h3 className="text-xs font-bold tracking-tight text-left">
            Pusat pengaduan kendala sistem
          </h3>
          <p className="text-[9px] text-slate-500 font-mono tracking-tight">
            Identitas: {userSessionId} ({peranUser})
          </p>
        </div>
        <div className="flex items-center gap-2">
          {errorBanner && (
            <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-mono animate-pulse">
              Luring
            </span>
          )}
          <button
            onClick={() =>
              window.open(
                `https://wa.me/6285194030064?text=Halo%2C%20saya%20${userNama}%20membutuhkan%20bantuan%20terkait%20e-Mam%20System.`,
                '_blank',
              )
            }
            className="p-1 hover:bg-slate-200/20 rounded-full transition-colors text-emerald-500 ml-4"
            title="Chat via WhatsApp"
          >
            <WhatsAppIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200/20 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.senderId === userSessionId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-xl px-3 py-1.5 text-xs border backdrop-blur-sm ${
                  isMe ? theme.bubbleMe : theme.bubbleAdmin
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap text-left">{msg.messageText}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {isAdmin && (
        <QuickReplyManager onSelect={handleSelectTemplate} onAutoSend={handleAutoSendTemplate} />
      )}

      <form
        onSubmit={handleFormSubmit}
        className="p-2 border-t flex items-center space-x-2 backdrop-blur-lg"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Jelaskan detail kendala teknis Anda..."
          className="flex-1 bg-transparent border-none text-xs focus:ring-0 placeholder-slate-500 font-medium"
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="text-[11px] bg-slate-800 hover:bg-slate-700 disabled:opacity-40 px-4 py-1.5 rounded-lg text-slate-300 font-semibold border border-slate-700 transition-all"
        >
          Kirim
        </button>
      </form>
    </div>
  );
};

export default LiveComplaintWindow;
