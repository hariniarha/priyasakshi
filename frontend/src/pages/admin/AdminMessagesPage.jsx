import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Search, Loader as Loader2, Mail, MailOpen, Trash2, X } from 'lucide-react';
import { getAdminMessages, markMessageRead, deleteMessage } from '@/services/adminService';

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const load = (q) => {
    setLoading(true);
    getAdminMessages(q)
      .then((res) => setMessages(res.data || []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let mounted = true;
    const t = setTimeout(() => mounted && load(search), 250);
    return () => { mounted = false; clearTimeout(t); };
  }, [search]);

  const handleToggleRead = async (m) => {
    const res = await markMessageRead(m.id, !m.read);
    if (res.ok) {
      setMessages((prev) => prev.map((x) => (x.id === m.id ? res.data : x)));
      if (selected?.id === m.id) setSelected(res.data);
    } else {
      toast.error(res.error || 'Could not update message');
    }
  };

  const handleDelete = async (id) => {
    const res = await deleteMessage(id);
    if (res.ok) {
      toast.success('Message deleted');
      setMessages((prev) => prev.filter((x) => x.id !== id));
      if (selected?.id === id) setSelected(null);
    } else {
      toast.error(res.error || 'Could not delete message');
    }
  };

  return (
    <div>
      <h1 className="font-serif-display text-4xl text-[#8B2956] mb-6">Contact Messages</h1>

      <div className="clay-card p-4 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-[#2E2825]/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          <input className="clay-input !pl-11" placeholder="Search by name, email, or message" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="clay-card p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-[#2E2825]/60"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading messages…</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'linear-gradient(180deg, #E8C4D0 0%, #D9B5C0 100%)' }}>
              <Mail className="w-7 h-7 text-white" />
            </div>
            <p className="text-sm text-[#2E2825]/60">No messages found.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => (
              <li key={m.id} className={`clay-card-cream p-4 ${!m.read ? 'ring-2 ring-[#8B2956]/30' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <button onClick={() => setSelected(m)} className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      {!m.read && <span className="w-2 h-2 rounded-full bg-[#8B2956]" />}
                      <span className="font-serif-display text-lg text-[#2E2825]">{m.name}</span>
                    </div>
                    <div className="text-xs text-[#2E2825]/60 mt-0.5">{m.email} · {formatDate(m.created_at)}</div>
                    <p className="text-sm text-[#2E2825]/75 mt-2 line-clamp-2">{m.message}</p>
                  </button>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleToggleRead(m)} className="w-9 h-9 rounded-full clay-btn-ghost flex items-center justify-center" aria-label={m.read ? 'Mark unread' : 'Mark read'}>
                      {m.read ? <MailOpen className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(m.id)} className="w-9 h-9 rounded-full clay-btn-ghost flex items-center justify-center text-[#8B2956]" aria-label="Delete message">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Message detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}>
            <motion.div className="clay-card p-6 sm:p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-serif-display text-2xl text-[#8B2956]">Message</h2>
                <button onClick={() => setSelected(null)} className="w-9 h-9 rounded-full clay-btn-ghost flex items-center justify-center"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3 text-sm">
                <div><span className="text-xs uppercase tracking-widest text-[#2E2825]/50">From</span><div className="font-medium text-[#2E2825]">{selected.name}</div></div>
                <div><span className="text-xs uppercase tracking-widest text-[#2E2825]/50">Email</span><div className="text-[#2E2825]">{selected.email}</div></div>
                <div><span className="text-xs uppercase tracking-widest text-[#2E2825]/50">Date</span><div className="text-[#2E2825]">{formatDate(selected.created_at)}</div></div>
                <div><span className="text-xs uppercase tracking-widest text-[#2E2825]/50">Message</span><pre className="whitespace-pre-wrap font-sans text-[#2E2825]/85 mt-1 bg-[#F5EBF0] p-4 rounded-2xl">{selected.message}</pre></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
