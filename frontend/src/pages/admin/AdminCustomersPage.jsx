import React, { useEffect, useState } from 'react';
import { Search, Loader as Loader2, Users } from 'lucide-react';
import { getAdminCustomers } from '@/services/adminService';
import { formatINR } from '@/lib/format';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const t = setTimeout(() => {
      getAdminCustomers(search)
        .then((res) => mounted && setCustomers(res.data || []))
        .catch(() => mounted && setCustomers([]))
        .finally(() => mounted && setLoading(false));
    }, 250);
    return () => { mounted = false; clearTimeout(t); };
  }, [search]);

  return (
    <div>
      <h1 className="font-serif-display text-4xl text-[#8B2956] mb-6">Customers</h1>

      <div className="clay-card p-4 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-[#2E2825]/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          <input className="clay-input !pl-11" placeholder="Search by name, email, or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="clay-card p-4 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-[#2E2825]/60"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading customers…</div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'linear-gradient(180deg, #C9B5DD 0%, #7B6B9A 100%)' }}>
              <Users className="w-7 h-7 text-white" />
            </div>
            <p className="text-sm text-[#2E2825]/60">No customers found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-[#2E2825]/50 border-b border-[#EADFE5]">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4 hidden md:table-cell">Phone</th>
                <th className="pb-3 pr-4">Total Orders</th>
                <th className="pb-3">Lifetime Spend</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-[#EADFE5] last:border-0">
                  <td className="py-3 pr-4 font-medium text-[#2E2825]">{c.name}</td>
                  <td className="py-3 pr-4 text-[#2E2825]/70">{c.email}</td>
                  <td className="py-3 pr-4 hidden md:table-cell text-[#2E2825]/70">{c.phone || '—'}</td>
                  <td className="py-3 pr-4 text-[#2E2825]">{c.total_orders}</td>
                  <td className="py-3 font-serif-display text-lg text-[#8B2956]">{formatINR(c.lifetime_spend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
