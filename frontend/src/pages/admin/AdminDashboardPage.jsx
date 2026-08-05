import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package,
  Clock,
  Loader,
  Truck,
  PackageCheck,
  IndianRupee,
  Users,
  ArrowRight,
} from 'lucide-react';
import { getDashboard } from '@/services/adminService';
import { formatINR } from '@/lib/format';
import { getOrderBadge } from '@/lib/orderBadges';

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getDashboard()
      .then((res) => mounted && setData(res.data))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center text-[#2E2825]/60 py-20">
        <Loader className="w-8 h-8 animate-spin mb-3" /> Loading dashboard…
      </div>
    );
  }

  const stats = [
    { label: 'Total Orders', value: data.total_orders, icon: Package, bg: '#F5D9DD', color: '#C99AA0' },
    { label: 'Pending Orders', value: data.pending_orders, icon: Clock, bg: '#FEF3C7', color: '#B45309' },
    { label: 'Processing Orders', value: data.processing_orders, icon: Loader, bg: '#DBEAFE', color: '#2563EB' },
    { label: 'Shipped Orders', value: data.shipped_orders, icon: Truck, bg: '#E0E7FF', color: '#4F46E5' },
    { label: 'Delivered Orders', value: data.delivered_orders, icon: PackageCheck, bg: '#DCFCE7', color: '#15803D' },
    { label: 'Revenue', value: formatINR(data.revenue), icon: IndianRupee, bg: '#F5E0E8', color: '#8B2956' },
    { label: 'Total Customers', value: data.total_customers, icon: Users, bg: '#E4D9F0', color: '#9B8BB4' },
  ];

  return (
    <div>
      <span className="clay-pill">Admin</span>
      <h1 className="mt-4 font-serif-display text-4xl sm:text-5xl text-[#8B2956] leading-tight">
        Dashboard
      </h1>
      <p className="mt-2 text-sm text-[#2E2825]/70">Overview of your store at a glance.</p>

      <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="clay-card p-5"
            data-testid={`admin-stat-${s.label.toLowerCase().replace(/\s/g, '-')}`}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: s.bg,
                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.06), inset 0 4px 8px rgba(255,255,255,0.5)',
              }}
            >
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div className="font-serif-display text-3xl text-[#2E2825]">{s.value}</div>
            <div className="text-xs uppercase tracking-widest text-[#2E2825]/60 mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif-display text-2xl text-[#2E2825]">Recent Orders</h2>
          <Link
            to="/admin/orders"
            className="clay-btn-ghost h-10 px-4 inline-flex items-center gap-2 text-sm"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {data.recent_orders.length === 0 ? (
          <div className="clay-card p-8 text-center text-[#2E2825]/60">No orders yet.</div>
        ) : (
          <div className="clay-card p-4 sm:p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#2E2825]/60">
                  <th className="pb-3 pr-4 font-medium">Order</th>
                  <th className="pb-3 pr-4 font-medium">Customer</th>
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_orders.map((o) => {
                  const st = getOrderBadge(o.status);
                  return (
                    <tr key={o.id} className="border-t border-[#EADFE5]">
                      <td className="py-3 pr-4">
                        <Link
                          to={`/admin/orders/${o.id}`}
                          className="font-medium text-[#8B2956] hover:underline"
                        >
                          #{String(o.id).slice(0, 8)}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-[#2E2825]">{o.customer_name}</td>
                      <td className="py-3 pr-4 text-[#2E2825]/70">{formatDate(o.created_at)}</td>
                      <td className="py-3 pr-4 font-semibold text-[#2E2825]">{formatINR(o.total)}</td>
                      <td className="py-3">
                        <span
                          className="clay-pill inline-flex items-center gap-1"
                          style={{ background: st.bg, color: st.color }}
                        >
                          <st.Icon className="w-3.5 h-3.5" />
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
