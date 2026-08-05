import React, { useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Package, Users, Mail, ArrowLeft, ShoppingBag, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { site } from '@/data/site';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: Package },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/messages', label: 'Messages', icon: Mail },
];

export default function AdminLayout() {
  const { user, loading, isAdmin } = useAuth();
  const { setIsOpen } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF5F8] flex items-center justify-center">
        <div className="font-serif-display text-2xl text-[#8B2956]">Loading…</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#FAF5F8] flex items-center justify-center px-4">
        <div className="clay-card p-10 max-w-md text-center">
          <h1 className="font-serif-display text-3xl text-[#8B2956]">Admin access required</h1>
          <p className="mt-3 text-sm text-[#2E2825]/70">
            You do not have permission to view this page. Sign in with an admin account.
          </p>
          <Link to="/login" className="mt-6 clay-btn-primary h-12 px-6 inline-flex items-center gap-2">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF5F8]">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-[#FAF5F8]/85 backdrop-blur-xl border-b border-[#EADFE5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden clay-btn-ghost h-10 w-10 flex items-center justify-center"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/admin" className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(180deg, #EBA8C5 0%, #8B2956 100%)',
                  boxShadow: '0 8px 16px rgba(139,41,86,0.35), inset 0 -3px 6px rgba(60,10,30,0.35), inset 0 3px 6px rgba(255,255,255,0.5)',
                }}
              >
                <span className="font-serif-display text-white text-lg font-bold">P</span>
              </div>
              <div className="text-left leading-tight">
                <div className="font-serif-display text-[#8B2956] text-base font-semibold">Admin</div>
                <div className="text-[10px] tracking-[0.2em] uppercase text-[#2E2825]/60">{site.name}</div>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpen(true)}
              className="clay-btn-ghost h-10 w-10 flex items-center justify-center"
              aria-label="Open cart"
            >
              <ShoppingBag className="w-5 h-5 text-[#2E2825]" />
            </button>
            <Link to="/" className="clay-btn-ghost h-10 px-4 flex items-center gap-2 text-sm">
              <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:block">Back to shop</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <nav className="clay-card p-3 sticky top-24">
            {NAV.map((n) => {
              const active = n.end ? location.pathname === n.to : location.pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${
                    active ? 'bg-[#F5EBF0] text-[#8B2956]' : 'text-[#2E2825]/70 hover:bg-[#F5EBF0]/60'
                  }`}
                >
                  <n.icon className="w-4 h-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="lg:hidden clay-card p-3 mb-4"
            >
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-[#2E2825]/70 hover:bg-[#F5EBF0]/60"
                >
                  <n.icon className="w-4 h-4" />
                  {n.label}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
