/**
 * orderAPI.gs - Order Management
 */

/**
 * Create a new order
 * Validates all items and calculates price server-side
 */
function createOrder(body) {
  const { userId, customerName, items, note } = body;

  // Validation
  if (!userId) throw new Error('userId is required');
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('items array is required and cannot be empty');
  }

  // Server-side price calculation (prevents price tampering)
  let totalPrice = 0;
  const validatedItems = [];

  for (const item of items) {
    const menuItem = getMenuItemById(item.menuId);
    if (!menuItem) throw new Error('Invalid menu item: ' + item.menuId);
    if (menuItem.status === 'inactive') throw new Error('Menu item unavailable: ' + menuItem.name);
    if (!item.qty || item.qty < 1) throw new Error('Invalid qty for: ' + menuItem.name);

    const qty = parseInt(item.qty);
    const price = Number(menuItem.price);
    totalPrice += price * qty;
    validatedItems.push({
      menuId: String(menuItem.id),
      menuName: menuItem.name,
      price,
      quantity: qty,
    });
  }

  // Generate order ID
  const orderId = generateOrderId();
  const now = new Date();

  // Save to Orders sheet
  const ordersSheet = getSheet('Orders');
  ordersSheet.appendRow([
    orderId,
    userId,
    customerName || 'Guest',
    totalPrice,
    'pending',        // status
    'unpaid',         // payment_status
    now.toISOString(),
    note || '',
  ]);

  // Save to OrderItems sheet
  const itemsSheet = getSheet('OrderItems');
  for (const item of validatedItems) {
    itemsSheet.appendRow([
      orderId,
      item.menuId,
      item.menuName,
      item.price,
      item.quantity,
    ]);
  }

  // Upsert customer record
  upsertCustomer(userId, customerName, now);

  // Store last order ID for status tracking
  logInfo('createOrder', `Order ${orderId} created for user ${userId}`);

  return { success: true, orderId, totalPrice };
}

/**
 * Get order by ID
 */
function getOrder(orderId) {
  if (!orderId) throw new Error('orderId is required');

  const ordersSheet = getSheet('Orders');
  const rows = ordersSheet.getDataRange().getValues();
  const headers = rows[0];

  let order = null;
  for (let i = 1; i < rows.length; i++) {
    const row = rowToObj(headers, rows[i]);
    if (String(row.order_id) === String(orderId)) {
      order = {
        orderId: String(row.order_id),
        userId: row.user_id,
        customerName: row.customer_name,
        totalPrice: Number(row.total_price),
        status: row.status,
        paymentStatus: row.payment_status,
        createdAt: row.created_at,
        note: row.note || '',
      };
      break;
    }
  }

  if (!order) throw new Error('Order not found: ' + orderId);

  // Get items
  const itemsSheet = getSheet('OrderItems');
  const itemRows = itemsSheet.getDataRange().getValues();
  const itemHeaders = itemRows[0];
  order.items = [];

  for (let i = 1; i < itemRows.length; i++) {
    const item = rowToObj(itemHeaders, itemRows[i]);
    if (String(item.order_id) === String(orderId)) {
      order.items.push({
        menuId: item.menu_id,
        menuName: item.menu_name,
        price: Number(item.price),
        quantity: Number(item.quantity),
      });
    }
  }

  return { success: true, order };
}

/**
 * Get all orders for admin
 */
function getOrdersAdmin(adminKey, date) {
  requireAdmin(adminKey);

  const ordersSheet = getSheet('Orders');
  const rows = ordersSheet.getDataRange().getValues();
  const headers = rows[0];

  let orders = [];
  const filterDate = date || getTodayString();

  for (let i = 1; i < rows.length; i++) {
    const row = rowToObj(headers, rows[i]);
    const orderDate = row.created_at
      ? new Date(row.created_at).toISOString().slice(0, 10)
      : '';

    if (!date || orderDate === filterDate) {
      orders.push({
        orderId: String(row.order_id),
        userId: row.user_id,
        customerName: row.customer_name,
        totalPrice: Number(row.total_price),
        status: row.status,
        paymentStatus: row.payment_status,
        createdAt: row.created_at,
        note: row.note || '',
      });
    }
  }

  // Sort newest first
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Attach items
  const itemsSheet = getSheet('OrderItems');
  const itemRows = itemsSheet.getDataRange().getValues();
  const itemHeaders = itemRows[0];
  const itemsMap = {};

  for (let i = 1; i < itemRows.length; i++) {
    const item = rowToObj(itemHeaders, itemRows[i]);
    const oid = String(item.order_id);
    if (!itemsMap[oid]) itemsMap[oid] = [];
    itemsMap[oid].push({
      menuName: item.menu_name,
      price: Number(item.price),
      quantity: Number(item.quantity),
    });
  }

  orders = orders.map(o => ({ ...o, items: itemsMap[o.orderId] || [] }));

  // Calculate stats
  const totalRevenue = orders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  return {
    success: true,
    orders,
    stats: {
      totalOrders: orders.length,
      totalRevenue,
      date: filterDate,
    }
  };
}

/**
 * Update order status (Admin)
 */
function updateOrderStatusAdmin(adminKey, orderId, status) {
  requireAdmin(adminKey);

  const validStatuses = ['pending', 'paid', 'cooking', 'done'];
  if (!validStatuses.includes(status)) {
    throw new Error('Invalid status: ' + status);
  }

  const sheet = getSheet('Orders');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const orderIdIdx = headers.indexOf('order_id');
  const statusIdx = headers.indexOf('status');

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][orderIdIdx]) === String(orderId)) {
      sheet.getRange(i + 1, statusIdx + 1).setValue(status);

      // Notify customer if done
      if (status === 'done') {
        const order = rowToObj(headers, rows[i]);
        notifyCustomerDone(order.user_id, orderId);
      }

      logInfo('updateOrderStatus', `Order ${orderId} -> ${status}`);
      return { success: true, orderId, status };
    }
  }

  throw new Error('Order not found: ' + orderId);
}

/**
 * Get sales report
 */
function getSalesReport(adminKey) {
  requireAdmin(adminKey);
  const result = getOrdersAdmin(adminKey, getTodayString());
  return {
    success: true,
    date: result.stats.date,
    totalOrders: result.stats.totalOrders,
    totalRevenue: result.stats.totalRevenue,
    paidOrders: result.orders.filter(o => o.paymentStatus === 'paid').length,
    pendingOrders: result.orders.filter(o => o.status === 'pending').length,
    cookingOrders: result.orders.filter(o => o.status === 'cooking').length,
    doneOrders: result.orders.filter(o => o.status === 'done').length,
  };
}

// ===== HELPERS =====
function upsertCustomer(userId, displayName, time) {
  const sheet = getSheet('Customers');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const userIdIdx = headers.indexOf('user_id');

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][userIdIdx] === userId) {
      // Update
      const nameIdx = headers.indexOf('display_name');
      const timeIdx = headers.indexOf('last_order_time');
      if (nameIdx >= 0) sheet.getRange(i + 1, nameIdx + 1).setValue(displayName);
      if (timeIdx >= 0) sheet.getRange(i + 1, timeIdx + 1).setValue(time.toISOString());
      return;
    }
  }

  // Insert new
  sheet.appendRow([userId, displayName || '', time.toISOString()]);
}

function getTodayString() {
  const now = new Date();
  return Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}
