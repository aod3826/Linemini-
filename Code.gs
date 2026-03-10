/**
 * Code.gs - Main Entry Point for Restaurant Backend
 * Google Apps Script Web App
 *
 * Deploy as: Execute as Me, Anyone can access
 */

// ===== CONFIGURATION =====
const CONFIG = {
  SHEET_ID: '1WcHuHSn7yYHx8gvgYp7lJ2sSCKeF8yfyJ98zWCL-2iw',        // Replace with your Sheet ID
  ADMIN_KEY: 'aod',       // Match with frontend APP_CONFIG.ADMIN_KEY
  LINE_CHANNEL_ACCESS_TOKEN: 'QURA7S8NmooH+K4Jqdn9kl7PaVQoJHaYni2MDKFLxwXPq5iGZfp9s1ejyy/Os7VlzFlfG2FwEgtVhF7hSl74nVLbkVp49aIG3uPYdDGvJlHyaWLDtoHo4l77r7iSbNO5xy95/0oykmA29B/VWQ4gYwdB04t89/1O/w1cDnyilFU=',
  LINE_OWNER_USER_ID: 'YOUR_LINE_USER_ID',  // Your LINE User ID (for notifications)
  LINE_PAY_CHANNEL_ID: 'YOUR_LINE_PAY_CHANNEL_ID',
  LINE_PAY_CHANNEL_SECRET: 'YOUR_LINE_PAY_CHANNEL_SECRET',
  LINE_PAY_ENV: 'sandbox',                  // 'sandbox' or 'production'
  FRONTEND_URL: 'https://YOUR_FRONTEND_URL', // e.g. GitHub Pages URL
};

// ===== CORS HEADERS =====
function setCorsHeaders(output) {
  return output
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ===== MAIN ROUTER =====
function doGet(e) {
  const params = e.parameter;
  const action = params.action;

  try {
    let result;

    switch (action) {
      case 'getMenu':
        result = getMenu();
        break;
      case 'getOrder':
        result = getOrder(params.orderId);
        break;
      case 'createPayment':
        result = createPayment(params.orderId);
        break;
      case 'getOrders':
        result = getOrdersAdmin(params.adminKey, params.date);
        break;
      case 'updateOrderStatus':
        // For kitchen display - GET request
        result = updateOrderStatusAdmin(params.adminKey, params.orderId, params.status);
        break;
      case 'getSalesReport':
        result = getSalesReport(params.adminKey);
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }

    return setCorsHeaders(
      ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON)
    );

  } catch (err) {
    logError('doGet', err, params);
    return setCorsHeaders(
      ContentService.createTextOutput(JSON.stringify({ error: err.message }))
        .setMimeType(ContentService.MimeType.JSON)
    );
  }
}

function doPost(e) {
  const params = e.parameter;
  const action = params.action;
  let body = {};

  try {
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
  } catch (err) {
    return setCorsHeaders(
      ContentService.createTextOutput(JSON.stringify({ error: 'Invalid JSON body' }))
        .setMimeType(ContentService.MimeType.JSON)
    );
  }

  try {
    let result;

    switch (action) {
      case 'createOrder':
        result = createOrder(body);
        break;
      case 'updatePaymentStatus':
        result = updatePaymentStatus(body.orderId, body.transactionId);
        break;
      case 'updateOrderStatus':
        result = updateOrderStatusAdmin(params.adminKey, body.orderId, body.status);
        break;
      case 'updateMenuStatus':
        result = updateMenuStatusAdmin(params.adminKey, body.menuId, body.status);
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }

    return setCorsHeaders(
      ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON)
    );

  } catch (err) {
    logError('doPost', err, { action, body });
    return setCorsHeaders(
      ContentService.createTextOutput(JSON.stringify({ error: err.message }))
        .setMimeType(ContentService.MimeType.JSON)
    );
  }
}

// Handle preflight OPTIONS
function doOptions(e) {
  return setCorsHeaders(
    ContentService.createTextOutput('')
      .setMimeType(ContentService.MimeType.TEXT)
  );
}

// ===== ADMIN AUTH =====
function requireAdmin(adminKey) {
  if (adminKey !== CONFIG.ADMIN_KEY) {
    throw new Error('Unauthorized: Invalid admin key');
  }
}
