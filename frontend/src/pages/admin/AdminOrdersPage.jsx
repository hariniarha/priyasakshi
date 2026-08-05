import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Loader as Loader2 } from 'lucide-react';
import { getAdminOrders } from '@/services/adminService';
import { formatINR } from '@/lib/format';
import { getPaymentBadge, getOrderBadge } from '@/lib/orderBadges';

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

const STATUS_OPTIONS = ['all', 'received', 'pending_payment', 'paid', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
const PAYMENT_OPTIONS = ['all', 'unpaid', 'pending', 'paid'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const t = setTimeout(() => {
      getAdminOrders({ search, status, paymentStatus })
        .then((res) => mounted && setOrders(res.data || []))
        .catch(() => mounted && setOrders([]))
        .finally(() => mounted && setLoading(false));
    }, 250);
    return () => { mounted = false; clearTimeout(t); };
  }, [search, status, paymentStatus]);

  return (
    <div>
      <h1 className="font-serif-display text-4xl text-[#8B2956] mb-6">Orders</h1>

      {/* Filters */}
      <div className="clay-card p-4 mb-6 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#2E2825]/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          <input
            className="clay-input !pl-11"
            placeholder="Search by name, email, phone, or order ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="clay-input md:w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
        </select>
        <select className="clay-input md:w-44" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
          {PAYMENT_OPTIONS.map((s) => <option key={s} value={s}>{s === 'all' ? 'All payments' : s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="clay-card p-4 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-[#2E2825]/60">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading orders…
          </div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-[#2E2825]/60 py-12 text-center">No orders match your filters.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-[#2E2825]/50 border-b border-[#EADFE5]">
                <th className="pb-3 pr-4">Order ID</th>
                <th className="pb-3 pr-4">Customer</th>
                <th className="pb-3 pr-4 hidden md:table-cell">Email</th>
                <th className="pb-3 pr-4 hidden lg:table-cell">Phone</th>
                <th className="pb-3 pr-4 hidden sm:table-cell">Date</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Payment</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const pay = getPaymentBadge(o.payment_status);
                const st = getOrderBadge(o.status);
                return (
                  <tr key={o.id} className="border-b border-[#EADFE5] last:border-0 hover:bg-[#FAF5F8]/60">
                    <td className="py-3 pr-4">
                      <Link to={`/admin/orders/${o.id}`} className="font-medium text-[#8B2956] hover:underline">
                        #{String(o.id).slice(0, 8)}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-[#2E2825]">{o.customer_name}</td>
                    <td className="py-3 pr-4 hidden md:table-cell text-[#2E2825]/70">{o.customer_email}</td>
                    <td className="py-3 pr-4 hidden lg:table-cell text-[#2E2825]/70">{o.phone || '—'}</td>
                    <td className="py-3 pr-4 hidden sm:table-cell text-[#2E2825]/70">{formatDate(o.created_at)}</td>
                    <td className="py-3 pr-4 font-semibold text-[#2E2825]">{formatINR(o.total)}</td>
                    <td className="py-3 pr-4">
                      <span className="clay-pill inline-flex items-center gap-1" style={{ background: pay.bg, color: pay.color }}>
                        <pay.Icon className="w-3 h-3" />{pay.label}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="clay-pill inline-flex items-center gap-1" style={{ background: st.bg, color: st.color }}>
                        <st.Icon className="w-3 h-3" />{st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
