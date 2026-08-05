import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Search, Loader, Mail, Trash2, Check, MailOpen } from 'lucide-react';
import { getMessages, markMessageRead, deleteMessage } from '@/services/adminService';

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    getMessages(search)
      .then((res) => setMessages(res.messages || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleMarkRead = async (id) => {
    const res = await markMessageRead(id);
    if (res.ok) {
      setMessages((prev) => prev.map((m) => (m.id === id ? res.message : m)));
      toast.success('Marked as read');
    } else {
      toast.error(res.error || 'Could not update');
    }
  };

  const handleDelete = async (id) => {
    const res = await deleteMessage(id);
    if (res.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      toast.success('Message deleted');
    } else {
      toast.error(res.error || 'Could not delete');
    }
  };

  return (
    <div>
      <span className="clay-pill">Admin</span>
      <h1 className="mt-4 font-serif-display text-4xl sm:text-5xl text-[#8B2956] leading-tight">Messages</h1>
      <p className="mt-2 text-sm text-[#2E2825]/70">Contact form submissions from your customers.</p>

      <div className="mt-8 relative">
        <Search className="w-4 h-4 text-[#2E2825]/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
        <input
          className="clay-input !pl-11"
          placeholder="Search by name, email or message"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="admin-messages-search"
        />
      </div>

      {loading ? (
        <div className="mt-12 flex flex-col items-center text-[#2E2825]/60">
          <Loader className="w-8 h-8 animate-spin mb-3" /> Loading messages…
        </div>
      ) : messages.length === 0 ? (
        <div className="mt-12 clay-card p-10 text-center text-[#2E2825]/60">
          <Mail className="w-10 h-10 mx-auto mb-3 opacity-40" />
          No messages found.
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          <AnimatePresence>
            {messages.map((m) => (
              <motion.li
                key={m.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`clay-card p-5 ${m.read ? '' : 'ring-2 ring-[#8B2956]/30'}`}
                data-testid={`admin-message-${m.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: '#F5EBF0', boxShadow: 'inset 0 -3px 6px rgba(138,115,130,0.15)' }}
                    >
                      {m.read ? <MailOpen className="w-4 h-4 text-[#9B8BB4]" /> : <Mail className="w-4 h-4 text-[#8B2956]" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-serif-display text-lg text-[#2E2825]">
                        {m.name} {!m.read && <span className="clay-pill ml-2 text-[10px]">New</span>}
                      </div>
                      <div className="text-xs text-[#2E2825]/60 mt-0.5">{m.email} · {formatDate(m.created_at)}</div>
                      <p className="text-sm text-[#2E2825]/80 mt-3 whitespace-pre-wrap">{m.message}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!m.read && (
                      <button
                        onClick={() => handleMarkRead(m.id)}
                        className="w-9 h-9 rounded-full clay-btn-ghost flex items-center justify-center"
                        aria-label="Mark as read"
                        data-testid={`admin-message-read-${m.id}`}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="w-9 h-9 rounded-full clay-btn-ghost flex items-center justify-center text-[#8B2956]"
                      aria-label="Delete message"
                      data-testid={`admin-message-delete-${m.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
