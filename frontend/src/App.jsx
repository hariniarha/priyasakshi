import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import HomePage from '@/pages/HomePage.jsx';
import AuthPage from '@/pages/AuthPage.jsx';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from '@/pages/ResetPasswordPage.jsx';
import VerifyEmailPage from '@/pages/VerifyEmailPage.jsx';
import SuccessPage from '@/pages/SuccessPage.jsx';
import CancelPage from '@/pages/CancelPage.jsx';
import DashboardPage from '@/pages/DashboardPage.jsx';
import MyOrdersPage from '@/pages/MyOrdersPage.jsx';
import OrderDetailsPage from '@/pages/OrderDetailsPage.jsx';
import ProfilePage from '@/pages/ProfilePage.jsx';
import AddressesPage from '@/pages/AddressesPage.jsx';
import { CartProvider } from '@/context/CartContext.jsx';
import { AuthProvider } from '@/context/AuthContext.jsx';
import './App.css';

export default function App() {
  return (
    <div className="App">
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/cancel" element={<CancelPage />} />
            <Route path="/account" element={<DashboardPage />} />
            <Route path="/account/orders" element={<MyOrdersPage />} />
            <Route path="/account/orders/:orderId" element={<OrderDetailsPage />} />
            <Route path="/account/profile" element={<ProfilePage />} />
            <Route path="/account/addresses" element={<AddressesPage />} />
          </Routes>
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: '#FFFFFF',
                color: '#2E2825',
                border: '1px solid rgba(138,115,104,0.15)',
                borderRadius: '20px',
                fontFamily: 'Outfit, sans-serif',
                boxShadow:
                  '0 20px 40px rgba(138,115,104,0.15), inset 0 -3px 6px rgba(138,115,104,0.08), inset 0 3px 6px rgba(255,255,255,0.9)',
              },
            }}
          />
        </CartProvider>
      </AuthProvider>
    </div>
  );
}
