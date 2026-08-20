import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  MessageSquare,
  Ticket,
  Users,
  Search,
  Send,
  Plus,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  Wifi,
  WifiOff,
  Star
} from 'lucide-react';
import { supportModuleService } from '@/services/supportModuleService';
import { surveyModuleService } from '@/services/surveyModuleService';
import toast from 'react-hot-toast';

export const SupportModuleView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'faq' | 'chat' | 'tickets' | 'agents' | 'surveys'>('faq');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Survey states
  const [surveyStatistics, setSurveyStatistics] = useState<any[]>([]);
  const [surveyTemplates, setSurveyTemplates] = useState<any[]>([]);
  const [surveyList, setSurveyList] = useState<any[]>([]);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState<boolean>(false);
  const [selectedServiceType, setSelectedServiceType] = useState<string>('ptsp');
  const [activeSurveyQuestions, setActiveSurveyQuestions] = useState<any[]>([]);
  const [respondentType, setRespondentType] = useState<'guru' | 'siswa' | 'orang_tua' | 'tendik' | 'umum'>('guru');
  const [surveyRatings, setSurveyRatings] = useState<Record<string, number>>({});
  const [surveyTextAnswers, setSurveyTextAnswers] = useState<Record<string, string>>({});

  // FAQ states
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [faqs, setFaqs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // Chat states
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState<boolean>(false);
  const [newChatSubject, setNewChatSubject] = useState<string>('');
  const [newChatCategory, setNewChatCategory] = useState<string>('cat_akademik');
  const [newChatPriority, setNewChatPriority] = useState<'Rendah' | 'Sedang' | 'Tinggi' | 'Darurat'>('Sedang');

  // Ticket states
  const [tickets, setTickets] = useState<any[]>([]);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState<boolean>(false);
  const [newTicketTitle, setNewTicketTitle] = useState<string>('');
  const [newTicketCategory, setNewTicketCategory] = useState<string>('cat_akademik');
  const [newTicketDesc, setNewTicketDesc] = useState<string>('');
  const [newTicketPriority, setNewTicketPriority] = useState<'Rendah' | 'Sedang' | 'Tinggi' | 'Darurat'>('Sedang');

  // Agent states
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    loadInitialData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const cats = await supportModuleService.getFaqCategories();
      setCategories(cats);
      const listFaqs = await supportModuleService.getFaqs();
      setFaqs(listFaqs);

      const convs = await supportModuleService.getConversations();
      setConversations(convs);
      if (convs.length > 0 && !activeConvId) {
        setActiveConvId(convs[0].id);
        const msgs = await supportModuleService.getMessages(convs[0].id);
        setMessages(msgs);
      }

      const tix = await supportModuleService.getTickets();
      setTickets(tix);

      const ags = await supportModuleService.getAgents();
      setAgents(ags);

      const stats = await surveyModuleService.getAllStatistics();
      setSurveyStatistics(stats);
      const tpls = await surveyModuleService.getTemplates();
      setSurveyTemplates(tpls);
      const survs = await surveyModuleService.getAllSurveys();
      setSurveyList(survs);
    } catch (e) {
      console.error('Error loading support module data:', e);
    }
  };

  const openSurveyModal = async (serviceType: string = 'ptsp') => {
    setSelectedServiceType(serviceType);
    const qs = await surveyModuleService.getQuestions(serviceType);
    setActiveSurveyQuestions(qs);
    const initialRatings: Record<string, number> = {};
    qs.forEach((q: any) => {
      if (q.answerType === 'rating') initialRatings[q.id] = 5;
      if (q.answerType === 'yes_no') initialRatings[q.id] = 1;
    });
    setSurveyRatings(initialRatings);
    setSurveyTextAnswers({});
    setIsSurveyModalOpen(true);
  };

  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const answers = activeSurveyQuestions.map((q: any) => ({
        questionId: q.id,
        rating: q.answerType === 'rating' || q.answerType === 'yes_no' ? (surveyRatings[q.id] || 5) : undefined,
        answer: q.answerType === 'text' ? (surveyTextAnswers[q.id] || '') : undefined,
      }));

      await surveyModuleService.submitSurveyResponse({
        serviceType: selectedServiceType,
        serviceId: 'srv_gen_' + Date.now(),
        respondentType,
        answers,
      });

      toast.success('Terima kasih! Survei kepuasan layanan berhasil dikirim.');
      setIsSurveyModalOpen(false);
      const stats = await surveyModuleService.getAllStatistics();
      setSurveyStatistics(stats);
      const survs = await surveyModuleService.getAllSurveys();
      setSurveyList(survs);
    } catch (err) {
      toast.error('Gagal mengirim survei.');
    }
  };

  useEffect(() => {
    if (activeConvId) {
      supportModuleService.getMessages(activeConvId).then(setMessages);
    }
  }, [activeConvId]);

  const handleSearchFaq = async (q: string) => {
    setSearchQuery(q);
    const results = await supportModuleService.searchFaqs(q);
    setFaqs(results);
  };

  const handleSelectCategory = async (catId: string) => {
    setSelectedCategory(catId);
    const list = await supportModuleService.getFaqs(catId === 'all' ? undefined : catId);
    setFaqs(list);
  };

  const handleRateFaq = async (faqId: string, helpful: boolean) => {
    await supportModuleService.rateFaq(faqId, helpful);
    toast.success(helpful ? 'Terima kasih atas tanggapan positif Anda!' : 'Terima kasih atas masukan Anda.');
    const list = await supportModuleService.getFaqs(selectedCategory === 'all' ? undefined : selectedCategory);
    setFaqs(list);
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvId) return;
    try {
      await supportModuleService.sendMessage(activeConvId, newMessage.trim());
      setNewMessage('');
      const msgs = await supportModuleService.getMessages(activeConvId);
      setMessages(msgs);
    } catch (err) {
      toast.error('Gagal mengirim pesan.');
    }
  };

  const handleCreateChatSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatSubject.trim()) {
      toast.error('Subjek percakapan wajib diisi.');
      return;
    }
    try {
      const conv = await supportModuleService.createConversation(newChatSubject.trim(), newChatCategory, newChatPriority, 'Halo, saya membutuhkan bantuan terkait masalah ini.');
      setIsNewChatModalOpen(false);
      setNewChatSubject('');
      toast.success(`Percakapan #${conv.ticketNumber} berhasil dibuat.`);
      await loadInitialData();
      setActiveConvId(conv.id);
      setActiveTab('chat');
    } catch (err) {
      toast.error('Gagal membuat percakapan.');
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketTitle.trim() || !newTicketDesc.trim()) {
      toast.error('Judul dan deskripsi tiket wajib diisi.');
      return;
    }
    try {
      await supportModuleService.createTicket(newTicketTitle.trim(), newTicketCategory, newTicketDesc.trim(), newTicketPriority);
      setIsNewTicketModalOpen(false);
      setNewTicketTitle('');
      setNewTicketDesc('');
      toast.success('Tiket pengaduan berhasil dikirim.');
      await loadInitialData();
      setActiveTab('tickets');
    } catch (err) {
      toast.error('Gagal mengirim tiket.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pusat Layanan & Bantuan (Live Agent & FAQ)</h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {isOnline ? 'Online (Sync Aktif)' : 'Offline (Mode Lokal Dexie)'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Akses basis pengetahuan FAQ secara offline via Dexie, Live Chat interaktif, dan sistem tiket terpusat e-MAM System.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'faq' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Pusat FAQ</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'chat' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Live Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'tickets' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Ticket className="w-4 h-4" />
            <span>Tiket Bantuan</span>
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'agents' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Users className="w-4 h-4" />
            <span>Daftar Agen</span>
          </button>
          <button
            onClick={() => setActiveTab('surveys')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'surveys' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Survei Kepuasan</span>
          </button>
        </div>
      </div>

      {/* TAB 1: FAQ KNOWLEDGE BASE */}
      {activeTab === 'faq' && (
        <div className="space-y-6">
          {/* Search & Categories */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchFaq(e.target.value)}
                placeholder="Cari pertanyaan, kendala, atau kata kunci (misal: jadwal, absen, surat)..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 placeholder-slate-400 text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => handleSelectCategory('all')}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${selectedCategory === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Semua Kategori
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${selectedCategory === cat.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ List */}
          <div className="space-y-3">
            {faqs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-8">
                <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-800">Tidak ada FAQ ditemukan</h3>
                <p className="text-sm text-slate-500 mt-1">Coba gunakan kata kunci lain atau buat tiket baru.</p>
              </div>
            ) : (
              faqs.map((faq) => {
                const isExpanded = expandedFaq === faq.id;
                return (
                  <div key={faq.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all">
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                      className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 mt-0.5">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">{faq.question}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Dilihat {faq.viewCount || 0} kali</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                        {isExpanded ? 'Tutup' : 'Lihat Jawaban'}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-1 border-t border-slate-100 space-y-4 bg-slate-50/30">
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs text-slate-500">
                          <span>Apakah jawaban ini membantu?</span>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleRateFaq(faq.id, true)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors font-medium"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>Ya ({faq.helpfulCount || 0})</span>
                            </button>
                            <button
                              onClick={() => handleRateFaq(faq.id, false)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors font-medium"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                              <span>Tidak ({faq.notHelpfulCount || 0})</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LIVE CHAT */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversation Sidebar */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 text-sm">Percakapan Aktif</h2>
              <button
                onClick={() => setIsNewChatModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Chat Baru</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {conversations.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">Belum ada percakapan aktif.</p>
              ) : (
                conversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setActiveConvId(c.id)}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all border ${activeConvId === c.id ? 'bg-emerald-50/50 border-emerald-200 shadow-sm' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-700">{c.ticketNumber}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${c.status === 'Open' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {c.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-slate-800 mt-1 truncate">{c.subject}</h4>
                    <p className="text-[11px] text-slate-400 mt-1">{new Date(c.startedAt).toLocaleString('id-ID')}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[600px]">
            {activeConvId ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                      LA
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Live Agent Helpdesk e-MAM</h3>
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Petugas Online Siap Membantu
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
                  {messages.map((m) => {
                    const isUser = m.senderType === 'user';
                    return (
                      <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl p-4 shadow-sm text-sm ${isUser ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'}`}>
                          <p className="whitespace-pre-wrap">{m.message}</p>
                          <span className={`block text-[10px] mt-1.5 text-right ${isUser ? 'text-emerald-100' : 'text-slate-400'}`}>
                            {new Date(m.sentAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendChatMessage} className="p-4 border-t border-slate-100 flex items-center gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ketik pesan atau kendala Anda di sini..."
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800"
                  />
                  <button
                    type="submit"
                    className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <MessageSquare className="w-12 h-12 mb-3 stroke-1" />
                <p className="text-sm font-medium text-slate-600">Pilih percakapan atau buat chat baru untuk mulai berkonsultasi.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TICKETS */}
      {activeTab === 'tickets' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Daftar Tiket Pengaduan</h2>
              <p className="text-sm text-slate-500">Pantau status laporan dan permintaan layanan teknis Anda.</p>
            </div>
            <button
              onClick={() => setIsNewTicketModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Tiket Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tickets.length === 0 ? (
              <div className="col-span-2 text-center py-12 bg-white rounded-2xl border border-slate-100 p-8">
                <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-800">Belum ada tiket pengaduan</h3>
                <p className="text-sm text-slate-500 mt-1">Buat tiket baru jika Anda membutuhkan bantuan mendalam dari tim IT atau Admin.</p>
              </div>
            ) : (
              tickets.map((t) => (
                <div key={t.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">{t.ticketNumber}</span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${t.status === 'Open' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {t.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-base">{t.title}</h3>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{t.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">Prioritas: {t.priority}</span>
                    <span>{new Date(t.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AGENTS */}
      {activeTab === 'agents' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Daftar Petugas Bantuan (Support Agents)</h2>
            <p className="text-sm text-slate-500 mt-1">Daftar petugas layanan operasional e-MAM System yang siap membantu madrasah.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {agents.map((ag) => (
              <div key={ag.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold mx-auto shadow-inner">
                  {ag.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">{ag.name}</h3>
                  <p className="text-xs font-medium text-emerald-600 mt-0.5">{ag.role}</p>
                  <p className="text-xs text-slate-500 mt-1">{ag.department}</p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${ag.status === 'online' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    <span className={`w-2 h-2 rounded-full ${ag.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                    {ag.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SURVEYS & SATISFACTION DASHBOARD */}
      {activeTab === 'surveys' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Dashboard Survei Kepuasan Layanan e-MAM System</h2>
              <p className="text-emerald-100 text-sm mt-1 max-w-2xl">
                Evaluasi terpadu kualitas layanan (PTSP, Live Agent, BK, Perpustakaan, Keuangan, Sarpras, Akademik, Absensi, Inventaris) berbasis offline-first Dexie dan sinkronisasi Firestore.
              </p>
            </div>
            <button
              onClick={() => openSurveyModal('ptsp')}
              className="px-5 py-3 bg-white text-emerald-800 rounded-xl font-semibold text-sm hover:bg-emerald-50 shadow-sm transition-all flex items-center gap-2 shrink-0"
            >
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Isi Survei Layanan Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rata-rata Kepuasan</span>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-extrabold text-slate-900">
                  {surveyStatistics.length > 0 ? (surveyStatistics.reduce((acc, s) => acc + s.averageRating, 0) / surveyStatistics.length).toFixed(1) : '5.0'}
                </span>
                <div className="flex text-amber-500">
                  <Star className="w-5 h-5 fill-amber-500" />
                  <Star className="w-5 h-5 fill-amber-500" />
                  <Star className="w-5 h-5 fill-amber-500" />
                  <Star className="w-5 h-5 fill-amber-500" />
                  <Star className="w-5 h-5 fill-amber-500" />
                </div>
              </div>
              <p className="text-xs text-emerald-600 font-medium">Skala 1.0 - 5.0 bintang</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Responden</span>
              <div className="text-3xl font-extrabold text-slate-900">
                {surveyStatistics.reduce((acc, s) => acc + s.totalResponses, surveyList.length)}
              </div>
              <p className="text-xs text-slate-500">Guru, Siswa, & Orang Tua</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pengguna Puas (≥ 4★)</span>
              <div className="text-3xl font-extrabold text-emerald-600">
                {surveyStatistics.length > 0 ? Math.round((surveyStatistics.reduce((acc, s) => acc + s.satisfiedCount, 0) / Math.max(1, surveyStatistics.reduce((acc, s) => acc + s.totalResponses, 1))) * 100) : 100}%
              </div>
              <p className="text-xs text-slate-500">Sangat Puas & Puas</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Perlu Perbaikan (≤ 2★)</span>
              <div className="text-3xl font-extrabold text-rose-600">
                {surveyStatistics.length > 0 ? Math.round((surveyStatistics.reduce((acc, s) => acc + s.unsatisfiedCount, 0) / Math.max(1, surveyStatistics.reduce((acc, s) => acc + s.totalResponses, 1))) * 100) : 0}%
              </div>
              <p className="text-xs text-slate-500">Tidak Puas & Sangat Tidak Puas</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900">Ringkasan Per Jenis Layanan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {surveyTemplates.map((tpl) => {
                const stat = surveyStatistics.find((s) => s.serviceType === tpl.serviceType) || { totalResponses: 0, averageRating: 5.0, satisfiedCount: 0 };
                return (
                  <div key={tpl.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold uppercase">{tpl.serviceType}</span>
                        <div className="flex items-center gap-1 text-amber-500 text-sm font-bold">
                          <Star className="w-4 h-4 fill-amber-500" />
                          <span>{stat.averageRating.toFixed(1)}</span>
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-900 mt-2">{tpl.name}</h4>
                      <p className="text-xs text-slate-500">{tpl.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 text-xs text-slate-600">
                      <span>{stat.totalResponses} Responden</span>
                      <button
                        onClick={() => openSurveyModal(tpl.serviceType)}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                      >
                        Beri Survei
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Riwayat Pengisian Survei Terbaru</h3>
            {surveyList.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">Belum ada survei yang diisi. Silakan isi survei layanan di atas.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Jenis Layanan</th>
                      <th className="p-3">Responden</th>
                      <th className="p-3">ID Layanan / Tiket</th>
                      <th className="p-3">Waktu</th>
                      <th className="p-3">Status Sync</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {surveyList.slice(0, 10).map((srv) => (
                      <tr key={srv.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-medium uppercase text-slate-900">{srv.serviceType}</td>
                        <td className="p-3 text-slate-600">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium">{srv.respondentType}</span>
                        </td>
                        <td className="p-3 text-slate-500 font-mono text-xs">{srv.serviceId}</td>
                        <td className="p-3 text-slate-500 text-xs">{new Date(srv.submittedAt).toLocaleString('id-ID')}</td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
                            {srv.syncStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: FILL SURVEY */}
      {isSurveyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-6 border border-slate-100 my-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Formulir Survei Kepuasan Layanan</h2>
                <p className="text-xs text-slate-500">Bantu kami meningkatkan kualitas layanan e-MAM System.</p>
              </div>
              <button onClick={() => setIsSurveyModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmitSurvey} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Layanan</label>
                  <select
                    value={selectedServiceType}
                    onChange={(e) => openSurveyModal(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                  >
                    {surveyTemplates.map((t) => (
                      <option key={t.id} value={t.serviceType}>{t.name} ({t.serviceType})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sebagai Responden</label>
                  <select
                    value={respondentType}
                    onChange={(e) => setRespondentType(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 capitalize"
                  >
                    <option value="guru">Guru</option>
                    <option value="siswa">Siswa</option>
                    <option value="orang_tua">Orang Tua / Wali</option>
                    <option value="tendik">Tenaga Kependidikan</option>
                    <option value="umum">Umum</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {activeSurveyQuestions.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <label className="block text-xs font-semibold text-slate-900">
                      {idx + 1}. {q.question} {q.isRequired && <span className="text-rose-500">*</span>}
                    </label>

                    {q.answerType === 'rating' && (
                      <div className="flex items-center gap-2 pt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setSurveyRatings({ ...surveyRatings, [q.id]: star })}
                            className={`p-2 rounded-lg transition-all flex flex-col items-center gap-1 ${(surveyRatings[q.id] || 5) >= star ? 'text-amber-500 bg-amber-50' : 'text-slate-300 bg-white'}`}
                          >
                            <Star className="w-5 h-5 fill-current" />
                            <span className="text-[10px] font-bold">{star}</span>
                          </button>
                        ))}
                        <span className="text-xs font-medium text-slate-600 ml-2">
                          {surveyRatings[q.id] === 1 && '⭐ Sangat Tidak Puas'}
                          {surveyRatings[q.id] === 2 && '⭐⭐ Tidak Puas'}
                          {surveyRatings[q.id] === 3 && '⭐⭐⭐ Cukup'}
                          {surveyRatings[q.id] === 4 && '⭐⭐⭐⭐ Puas'}
                          {surveyRatings[q.id] === 5 && '⭐⭐⭐⭐⭐ Sangat Puas'}
                        </span>
                      </div>
                    )}

                    {q.answerType === 'yes_no' && (
                      <div className="flex gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setSurveyRatings({ ...surveyRatings, [q.id]: 1 })}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold border ${surveyRatings[q.id] === 1 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'}`}
                        >
                          Ya / Tercapai
                        </button>
                        <button
                          type="button"
                          onClick={() => setSurveyRatings({ ...surveyRatings, [q.id]: 0 })}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold border ${surveyRatings[q.id] === 0 ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-700 border-slate-200'}`}
                        >
                          Tidak
                        </button>
                      </div>
                    )}

                    {q.answerType === 'text' && (
                      <textarea
                        value={surveyTextAnswers[q.id] || ''}
                        onChange={(e) => setSurveyTextAnswers({ ...surveyTextAnswers, [q.id]: e.target.value })}
                        placeholder="Tuliskan masukan atau saran Anda di sini..."
                        rows={2}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSurveyModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 shadow-sm"
                >
                  Kirim Survei
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW CHAT */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6 border border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Mulai Percakapan Baru</h2>
              <button onClick={() => setIsNewChatModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateChatSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subjek Kendala / Topik</label>
                <input
                  type="text"
                  value={newChatSubject}
                  onChange={(e) => setNewChatSubject(e.target.value)}
                  placeholder="Contoh: Kendala Sinkronisasi Absensi Siswa"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Layanan</label>
                <select
                  value={newChatCategory}
                  onChange={(e) => setNewChatCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Prioritas</label>
                <select
                  value={newChatPriority}
                  onChange={(e) => setNewChatPriority(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Rendah">Rendah</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Tinggi">Tinggi</option>
                  <option value="Darurat">Darurat</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewChatModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 shadow-sm"
                >
                  Mulai Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW TICKET */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-6 border border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Buat Tiket Pengaduan Baru</h2>
              <button onClick={() => setIsNewTicketModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Tiket / Kendala</label>
                <input
                  type="text"
                  value={newTicketTitle}
                  onChange={(e) => setNewTicketTitle(e.target.value)}
                  placeholder="Contoh: Kesalahan Data Rapor Semester"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                <select
                  value={newTicketCategory}
                  onChange={(e) => setNewTicketCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Prioritas</label>
                <select
                  value={newTicketPriority}
                  onChange={(e) => setNewTicketPriority(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Rendah">Rendah</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Tinggi">Tinggi</option>
                  <option value="Darurat">Darurat</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Lengkap</label>
                <textarea
                  value={newTicketDesc}
                  onChange={(e) => setNewTicketDesc(e.target.value)}
                  placeholder="Jelaskan kendala secara detail..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 shadow-sm"
                >
                  Kirim Tiket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportModuleView;
