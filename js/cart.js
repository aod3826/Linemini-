/**
 * cart.js - Shopping Cart Management
 * Handles cart state, persistence, and calculations
 */

const Cart = (() => {
  const STORAGE_KEY = 'restaurant_cart';
  let items = []; // [{ menuId, name, price, imageUrl, qty }]
  let listeners = [];

  // ===== PERSISTENCE =====
  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      items = saved ? JSON.parse(saved) : [];
    } catch { items = []; }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    listeners.forEach(fn => fn(items));
  }

  // ===== MUTATIONS =====
  function addItem(menuItem) {
    const existing = items.find(i => i.menuId === menuItem.id);
    if (existing) {
      existing.qty += 1;
    } else {
      items.push({
        menuId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        imageUrl: menuItem.image_url || '',
        qty: 1
      });
    }
    save();
  }

  function removeItem(menuId) {
    const idx = items.findIndex(i => i.menuId === menuId);
    if (idx === -1) return;
    if (items[idx].qty > 1) {
      items[idx].qty -= 1;
    } else {
      items.splice(idx, 1);
    }
    save();
  }

  function deleteItem(menuId) {
    items = items.filter(i => i.menuId !== menuId);
    save();
  }

  function clear() {
    items = [];
    save();
  }

  // ===== GETTERS =====
  function getItems() { return [...items]; }

  function getItemQty(menuId) {
    const item = items.find(i => i.menuId === menuId);
    return item ? item.qty : 0;
  }

  function getTotal() {
    return items.reduce((sum, i) => sum + (i.price * i.qty), 0);
  }

  function getCount() {
    return items.reduce((sum, i) => sum + i.qty, 0);
  }

  function isEmpty() { return items.length === 0; }

  // Serialize for API submission
  function toOrderPayload(userId, customerName) {
    return {
      userId,
      customerName,
      items: items.map(i => ({
        menuId: i.menuId,
        qty: i.qty
      }))
    };
  }

  // ===== EVENTS =====
  function onChange(fn) {
    listeners.push(fn);
    return () => { listeners = listeners.filter(l => l !== fn); };
  }

  // Initialize
  load();

  return {
    addItem, removeItem, deleteItem, clear,
    getItems, getItemQty, getTotal, getCount, isEmpty,
    toOrderPayload, onChange
  };
})();
