/**
 * menuAPI.gs - Menu Management
 */

/**
 * Get all active menu items
 */
function getMenu() {
  const sheet = getSheet('Menu');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];

  const items = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const item = rowToObj(headers, row);

    // Only return active items
    if (item.status === 'active' || item.status === '') {
      items.push({
        id: String(item.id),
        name: item.name,
        description: item.description || '',
        price: Number(item.price),
        image_url: item.image_url || '',
        category: item.category || 'ทั่วไป',
        status: item.status || 'active',
      });
    }
  }

  return { success: true, items };
}

/**
 * Update menu item status (Admin)
 */
function updateMenuStatusAdmin(adminKey, menuId, status) {
  requireAdmin(adminKey);

  if (!['active', 'inactive'].includes(status)) {
    throw new Error('Invalid status. Must be active or inactive');
  }

  const sheet = getSheet('Menu');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idColIdx = headers.indexOf('id');
  const statusColIdx = headers.indexOf('status');

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idColIdx]) === String(menuId)) {
      sheet.getRange(i + 1, statusColIdx + 1).setValue(status);
      return { success: true, menuId, status };
    }
  }

  throw new Error('Menu item not found: ' + menuId);
}

/**
 * Get menu item by ID (internal use)
 */
function getMenuItemById(menuId) {
  const sheet = getSheet('Menu');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idColIdx = headers.indexOf('id');

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idColIdx]) === String(menuId)) {
      return rowToObj(headers, rows[i]);
    }
  }
  return null;
}
