/**
 * Admin service — talks to the backend /api/admin/* endpoints.
 *
 * All calls require an authenticated admin session (HTTP-only cookie). The
 * backend enforces the admin role; this service just surfaces the responses.
 */
import { apiClient, getErrorMessage } from '@/lib/apiClient';

export const getDashboard = async () => {
  try {
    const { data } = await apiClient.get('/admin/dashboard');
    return { ok: true, data: data.data };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not load dashboard'), data: null };
  }
};

export const getAdminOrders = async ({ search, status, paymentStatus } = {}) => {
  try {
    const params = {};
    if (search) params.search = search;
    if (status) params.status = status;
    if (paymentStatus) params.payment_status = paymentStatus;
    const { data } = await apiClient.get('/admin/orders', { params });
    return { ok: true, orders: data.orders || [] };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not load orders'), orders: [] };
  }
};

export const getAdminOrder = async (orderId) => {
  try {
    const { data } = await apiClient.get(`/admin/orders/${orderId}`);
    return { ok: true, order: data.order };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not load order'), order: null };
  }
};

export const updateAdminOrder = async (orderId, payload) => {
  try {
    const { data } = await apiClient.patch(`/admin/orders/${orderId}`, payload);
    return { ok: true, order: data.order };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not update order') };
  }
};

export const getCustomers = async () => {
  try {
    const { data } = await apiClient.get('/admin/customers');
    return { ok: true, customers: data.customers || [] };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not load customers'), customers: [] };
  }
};

export const getMessages = async (search) => {
  try {
    const params = {};
    if (search) params.search = search;
    const { data } = await apiClient.get('/admin/messages', { params });
    return { ok: true, messages: data.messages || [] };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not load messages'), messages: [] };
  }
};

export const markMessageRead = async (messageId) => {
  try {
    const { data } = await apiClient.patch(`/admin/messages/${messageId}/read`);
    return { ok: true, message: data.message };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not mark message') };
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
