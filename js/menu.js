/**
 * menu.js - Menu Page Logic
 * Handles menu rendering, categories, and cart interactions
 */

const MenuPage = (() => {
  let allItems = [];
  let currentCategory = 'all';

  // ===== RENDER =====
  function renderSkeletons(count = 6) {
    return Array(count).fill(0).map(() => `
      <div class="skeleton-card">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text short"></div>
        <div class="skeleton skeleton-price"></div>
      </div>
    `).join('');
  }

  function renderMenuCard(item) {
    const qty = Cart.getItemQty(item.id);
    const hasImage = item.image_url && item.image_url.length > 0;

    return `
      <div class="menu-card" data-id="${item.id}">
        <div class="menu-card-img-wrap">
          ${hasImage
            ? `<img src="${item.image_url}" alt="${item.name}" loading="lazy" onerror="handleImgError(this)">`
            : ''
          }
          <div class="menu-card-img-placeholder" style="${hasImage ? 'display:none' : ''}">🍽️</div>
        </div>
        <div class="menu-card-body">
          <div class="menu-card-name">${item.name}</div>
          ${item.description ? `<div class="menu-card-desc">${item.description}</div>` : ''}
          <div class="menu-card-footer">
            <div class="menu-card-price">${formatPrice(item.price)}</div>
            <div class="cart-control">
              <button class="btn-add-cart ${qty > 0 ? 'hidden' : ''}"
                onclick="MenuPage.addToCart('${item.id}')">+</button>
              <div class="item-counter ${qty > 0 ? 'show' : ''}">
                <button class="counter-btn counter-minus"
                  onclick="MenuPage.decrease('${item.id}')">−</button>
                <span class="counter-qty" id="qty-${item.id}">${qty}</span>
                <button class="counter-btn counter-plus"
                  onclick="MenuPage.addToCart('${item.id}')">+</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderCategories(items) {
    const categories = ['ทั้งหมด', ...new Set(items.map(i => i.category).filter(Boolean))];
    const container = document.getElementById('category-tabs');
    if (!container) return;

    container.innerHTML = categories.map((cat, idx) => {
      const key = idx === 0 ? 'all' : cat;
      return `
        <button class="tab-btn ${currentCategory === key ? 'active' : ''}"
          onclick="MenuPage.filterCategory('${key}', this)">
          ${cat}
        </button>
      `;
    }).join('');
  }

  function renderMenuGrid(items) {
    const container = document.getElementById('menu-grid');
    if (!container) return;

    const filtered = currentCategory === 'all'
      ? items
      : items.filter(i => i.category === currentCategory);

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:40px; color: var(--color-gray-500);">
          ไม่มีเมนูในหมวดนี้
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(renderMenuCard).join('');
  }

  // ===== ACTIONS =====
  function addToCart(menuId) {
    const item = allItems.find(i => i.id === menuId);
    if (!item) return;

    Cart.addItem(item);
    updateCardUI(menuId);
    Toast.success(`เพิ่ม ${item.name} แล้ว 🎉`);
    updateOrderBar();
  }

  function decrease(menuId) {
    Cart.removeItem(menuId);
    updateCardUI(menuId);
    updateOrderBar();
  }

  function updateCardUI(menuId) {
    const qty = Cart.getItemQty(menuId);
    const card = document.querySelector(`.menu-card[data-id="${menuId}"]`);
    if (!card) return;

    const addBtn = card.querySelector('.btn-add-cart');
    const counter = card.querySelector('.item-counter');
    const qtyEl = card.querySelector('.counter-qty');

    if (qty === 0) {
      addBtn?.classList.remove('hidden');
      counter?.classList.remove('show');
    } else {
      addBtn?.classList.add('hidden');
      counter?.classList.add('show');
      if (qtyEl) qtyEl.textContent = qty;
    }
  }

  function updateOrderBar() {
    const bar = document.getElementById('order-bar');
    if (!bar) return;

    const count = Cart.getCount();
    const total = Cart.getTotal();

    if (count === 0) {
      bar.classList.remove('show');
      return;
    }

    bar.classList.add('show');
    const countEl = bar.querySelector('.bar-count');
    const totalEl = bar.querySelector('.bar-total');
    if (countEl) countEl.textContent = `${count} รายการ`;
    if (totalEl) totalEl.textContent = formatPrice(total);
  }

  function filterCategory(key, btn) {
    currentCategory = key;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderMenuGrid(allItems);
  }

  // ===== INITIALIZE =====
  async function init() {
    const grid = document.getElementById('menu-grid');
    if (!grid) return;

    // Show skeletons
    grid.innerHTML = renderSkeletons();

    try {
      const result = await API.getMenu();
      allItems = result.items || [];

      renderCategories(allItems);
      renderMenuGrid(allItems);
      updateOrderBar();

      // Re-listen to cart changes
      Cart.onChange(() => {
        allItems.forEach(item => updateCardUI(item.id));
        updateOrderBar();
      });

    } catch (err) {
      grid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:40px;">
          <div style="font-size:48px; margin-bottom:12px;">😓</div>
          <div style="font-weight:700; margin-bottom:8px;">โหลดเมนูไม่สำเร็จ</div>
          <div style="color:var(--color-gray-500); font-size:14px;">กรุณาลองใหม่อีกครั้ง</div>
          <button class="btn btn-primary mt-16" style="max-width:180px"
            onclick="MenuPage.init()">ลองใหม่</button>
        </div>
      `;
    }
  }

  return { init, addToCart, decrease, filterCategory };
})();

document.addEventListener('DOMContentLoaded', MenuPage.init);
