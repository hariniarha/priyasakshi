import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Clock, Truck, CircleCheck as CheckCircle, TrendingUp, Users, ArrowRight } from 'lucide-react';
import { getAdminDashboard } from '@/services/adminService';
import { formatINR } from '@/lib/format';
import { getPaymentBadge, getOrderBadge } from '@/lib/orderBadges';

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

const STAT_CARDS = [
  { key: 'total_orders', label: 'Total Orders', icon: Package, bg: '#F5D9DD', accent: '#C99AA0' },
  { key: 'pending_orders', label: 'Pending Orders', icon: Clock, bg: '#FEF3C7', accent: '#B45309' },
  { key: 'processing_orders', label: 'Processing', icon: TrendingUp, bg: '#E4D9F0', accent: '#9B8BB4' },
  { key: 'shipped_orders', label: 'Shipped', icon: Truck, bg: '#E0E7FF', accent: '#4F46E5' },
  { key: 'delivered_orders', label: 'Delivered', icon: CheckCircle, bg: '#DCFCE7', accent: '#15803D' },
  { key: 'total_customers', label: 'Customers', icon: Users, bg: '#EBB5C8', accent: '#8B2956' },
];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getAdminDashboard()
      .then((res) => mounted && setData(res.data))
      .catch(() => mounted && setData(null))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="clay-card p-10 flex items-center justify-center text-[#2E2825]/60">
        Loading dashboard…
      </div>
    );
  }

  if (!data) {
    return <div className="clay-card p-10 text-center text-[#2E2825]/60">Could not load dashboard.</div>;
  }

  return (
    <div>
      <h1 className="font-serif-display text-4xl text-[#8B2956] mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {STAT_CARDS.map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="clay-card p-5"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: s.bg, boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.08), inset 0 3px 6px rgba(255,255,255,0.5)' }}
            >
              <s.icon className="w-5 h-5" style={{ color: s.accent }} />
            </div>
            <div className="font-serif-display text-3xl text-[#2E2825]">{data[s.key] ?? 0}</div>
            <div className="text-xs uppercase tracking-widest text-[#2E2825]/55 mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Revenue */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="clay-card-cream p-6 mt-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#fff', boxShadow: 'inset 0 -3px 6px rgba(138,115,130,0.15), inset 0 3px 6px rgba(255,255,255,0.9)' }}>
            <TrendingUp className="w-5 h-5 text-[#8B2956]" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-[#2E2825]/55">Revenue (paid orders)</div>
            <div className="font-serif-display text-4xl text-[#8B2956]">{formatINR(data.revenue || 0)}</div>
          </div>
        </div>
      </motion.div>

      {/* Recent orders */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif-display text-2xl text-[#2E2825]">Recent Orders</h2>
          <Link to="/admin/orders" className="text-sm text-[#8B2956] font-semibold flex items-center gap-1 hover:underline">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="clay-card p-4 overflow-x-auto">
          {(!data.recent_orders || data.recent_orders.length === 0) ? (
            <p className="text-sm text-[#2E2825]/60 py-6 text-center">No orders yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-[#2E2825]/50 border-b border-[#EADFE5]">
                  <th className="pb-3 pr-4">Order</th>
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_orders.map((o) => {
                  const pay = getPaymentBadge(o.payment_status);
                  const st = getOrderBadge(o.status);
                  return (
                    <tr key={o.id} className="border-b border-[#EADFE5] last:border-0">
                      <td className="py-3 pr-4">
                        <Link to={`/admin/orders/${o.id}`} className="font-medium text-[#8B2956] hover:underline">
                          #{String(o.id).slice(0, 8)}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-[#2E2825]">{o.customer_name}</td>
                      <td className="py-3 pr-4 text-[#2E2825]/70">{formatDate(o.created_at)}</td>
                      <td className="py-3 pr-4 font-semibold text-[#2E2825]">{formatINR(o.total)}</td>
                      <td className="py-3">
                        <div className="flex gap-1.5">
                          <span className="clay-pill inline-flex items-center gap-1" style={{ background: pay.bg, color: pay.color }}>
                            <pay.Icon className="w-3 h-3" />{pay.label}
                          </span>
                          {pay.label.toLowerCase() !== st.label.toLowerCase() && (
                            <span className="clay-pill inline-flex items-center gap-1" style={{ background: st.bg, color: st.color }}>
                              <st.Icon className="w-3 h-3" />{st.label}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
