# Google Apps Script Setup Instructions

## Step 1: Create Google Apps Script Project

1. Go to [Google Apps Script](https://script.google.com)
2. Click "New Project"
3. Replace the default code with the code from `google-apps-script.js`

## Step 2: Configure Your Spreadsheet

1. Create a new Google Sheets document
2. Copy the spreadsheet ID from the URL (the long string between `/d/` and `/edit`)
3. Update the `SPREADSHEET_ID` in the script configuration

## Step 3: Run Setup Function

1. In the Apps Script editor, select the `setupSheets` function
2. Click the "Run" button to create all required sheets
3. Grant necessary permissions when prompted

## Step 4: Deploy as Web App

1. Click "Deploy" > "New deployment"
2. Choose "Web app" as the type
3. Set execute as "Me"
4. Set access to "Anyone" (for public access)
5. Click "Deploy"
6. Copy the web app URL - this is what you'll use in your mobile app

## Step 5: Update Mobile App

Use the web app URL in your mobile app's Google Sheets configuration.

## Sheet Structure

The script will create these sheets:

### Products Sheet
- ID, Name, Rate, Category

### Orders Sheet  
- Timestamp, Date, Item, Quantity, Rate, Total, Payment Mode

### Charging Sheet
- Timestamp, Date, Start %, End %, Rate per %, Kcal, Rate per Unit, Amount, Payment Mode

### Expenses Sheet
- Timestamp, Date, Description, Amount, Payment Mode, Category, Remarks

### Deposits Sheet
- Timestamp, Date, Amount, Mode, Deposited By

### BepInsight Sheet
- Metric, Value, Date, Notes

## Security Notes

- The current setup uses simple username/password authentication
- For production, consider implementing proper OAuth or API key authentication
- Update the user credentials in the CONFIG object
- Consider restricting web app access to specific domains

## Testing

Test each endpoint using the web app URL:
- `{URL}?action=login&username=admin&password=admin123`
- `{URL}?action=getProducts`
- `{URL}?action=getBepInsight`

For POST requests, use a tool like Postman or the mobile app directly.