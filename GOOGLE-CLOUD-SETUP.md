# Google Cloud Setup Guide for OI-mcp-gdrive

This guide walks you through setting up Google Cloud for the OI-mcp-gdrive MCP server. The setup is **free** using Google Cloud's free tier.

## Prerequisites

- Google account (Gmail or Google Workspace)
- Access to [Google Cloud Console](https://console.cloud.google.com/)

## Step-by-Step Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name (e.g., "OI Drive MCP")
4. Click **"Create"**
5. Wait for project creation (usually 10-30 seconds)

**Note:** New customers get [$300 in free credits](https://cloud.google.com/free) and 20+ always-free products. This setup uses only free tier services.

### Step 2: Enable Required APIs

Enable these APIs in your project:

#### 2a. Enable Google Drive API

1. Go to [API Library](https://console.cloud.google.com/apis/library)
2. Search for **"Google Drive API"**
3. Click on **"Google Drive API"**
4. Click **"Enable"**
5. Wait for activation (usually 10-20 seconds)

#### 2b. Enable Google Sheets API

1. In [API Library](https://console.cloud.google.com/apis/library)
2. Search for **"Google Sheets API"**
3. Click on **"Google Sheets API"**
4. Click **"Enable"**

#### 2c. Enable Google Docs API (for reading Docs)

1. In [API Library](https://console.cloud.google.com/apis/library)
2. Search for **"Google Docs API"**
3. Click on **"Google Docs API"**
4. Click **"Enable"**

**All three APIs are free to use within their free tier limits.**

### Step 3: Configure OAuth Consent Screen

1. Go to [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
2. Select **"Internal"** (for personal/testing use) or **"External"** (for wider distribution)
   - **Internal**: Only users in your Google Workspace organization
   - **External**: Any Google account (requires verification for production)
3. Click **"Create"**
4. Fill in the form:
   - **App name**: "OI Drive MCP" (or your choice)
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click **"Save and Continue"**
6. **Add Scopes** (click "Add or Remove Scopes"):
   - Search and add: `https://www.googleapis.com/auth/drive` (full Drive access - required for creating folders)
   - Search and add: `https://www.googleapis.com/auth/spreadsheets`
   - Click **"Update"**
7. Click **"Save and Continue"**
8. **Test users** (if External): Add your email address
9. Click **"Save and Continue"**
10. Review and click **"Back to Dashboard"**

### Step 4: Create OAuth Client ID

1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. If prompted, select **"Desktop app"** as application type
4. Click **"Create"**
5. Fill in:
   - **Name**: "OI Drive MCP Desktop" (or your choice)
   - **Application type**: **"Desktop app"**
6. Click **"Create"**
7. **IMPORTANT**: A popup will show your credentials:
   - **Client ID**: Copy this (looks like `123456789-abc...xyz.apps.googleusercontent.com`)
   - **Client secret**: Copy this (looks like `GOCSPX-abc...xyz`)
8. Click **"OK"**

**⚠️ Save these credentials - you'll need them for the `.env` file!**

### Step 5: Download OAuth Credentials (Optional but Recommended)

1. In [Credentials](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID
3. Click the **download icon** (⬇️) or click on the credential name
4. Click **"DOWNLOAD JSON"**
5. Save the file as `gcp-oauth.keys.json`
6. Place it in your `GDRIVE_CREDS_DIR` directory (e.g., `/Users/username/.config/mcp-gdrive`)

**Note:** The JSON file contains both Client ID and Client Secret, but you still need to set them as environment variables.

## Environment Variables Setup

Add these to your `.env` file in the OI OS project root:

```bash
# Google Drive MCP Server Configuration
CLIENT_ID=your_client_id_here.apps.googleusercontent.com
CLIENT_SECRET=your_client_secret_here
GDRIVE_CREDS_DIR=/Users/username/.config/mcp-gdrive
```

**Replace:**
- `your_client_id_here.apps.googleusercontent.com` with your actual Client ID
- `your_client_secret_here` with your actual Client Secret
- `/Users/username/.config/mcp-gdrive` with your desired credentials directory path

## Initial Authentication

After setting up environment variables:

1. Create the credentials directory:
   ```bash
   mkdir -p ~/.config/mcp-gdrive
   ```

2. If you downloaded `gcp-oauth.keys.json`, copy it to the directory:
   ```bash
   cp ~/Downloads/gcp-oauth.keys.json ~/.config/mcp-gdrive/
   ```

3. Run the server to trigger OAuth flow:
   ```bash
   cd MCP-servers/OI-mcp-gdrive
   node ./dist/index.js
   ```

4. A browser window will open asking you to:
   - Sign in with your Google account
   - Grant permissions to the app
   - Click "Allow"

5. The OAuth token will be saved automatically in `GDRIVE_CREDS_DIR`

## Verification

Test the setup:

```bash
# List tools
oi tools OI-mcp-gdrive

# Test search (replace with your actual query)
oi "search google drive for test"
```

## Free Tier Limits

According to [Google Cloud's free tier](https://cloud.google.com/free):

- **Google Drive API**: Free for basic usage (no specific limit mentioned for Drive API calls)
- **Google Sheets API**: Free for standard operations
- **Google Docs API**: Free for standard operations

**Note:** The free tier is generous for personal/testing use. For production use, check current pricing at [Google Cloud Pricing](https://cloud.google.com/pricing).

## Troubleshooting

### "Access denied" or "Permission denied"

- Verify OAuth scopes are added in consent screen
- Check that you're using the correct Google account
- Ensure the account has access to the files you're trying to access

### "Invalid credentials"

- Verify `CLIENT_ID` and `CLIENT_SECRET` are correct (no extra spaces)
- Check that credentials are for "Desktop app" type
- Ensure environment variables are loaded correctly

### "API not enabled"

- Go to [API Library](https://console.cloud.google.com/apis/library)
- Verify all three APIs are enabled:
  - Google Drive API
  - Google Sheets API
  - Google Docs API

### Authentication token expired

- Delete the token file in `GDRIVE_CREDS_DIR`
- Run `node ./dist/index.js` again to re-authenticate

## Security Best Practices

1. **Never commit credentials to Git**:
   - Add `.env` to `.gitignore`
   - Add `GDRIVE_CREDS_DIR` to `.gitignore`
   - Never share Client ID/Secret publicly

2. **Use environment variables**:
   - Store credentials in `.env` file (not in code)
   - Use different credentials for development/production

3. **Limit OAuth scopes**:
   - Only request scopes you actually need
   - Use `drive.readonly` if you only need to read files

## Next Steps

Once setup is complete, see [OI.md](./OI.md) for usage examples and tool reference.

## Resources

- [Google Cloud Free Tier](https://cloud.google.com/free)
- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [OAuth 2.0 for Desktop Apps](https://developers.google.com/identity/protocols/oauth2/native-app)
