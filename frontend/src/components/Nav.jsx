import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, User, LogOut, LayoutDashboard, MailCheck, Loader as Loader2, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { resendVerification } from '@/services/authService';
import { site } from '@/data/site';

const NAV_LINKS = [
  { id: 'story', label: 'Our Story' },
  { id: 'sarees', label: 'Sarees' },
  { id: 'skincare', label: 'Skincare' },
  { id: 'testimonials', label: 'Praise' },
  { id: 'contact', label: 'Contact' },
];

export default function Nav() {
  const { count, setIsOpen, bounce } = useCart();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    setMobileOpen(false);
    toast.success('Signed out');
    navigate('/');
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleVerifyEmail = async () => {
    if (verifying) return;
    setVerifying(true);
    const res = await resendVerification();
    setVerifying(false);
    if (res.ok) {
      toast.success(res.data?.message || 'Verification email sent');
    } else {
      toast.error(res.error || 'Could not send verification email');
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'py-3' : 'py-5'}`}
      data-testid="site-nav"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div
          className={`flex items-center justify-between rounded-full px-4 sm:px-6 py-2.5 backdrop-blur-xl transition-all duration-300 ${
            scrolled
              ? 'bg-[#FAF5F8]/85 shadow-[0_20px_40px_rgba(138,115,130,0.15)]'
              : 'bg-[#FAF5F8]/60'
          }`}
          style={{
            boxShadow: scrolled
              ? '0 20px 40px rgba(138,115,130,0.15), inset 0 -2px 4px rgba(138,115,130,0.08), inset 0 2px 4px rgba(255,255,255,0.85)'
              : undefined,
          }}
        >
          <button onClick={() => scrollTo('hero')} className="flex items-center gap-2 group" data-testid="nav-logo-btn">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(180deg, #EBA8C5 0%, #8B2956 100%)',
                boxShadow:
                  '0 8px 16px rgba(139,41,86,0.35), inset 0 -3px 6px rgba(60,10,30,0.35), inset 0 3px 6px rgba(255,255,255,0.5)',
              }}
            >
              <span className="font-serif-display text-white text-xl font-bold">P</span>
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <div className="font-serif-display text-[#8B2956] text-lg font-semibold">{site.name}</div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-[#2E2825]/60">{site.tagline}</div>
            </div>
          </button>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <button
                key={l.id}
                onClick={() => scrollTo(l.id)}
                className="px-4 py-2 text-sm font-medium text-[#2E2825]/75 hover:text-[#8B2956] rounded-full hover:bg-white/70 transition-colors"
                data-testid={`nav-link-${l.id}`}
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="clay-btn-ghost h-11 px-3 flex items-center gap-2"
                  data-testid="nav-user-btn"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: 'linear-gradient(180deg,#EBA8C5,#8B2956)' }}
                  >
                    {(user.name || user.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-[#2E2825] max-w-[100px] truncate">
                    {user.name || user.email || 'Guest'}
                  </span>
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute right-0 mt-2 clay-card p-2 w-48 z-50"
                      data-testid="nav-user-menu"
                    >
                      <div className="px-3 py-2 text-xs text-[#2E2825]/60 truncate">{user.email}</div>
                      <button
                        onClick={handleVerifyEmail}
                        disabled={verifying}
                        className="w-full text-left px-3 py-2 rounded-2xl text-sm flex items-center gap-2 disabled:opacity-60"
                        style={{ color: user.email_verified ? '#9B8BB4' : '#8B2956' }}
                        data-testid="nav-verify-email-btn"
                      >
                        {verifying ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <MailCheck className="w-4 h-4" />
                        )}
                        {user.email_verified ? 'Email verified' : 'Verify your email'}
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); navigate('/account'); }}
                        className="w-full text-left px-3 py-2 rounded-2xl text-sm text-[#2E2825] hover:bg-[#F5EBF0] flex items-center gap-2"
                        data-testid="nav-dashboard-btn"
                      >
                        <LayoutDashboard className="w-4 h-4" /> My Account
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => { setMenuOpen(false); navigate('/admin'); }}
                          className="w-full text-left px-3 py-2 rounded-2xl text-sm text-[#8B2956] hover:bg-[#F5EBF0] flex items-center gap-2"
                          data-testid="nav-admin-btn"
                        >
                          <Shield className="w-4 h-4" /> Admin Dashboard
                        </button>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 rounded-2xl text-sm text-[#2E2825] hover:bg-[#F5EBF0] flex items-center gap-2"
                        data-testid="nav-logout-btn"
                      >
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="clay-btn-ghost h-11 px-4 flex items-center gap-2 text-sm"
                data-testid="nav-login-btn"
              >
                <User className="w-4 h-4" /> <span className="hidden sm:block">Sign in</span>
              </button>
            )}
            <motion.button
              key={bounce}
              onClick={() => setIsOpen(true)}
              className="relative clay-btn-ghost h-11 w-11 flex items-center justify-center"
              data-testid="open-cart-btn"
              aria-label="Open cart"
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.3 }}
            >
              <ShoppingBag className="w-5 h-5 text-[#2E2825]" />
              {count > 0 && (
                <span
                  data-testid="cart-count-badge"
                  className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 rounded-full text-white text-[11px] font-bold flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(180deg, #D9AAB0 0%, #8B2956 100%)',
                    boxShadow:
                      '0 4px 8px rgba(139,41,86,0.4), inset 0 -2px 4px rgba(60,10,30,0.3), inset 0 2px 4px rgba(255,255,255,0.4)',
                  }}
                >
                  {count}
                </span>
              )}
            </motion.button>
            <button
              className="lg:hidden clay-btn-ghost h-11 w-11 flex items-center justify-center"
              onClick={() => setMobileOpen((v) => !v)}
              data-testid="mobile-menu-btn"
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
              data-testid="mobile-menu"
            >
              {NAV_LINKS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => scrollTo(l.id)}
                  className="text-left px-4 py-3 rounded-2xl text-[#2E2825] font-medium hover:bg-[#F5EBF0]"
                  data-testid={`mobile-nav-link-${l.id}`}
                >
                  {l.label}
                </button>
              ))}
              <div className="border-t border-[#EADFE5] mt-2 pt-2">
                {user ? (
                  <>
                    <button
                      onClick={() => { setMobileOpen(false); navigate('/account'); }}
                      className="w-full text-left px-4 py-3 rounded-2xl text-[#2E2825] font-medium hover:bg-[#F5EBF0] flex items-center gap-2"
                      data-testid="mobile-dashboard-btn"
                    >
                      <LayoutDashboard className="w-4 h-4" /> My Account
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => { setMobileOpen(false); navigate('/admin'); }}
                        className="w-full text-left px-4 py-3 rounded-2xl text-[#8B2956] font-medium hover:bg-[#F5EBF0] flex items-center gap-2"
                        data-testid="mobile-admin-btn"
                      >
                        <Shield className="w-4 h-4" /> Admin Dashboard
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 rounded-2xl text-[#2E2825] font-medium hover:bg-[#F5EBF0] flex items-center gap-2"
                      data-testid="mobile-logout-btn"
                    >
                      <LogOut className="w-4 h-4" /> Sign out ({user.name})
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setMobileOpen(false); navigate('/login'); }}
                    className="w-full text-left px-4 py-3 rounded-2xl text-[#2E2825] font-medium hover:bg-[#F5EBF0] flex items-center gap-2"
                    data-testid="mobile-login-btn"
                  >
                    <User className="w-4 h-4" /> Sign in
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
