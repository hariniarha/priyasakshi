import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  Users,
  Mail,
  ShoppingBag,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const NAV = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/orders', icon: Package, label: 'Orders' },
  { to: '/admin/customers', icon: Users, label: 'Customers' },
  { to: '/admin/messages', icon: Mail, label: 'Messages' },
];

export default function AdminNav() {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    navigate('/');
  };

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 py-3" data-testid="admin-nav">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div
          className="flex items-center justify-between rounded-full px-4 sm:px-6 py-2.5 backdrop-blur-xl bg-[#FAF5F8]/85"
          style={{
            boxShadow:
              '0 20px 40px rgba(138,115,130,0.15), inset 0 -2px 4px rgba(138,115,130,0.08), inset 0 2px 4px rgba(255,255,255,0.85)',
          }}
        >
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(180deg, #EBA8C5 0%, #8B2956 100%)',
                boxShadow:
                  '0 8px 16px rgba(139,41,86,0.35), inset 0 -3px 6px rgba(60,10,30,0.35), inset 0 3px 6px rgba(255,255,255,0.5)',
              }}
            >
              <span className="font-serif-display text-white text-xl font-bold">A</span>
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <div className="font-serif-display text-[#8B2956] text-lg font-semibold">Admin</div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-[#2E2825]/60">Priya Sakshi</div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors flex items-center gap-2 ${
                  isActive(l.to)
                    ? 'bg-white text-[#8B2956] shadow-[0_8px_16px_rgba(138,115,130,0.12)]'
                    : 'text-[#2E2825]/75 hover:text-[#8B2956] hover:bg-white/70'
                }`}
                data-testid={`admin-nav-${l.label.toLowerCase()}`}
              >
                <l.icon className="w-4 h-4" />
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="hidden sm:flex clay-btn-ghost h-11 px-4 items-center gap-2 text-sm"
              data-testid="admin-view-shop"
            >
              <ShoppingBag className="w-4 h-4" /> Shop
            </Link>
            <button
              onClick={handleLogout}
              className="clay-btn-ghost h-11 w-11 flex items-center justify-center"
              data-testid="admin-logout-btn"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              className="lg:hidden clay-btn-ghost h-11 w-11 flex items-center justify-center"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="lg:hidden mt-3 clay-card p-4 flex flex-col gap-1"
            >
              {NAV.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className={`text-left px-4 py-3 rounded-2xl font-medium flex items-center gap-2 ${
                    isActive(l.to) ? 'bg-[#F5EBF0] text-[#8B2956]' : 'text-[#2E2825] hover:bg-[#F5EBF0]'
                  }`}
                >
                  <l.icon className="w-4 h-4" /> {l.label}
                </Link>
              ))}
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="text-left px-4 py-3 rounded-2xl font-medium flex items-center gap-2 text-[#2E2825] hover:bg-[#F5EBF0]"
              >
                <ShoppingBag className="w-4 h-4" /> View Shop
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
