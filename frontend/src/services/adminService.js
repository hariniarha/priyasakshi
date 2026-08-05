/**
 * Admin service — talks to /api/admin/* endpoints.
 * All calls rely on the authenticated HTTP-only cookie; the backend enforces
 * admin access (403 for non-admins).
 */
import { apiClient, getErrorMessage } from '@/lib/apiClient';

export const getAdminDashboard = async () => {
  try {
    const { data } = await apiClient.get('/admin/dashboard');
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not load dashboard') };
  }
};

export const getAdminOrders = async ({ search, status, paymentStatus, limit = 100, skip = 0 } = {}) => {
  try {
    const params = { limit, skip };
    if (search) params.search = search;
    if (status && status !== 'all') params.status = status;
    if (paymentStatus && paymentStatus !== 'all') params.payment_status = paymentStatus;
    const { data } = await apiClient.get('/admin/orders', { params });
    return { ok: true, data: data.orders || [] };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not load orders'), data: [] };
  }
};

export const getAdminOrder = async (orderId) => {
  try {
    const { data } = await apiClient.get(`/admin/orders/${orderId}`);
    return { ok: true, data: data.order };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not load order') };
  }
};

export const updateAdminOrder = async (orderId, payload) => {
  try {
    const { data } = await apiClient.patch(`/admin/orders/${orderId}`, payload);
    return { ok: true, data: data.order };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not update order') };
  }
};

export const getAdminCustomers = async (search) => {
  try {
    const params = {};
    if (search) params.search = search;
    const { data } = await apiClient.get('/admin/customers', { params });
    return { ok: true, data: data.customers || [] };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not load customers'), data: [] };
  }
};

export const getAdminMessages = async (search) => {
  try {
    const params = {};
    if (search) params.search = search;
    const { data } = await apiClient.get('/admin/messages', { params });
    return { ok: true, data: data.messages || [] };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not load messages'), data: [] };
  }
};

export const markMessageRead = async (messageId, read = true) => {
  try {
    const { data } = await apiClient.patch(`/admin/messages/${messageId}`, { read });
    return { ok: true, data: data.message };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not update message') };
  }
};

export const deleteMessage = async (messageId) => {
  try {
    await apiClient.delete(`/admin/messages/${messageId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not delete message') };
  }
};
