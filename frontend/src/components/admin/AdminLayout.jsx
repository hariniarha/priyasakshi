import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AdminNav from '@/components/admin/AdminNav';
import { ClayShapes } from '@/components/ClayShapes';

/**
 * AdminLayout — guards the entire /admin/* route tree.
 *
 * - Not logged in → redirect to /login (remembering where they were headed).
 * - Logged in but not an admin → 403 page.
 * - Admin → render the shared admin shell + nested route.
 */
export default function AdminLayout() {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF5F8] flex items-center justify-center">
        <div className="font-serif-display text-2xl text-[#8B2956]">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FAF5F8] relative overflow-hidden flex items-center justify-center px-4 py-20">
        <ClayShapes variant="hero" />
        <div className="clay-card p-10 sm:p-14 max-w-lg w-full text-center relative z-10">
          <h1 className="font-serif-display text-4xl text-[#8B2956]">Access denied</h1>
          <p className="mt-4 text-[#2E2825]/70">
            You need an admin account to view this page.
          </p>
          <a
            href="/"
            className="mt-8 inline-block clay-btn-primary px-6 py-3.5"
          >
            Back to shop
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF5F8]">
      <AdminNav />
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-28 md:py-32">
        <Outlet />
      </main>
    </div>
  );
}
