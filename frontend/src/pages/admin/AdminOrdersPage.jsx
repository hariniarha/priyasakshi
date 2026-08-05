import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Loader, ListFilter as Filter } from 'lucide-react';
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

const ORDER_STATUSES = ['', 'received', 'pending_payment', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['', 'unpaid', 'pending', 'paid'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const load = () => {
    setLoading(true);
    getAdminOrders({ search, status: statusFilter, paymentStatus: paymentFilter })
      .then((res) => setOrders(res.orders || []))
      .finally(() => setLoading(false));
  };

  // Debounce search; reload on filter change.
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, paymentFilter]);

  return (
    <div>
      <span className="clay-pill">Admin</span>
      <h1 className="mt-4 font-serif-display text-4xl sm:text-5xl text-[#8B2956] leading-tight">Orders</h1>
      <p className="mt-2 text-sm text-[#2E2825]/70">Search, filter and manage every order.</p>

      {/* Filters */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#2E2825]/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          <input
            className="clay-input !pl-11"
            placeholder="Search by name, email, phone or order id"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="admin-orders-search"
          />
        </div>
        <div className="relative">
          <Filter className="w-4 h-4 text-[#2E2825]/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          <select
            className="clay-input !pl-11 appearance-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            data-testid="admin-orders-status-filter"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{s ? `Status: ${s}` : 'All statuses'}</option>
            ))}
          </select>
        </div>
        <div className="relative">
          <Filter className="w-4 h-4 text-[#2E2825]/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          <select
            className="clay-input !pl-11 appearance-none"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            data-testid="admin-orders-payment-filter"
          >
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{s ? `Payment: ${s}` : 'All payments'}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="mt-12 flex flex-col items-center text-[#2E2825]/60">
          <Loader className="w-8 h-8 animate-spin mb-3" /> Loading orders…
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-12 clay-card p-10 text-center text-[#2E2825]/60">No orders found.</div>
      ) : (
        <div className="mt-8 clay-card p-4 sm:p-6 overflow-x-auto" data-testid="admin-orders-table">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#2E2825]/60">
                <th className="pb-3 pr-4 font-medium">Order ID</th>
                <th className="pb-3 pr-4 font-medium">Customer</th>
                <th className="pb-3 pr-4 font-medium">Email</th>
                <th className="pb-3 pr-4 font-medium">Phone</th>
                <th className="pb-3 pr-4 font-medium">Date</th>
                <th className="pb-3 pr-4 font-medium">Amount</th>
                <th className="pb-3 pr-4 font-medium">Payment</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => {
                const pay = getPaymentBadge(o.payment_status);
                const st = getOrderBadge(o.status);
                return (
                  <motion.tr
                    key={o.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: i * 0.02 }}
                    className="border-t border-[#EADFE5] hover:bg-[#FAF5F8]/60"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        to={`/admin/orders/${o.id}`}
                        className="font-medium text-[#8B2956] hover:underline"
                        data-testid={`admin-order-link-${o.id}`}
                      >
                        #{String(o.id).slice(0, 8)}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-[#2E2825]">{o.customer_name}</td>
                    <td className="py-3 pr-4 text-[#2E2825]/70">{o.customer_email}</td>
                    <td className="py-3 pr-4 text-[#2E2825]/70">{o.phone || '—'}</td>
                    <td className="py-3 pr-4 text-[#2E2825]/70">{formatDate(o.created_at)}</td>
                    <td className="py-3 pr-4 font-semibold text-[#2E2825]">{formatINR(o.total)}</td>
                    <td className="py-3 pr-4">
                      <span className="clay-pill inline-flex items-center gap-1" style={{ background: pay.bg, color: pay.color }}>
                        <pay.Icon className="w-3.5 h-3.5" />
                        {pay.label}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="clay-pill inline-flex items-center gap-1" style={{ background: st.bg, color: st.color }}>
                        <st.Icon className="w-3.5 h-3.5" />
                        {st.label}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
