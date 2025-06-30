// Google Apps Script Backend for Energy Palace POS
// This code should be deployed as a Google Apps Script Web App

// Configuration - Update these with your actual sheet details
const CONFIG = {
  // Main spreadsheet ID (extract from your Google Sheets URL)
  SPREADSHEET_ID: 'your-spreadsheet-id-here',
  
  // Sheet names for different data types
  SHEETS: {
    PRODUCTS: 'Products',
    ORDERS: 'Orders', 
    CHARGING: 'Charging',
    EXPENSES: 'Expenses',
    DEPOSITS: 'Deposits',
    INSIGHTS: 'BepInsight',
    USERS: 'Users'
  },
  
  // User credentials (in production, use proper authentication)
  USERS: {
    'admin': { password: 'admin123', name: 'Administrator' },
    'manager': { password: 'manager123', name: 'Manager' },
    'staff': { password: 'staff123', name: 'Staff Member' }
  }
};

/**
 * Main function to handle all requests
 */
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    switch (action) {
      case 'login':
        return handleLogin(e.parameter);
      case 'getProducts':
        return handleGetProducts();
      case 'getBepInsight':
        return handleGetInsights();
      default:
        return createResponse({ error: 'Invalid action' }, 400);
    }
  } catch (error) {
    console.error('Error in doGet:', error);
    return createResponse({ error: error.toString() }, 500);
  }
}

/**
 * Handle POST requests
 */
function doPost(e) {
  const action = e.parameter.action;
  
  try {
    switch (action) {
      case 'submitOrder':
        return handleSubmitOrder(e.parameter);
      case 'submitCharging':
        return handleSubmitCharging(e.parameter);
      case 'submitExpense':
        return handleSubmitExpense(e.parameter);
      case 'submitDeposit':
        return handleSubmitDeposit(e.parameter);
      default:
        return createResponse({ error: 'Invalid action' }, 400);
    }
  } catch (error) {
    console.error('Error in doPost:', error);
    return createResponse({ error: error.toString() }, 500);
  }
}

/**
 * Handle user login
 */
function handleLogin(params) {
  const { username, password } = params;
  
  if (!username || !password) {
    return createResponse({ success: false, message: 'Username and password required' });
  }
  
  const user = CONFIG.USERS[username];
  if (user && user.password === password) {
    return createResponse({ 
      success: true, 
      name: user.name,
      message: 'Login successful' 
    });
  }
  
  return createResponse({ success: false, message: 'Invalid credentials' });
}

/**
 * Get products from the Products sheet
 */
function handleGetProducts() {
  const sheet = getSheet(CONFIG.SHEETS.PRODUCTS);
  if (!sheet) {
    return createResponse({ error: 'Products sheet not found' }, 404);
  }
  
  const data = sheet.getDataRange().getValues();
  
  // Skip header row and return data
  const products = data.slice(1).filter(row => row[1] && row[2] && row[3]);
  
  return createResponse(products);
}

/**
 * Submit a new order
 */
function handleSubmitOrder(params) {
  const { date, item, qty, rate, total, payMode } = params;
  
  if (!date || !item || !qty || !rate || !total || !payMode) {
    return createResponse({ error: 'Missing required fields' }, 400);
  }
  
  const sheet = getSheet(CONFIG.SHEETS.ORDERS);
  if (!sheet) {
    return createResponse({ error: 'Orders sheet not found' }, 404);
  }
  
  // Add new row with order data
  const timestamp = new Date().toLocaleString();
  sheet.appendRow([timestamp, date, item, qty, rate, total, payMode]);
  
  return createResponse({ success: true, message: 'Order submitted successfully' });
}

/**
 * Submit charging record
 */
function handleSubmitCharging(params) {
  const { date, start, end, perpct, kcal, perunit, amount, paymode } = params;
  
  if (!date || !amount || !paymode) {
    return createResponse({ error: 'Missing required fields' }, 400);
  }
  
  const sheet = getSheet(CONFIG.SHEETS.CHARGING);
  if (!sheet) {
    return createResponse({ error: 'Charging sheet not found' }, 404);
  }
  
  const timestamp = new Date().toLocaleString();
  sheet.appendRow([timestamp, date, start || '', end || '', perpct || '', kcal || '', perunit || '', amount, paymode]);
  
  return createResponse({ success: true, message: 'Charging record submitted successfully' });
}

/**
 * Submit expense record
 */
function handleSubmitExpense(params) {
  const { date, desc, amt, paymode, cat, remarks } = params;
  
  if (!date || !desc || !amt || !paymode || !cat) {
    return createResponse({ error: 'Missing required fields' }, 400);
  }
  
  const sheet = getSheet(CONFIG.SHEETS.EXPENSES);
  if (!sheet) {
    return createResponse({ error: 'Expenses sheet not found' }, 404);
  }
  
  const timestamp = new Date().toLocaleString();
  sheet.appendRow([timestamp, date, desc, amt, paymode, cat, remarks || '']);
  
  return createResponse({ success: true, message: 'Expense recorded successfully' });
}

/**
 * Submit deposit record
 */
function handleSubmitDeposit(params) {
  const { amount, mode, depositedBy } = params;
  
  if (!amount || !mode || !depositedBy) {
    return createResponse({ error: 'Missing required fields' }, 400);
  }
  
  const sheet = getSheet(CONFIG.SHEETS.DEPOSITS);
  if (!sheet) {
    return createResponse({ error: 'Deposits sheet not found' }, 404);
  }
  
  const timestamp = new Date().toLocaleString();
  const date = new Date().toLocaleDateString();
  sheet.appendRow([timestamp, date, amount, mode, depositedBy]);
  
  return createResponse({ success: true, message: 'Deposit recorded successfully' });
}

/**
 * Get business insights data
 */
function handleGetInsights() {
  const sheet = getSheet(CONFIG.SHEETS.INSIGHTS);
  if (!sheet) {
    return createResponse({ error: 'Insights sheet not found' }, 404);
  }
  
  const data = sheet.getDataRange().getValues();
  return createResponse(data);
}

/**
 * Helper function to get a sheet by name
 */
function getSheet(sheetName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    return spreadsheet.getSheetByName(sheetName);
  } catch (error) {
    console.error(`Error accessing sheet ${sheetName}:`, error);
    return null;
  }
}

/**
 * Helper function to create standardized responses
 */
function createResponse(data, status = 200) {
  const response = ContentService.createTextOutput(JSON.stringify(data));
  response.setMimeType(ContentService.MimeType.JSON);
  
  // Add CORS headers
  if (status !== 200) {
    // For error responses, we still need to return a 200 status for CORS to work
    // The actual error status is handled in the response body
  }
  
  return response;
}

/**
 * Setup function to create required sheets (run this once)
 */
function setupSheets() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  
  // Create Products sheet
  const productsSheet = spreadsheet.insertSheet(CONFIG.SHEETS.PRODUCTS);
  productsSheet.getRange(1, 1, 1, 4).setValues([['ID', 'Name', 'Rate', 'Category']]);
  
  // Add sample products
  const sampleProducts = [
    [1, 'Coffee', 150, 'Beverages'],
    [2, 'Tea', 100, 'Beverages'],
    [3, 'Sandwich', 250, 'Food'],
    [4, 'Burger', 350, 'Food'],
    [5, 'Charging 1 Hour', 200, 'Services']
  ];
  productsSheet.getRange(2, 1, sampleProducts.length, 4).setValues(sampleProducts);
  
  // Create Orders sheet
  const ordersSheet = spreadsheet.insertSheet(CONFIG.SHEETS.ORDERS);
  ordersSheet.getRange(1, 1, 1, 7).setValues([['Timestamp', 'Date', 'Item', 'Quantity', 'Rate', 'Total', 'Payment Mode']]);
  
  // Create Charging sheet
  const chargingSheet = spreadsheet.insertSheet(CONFIG.SHEETS.CHARGING);
  chargingSheet.getRange(1, 1, 1, 9).setValues([['Timestamp', 'Date', 'Start %', 'End %', 'Rate per %', 'Kcal', 'Rate per Unit', 'Amount', 'Payment Mode']]);
  
  // Create Expenses sheet
  const expensesSheet = spreadsheet.insertSheet(CONFIG.SHEETS.EXPENSES);
  expensesSheet.getRange(1, 1, 1, 7).setValues([['Timestamp', 'Date', 'Description', 'Amount', 'Payment Mode', 'Category', 'Remarks']]);
  
  // Create Deposits sheet
  const depositsSheet = spreadsheet.insertSheet(CONFIG.SHEETS.DEPOSITS);
  depositsSheet.getRange(1, 1, 1, 5).setValues([['Timestamp', 'Date', 'Amount', 'Mode', 'Deposited By']]);
  
  // Create Insights sheet
  const insightsSheet = spreadsheet.insertSheet(CONFIG.SHEETS.INSIGHTS);
  insightsSheet.getRange(1, 1, 1, 4).setValues([['Metric', 'Value', 'Date', 'Notes']]);
  
  // Add sample insights
  const sampleInsights = [
    ['Total Sales', '15000', new Date().toLocaleDateString(), 'Monthly total'],
    ['Total Expenses', '8000', new Date().toLocaleDateString(), 'Monthly total'],
    ['Net Profit', '7000', new Date().toLocaleDateString(), 'Monthly total']
  ];
  insightsSheet.getRange(2, 1, sampleInsights.length, 4).setValues(sampleInsights);
  
  console.log('All sheets created successfully!');
}