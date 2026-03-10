/**
 * api.js - Frontend API Client for Restaurant LINE Mini App
 * Handles all communication with Google Apps Script backend
 */

const API = (() => {

  // ===== CONFIGURATION =====
  const CONFIG = {
    // Replace with your deployed Google Apps Script Web App URL
    BASE_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
    CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  };

  // ===== CACHE =====
  const cache = {
    get(key) {
      try {
        const item = JSON.parse(localStorage.getItem(`rapi_${key}`));
        if (!item) return null;
        if (Date.now() > item.expiry) {
          localStorage.removeItem(`rapi_${key}`);
          return null;
        }
        return item.data;
      } catch { return null; }
    },
    set(key, data, ttl = CONFIG.CACHE_TTL) {
      try {
        localStorage.setItem(`rapi_${key}`, JSON.stringify({
          data, expiry: Date.now() + ttl
        }));
      } catch { /* ignore storage errors */ }
    },
    clear(key) {
      localStorage.removeItem(`rapi_${key}`);
    }
  };

  // ===== CORE REQUEST =====
  async function request(params, options = {}) {
    const url = new URL(CONFIG.BASE_URL);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const fetchOptions = {
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
    };

    if (options.body) {
      fetchOptions.method = 'POST';
      // GAS requires params in URL for POST too
      fetchOptions.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url.toString(), fetchOptions);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  }

  // ===== PUBLIC API METHODS =====

  /**
   * Get all active menu items
   * Uses cache to reduce API calls
   */
  async function getMenu(forceRefresh = false) {
    const cacheKey = 'menu';
    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached) return cached;
    }
    const data = await request({ action: 'getMenu' });
    cache.set(cacheKey, data);
    return data;
  }

  /**
   * Create a new order
   * @param {Object} orderData - { userId, customerName, items: [{menuId, qty}] }
   */
  async function createOrder(orderData) {
    const data = await request(
      { action: 'createOrder' },
      { body: orderData }
    );
    cache.clear('menu'); // invalidate menu cache
    return data;
  }

  /**
   * Get order by ID
   * @param {string} orderId
   */
  async function getOrder(orderId) {
    return request({ action: 'getOrder', orderId });
  }

  /**
   * Create LINE Pay payment request
   * @param {string} orderId
   */
  async function createPayment(orderId) {
    return request({ action: 'createPayment', orderId });
  }

  /**
   * Update payment status (called by webhook or manually)
   * @param {string} orderId
   * @param {string} transactionId
   */
  async function updatePaymentStatus(orderId, transactionId) {
    return request(
      { action: 'updatePaymentStatus' },
      { body: { orderId, transactionId } }
    );
  }

  // ===== ADMIN API METHODS =====

  /**
   * Get all orders for admin
   * @param {string} adminKey - Admin authentication key
   * @param {string} date - Optional date filter (YYYY-MM-DD)
   */
  async function getOrders(adminKey, date = '') {
    return request({ action: 'getOrders', adminKey, date });
  }

  /**
   * Update order status
   * @param {string} adminKey
   * @param {string} orderId
   * @param {string} status - pending | paid | cooking | done
   */
  async function updateOrderStatus(adminKey, orderId, status) {
    return request(
      { action: 'updateOrderStatus', adminKey },
      { body: { orderId, status } }
    );
  }

  /**
   * Update menu item status
   * @param {string} adminKey
   * @param {string} menuId
   * @param {string} status - active | inactive
   */
  async function updateMenuStatus(adminKey, menuId, status) {
    cache.clear('menu');
    return request(
      { action: 'updateMenuStatus', adminKey },
      { body: { menuId, status } }
    );
  }

  /**
   * Get sales report for today
   * @param {string} adminKey
   */
  async function getSalesReport(adminKey) {
    return request({ action: 'getSalesReport', adminKey });
  }

  return {
    getMenu,
    createOrder,
    getOrder,
    createPayment,
    updatePaymentStatus,
    getOrders,
    updateOrderStatus,
    updateMenuStatus,
    getSalesReport,
    setBaseUrl(url) { CONFIG.BASE_URL = url; }
  };
})();
