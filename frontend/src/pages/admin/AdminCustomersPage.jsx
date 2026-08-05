import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Loader } from 'lucide-react';
import { getCustomers } from '@/services/adminService';
import { formatINR } from '@/lib/format';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getCustomers()
      .then((res) => mounted && setCustomers(res.customers || []))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <span className="clay-pill">Admin</span>
      <h1 className="mt-4 font-serif-display text-4xl sm:text-5xl text-[#8B2956] leading-tight">Customers</h1>
      <p className="mt-2 text-sm text-[#2E2825]/70">Everyone who has signed up, with their order history.</p>

      {loading ? (
        <div className="mt-12 flex flex-col items-center text-[#2E2825]/60">
          <Loader className="w-8 h-8 animate-spin mb-3" /> Loading customers…
        </div>
      ) : customers.length === 0 ? (
        <div className="mt-12 clay-card p-10 text-center text-[#2E2825]/60">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          No customers yet.
        </div>
      ) : (
        <div className="mt-8 clay-card p-4 sm:p-6 overflow-x-auto" data-testid="admin-customers-table">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#2E2825]/60">
                <th className="pb-3 pr-4 font-medium">Name</th>
                <th className="pb-3 pr-4 font-medium">Email</th>
                <th className="pb-3 pr-4 font-medium">Phone</th>
                <th className="pb-3 pr-4 font-medium">Total Orders</th>
                <th className="pb-3 font-medium">Lifetime Spend</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="border-t border-[#EADFE5]"
                >
                  <td className="py-3 pr-4 font-medium text-[#2E2825]">{c.name}</td>
                  <td className="py-3 pr-4 text-[#2E2825]/70">{c.email}</td>
                  <td className="py-3 pr-4 text-[#2E2825]/70">{c.phone || '—'}</td>
                  <td className="py-3 pr-4 text-[#2E2825]">{c.total_orders}</td>
                  <td className="py-3 font-semibold text-[#8B2956]">{formatINR(c.lifetime_spend)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
