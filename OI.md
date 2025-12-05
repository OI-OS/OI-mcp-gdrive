# OI OS Integration Guide: OI-mcp-gdrive

This guide provides complete instructions for integrating the **OI-mcp-gdrive** MCP server with OI OS (Brain Trust 4).

## Overview

**OI-mcp-gdrive** is a Model Context Protocol (MCP) server that enables AI agents to interact with Google Drive and Google Sheets. It provides tools for searching files, reading files, and reading/updating spreadsheet cells.

## Features

- **Search Google Drive**: Find files by name or type
- **Read Files**: Read contents of any Google Drive file (Docs, Sheets, PDFs, etc.)
- **Read Spreadsheets**: Read data from Google Sheets with flexible range options
- **Update Cells**: Update cell values in Google Sheets

## Prerequisites

1. **Google Cloud Project** with APIs enabled:
   - Google Drive API
   - Google Sheets API
   - Google Docs API (for reading Docs)

2. **OAuth Credentials**:
   - OAuth Client ID (Desktop App type)
   - OAuth Client Secret
   - OAuth consent screen configured

3. **Environment Variables**:
   - `CLIENT_ID`: Your Google OAuth Client ID
   - `CLIENT_SECRET`: Your Google OAuth Client Secret
   - `GDRIVE_CREDS_DIR`: Directory path for storing OAuth tokens (e.g., `/Users/username/.config/mcp-gdrive`)

## Installation

The server is already installed via `oi install`. If you need to reinstall:

```bash
oi install https://github.com/OI-OS/OI-mcp-gdrive.git
```

## Configuration

### 1. Set Up Google Cloud Project

1. [Create a new Google Cloud project](https://console.cloud.google.com/projectcreate)
2. [Enable the Google Drive API](https://console.cloud.google.com/workspace-api/products)
3. [Enable the Google Sheets API](https://console.cloud.google.com/apis/api/sheets.googleapis.com/)
4. [Enable the Google Docs API](https://console.cloud.google.com/marketplace/product/google/docs.googleapis.com)
5. [Configure OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent) ("internal" is fine for testing)
6. Add OAuth scopes:
   - `https://www.googleapis.com/auth/drive.readonly`
   - `https://www.googleapis.com/auth/spreadsheets`
7. [Create OAuth Client ID](https://console.cloud.google.com/apis/credentials/oauthclient) for "Desktop App"
8. Download the JSON file and rename it to `gcp-oauth.keys.json`
9. Place it in the directory specified by `GDRIVE_CREDS_DIR`

### 2. Configure Environment Variables

Add to your `.env` file in the OI OS project root:

```bash
CLIENT_ID=your_client_id_here
CLIENT_SECRET=your_client_secret_here
GDRIVE_CREDS_DIR=/Users/username/.config/mcp-gdrive
```

### 3. Initial Authentication

Run the server once to trigger OAuth authentication:

```bash
cd MCP-servers/OI-mcp-gdrive
node ./dist/index.js
```

You'll be prompted to authenticate in your browser. The OAuth token will be saved in `GDRIVE_CREDS_DIR`.

### 4. Update config.json

The server should already be in `config.json`. If not, add:

```json
"OI-mcp-gdrive": {
  "command": "node",
  "args": ["MCP-servers/OI-mcp-gdrive/dist/index.js"],
  "env": {
    "CLIENT_ID": "your_client_id_here",
    "CLIENT_SECRET": "your_client_secret_here",
    "GDRIVE_CREDS_DIR": "/Users/username/.config/mcp-gdrive"
  }
}
```

## Intent Mappings

Intent mappings connect natural language keywords to specific tools. These are already configured in the database:

### gdrive_search
- `gdrive search`
- `google drive search`
- `search drive`
- `search google drive`
- `find file drive`
- `find in drive`

### gdrive_read_file
- `gdrive read`
- `read drive file`
- `read google drive`
- `get drive file`
- `open drive file`

### gsheets_read
- `gsheets read`
- `read sheet`
- `read spreadsheet`
- `get sheet data`
- `get spreadsheet`
- `read google sheet`

### gsheets_update_cell
- `gsheets update`
- `update sheet`
- `update cell`
- `edit sheet`
- `set cell`
- `write to sheet`

## Parameter Rules

Parameter rules define required fields and extraction methods. Already configured:

- **gdrive_search**: Requires `query`
- **gdrive_read_file**: Requires `fileId`
- **gsheets_read**: Requires `spreadsheetId`
- **gsheets_update_cell**: Requires `fileId`, `range`, `value`

## Parameter Extractors

Parameter extractors are configured in `parameter_extractors.toml.default`:

```toml
"OI-mcp-gdrive::gdrive_search.query" = "remove:search,find,google,drive,gdrive,for,in"
"OI-mcp-gdrive::gdrive_read_file.fileId" = "regex:(?:file[\\s_-]?id|fileId|id)[\\s:]+([A-Za-z0-9_-]+)|regex:([A-Za-z0-9_-]{20,})"
"OI-mcp-gdrive::gsheets_read.spreadsheetId" = "regex:(?:spreadsheet[\\s_-]?id|sheet[\\s_-]?id|spreadsheetId)[\\s:]+([A-Za-z0-9_-]+)|regex:([A-Za-z0-9_-]{20,})"
"OI-mcp-gdrive::gsheets_update_cell.fileId" = "regex:(?:file[\\s_-]?id|spreadsheet[\\s_-]?id|fileId)[\\s:]+([A-Za-z0-9_-]+)|regex:([A-Za-z0-9_-]{20,})"
"OI-mcp-gdrive::gsheets_update_cell.range" = "regex:(?:range|cell|at)[\\s:]+([A-Za-z0-9!:_-]+)"
"OI-mcp-gdrive::gsheets_update_cell.value" = "regex:(?:value|to|set[\\s_-]?to|equals?)[\\s:]+(.+)|regex:(?:update|set|edit)[\\s:]+[A-Za-z0-9!:_-]+[\\s:]+(.+)"
```

## Usage Examples

### Natural Language Queries

```bash
# Search for files
oi "search google drive for budget spreadsheet"
oi "find presentation files in drive"

# Read a file
oi "read file abc123xyz from google drive"
oi "get drive file abc123xyz"

# Read a spreadsheet
oi "read spreadsheet abc123xyz"
oi "get sheet data from abc123xyz"

# Update a cell
oi "update cell A1 in spreadsheet abc123xyz to 100"
oi "set cell Sheet1!B2 to Hello World"
```

### Direct Tool Calls

```bash
# Search
oi call OI-mcp-gdrive gdrive_search '{"query": "budget"}'

# Read file
oi call OI-mcp-gdrive gdrive_read_file '{"fileId": "abc123xyz"}'

# Read sheet
oi call OI-mcp-gdrive gsheets_read '{"spreadsheetId": "abc123xyz"}'

# Update cell
oi call OI-mcp-gdrive gsheets_update_cell '{"fileId": "abc123xyz", "range": "Sheet1!A1", "value": "100"}'
```

## Tools Reference

### gdrive_search
Search for files in Google Drive.

**Parameters:**
- `query` (string, required): Search query
- `pageToken` (string, optional): Token for pagination
- `pageSize` (number, optional): Results per page (max 100)

**Returns:** List of matching files with IDs, names, and MIME types

### gdrive_read_file
Read contents of a file from Google Drive.

**Parameters:**
- `fileId` (string, required): Google Drive file ID

**Returns:** File contents (Docs → Markdown, Sheets → CSV, etc.)

### gsheets_read
Read data from a Google Spreadsheet.

**Parameters:**
- `spreadsheetId` (string, required): Spreadsheet ID
- `ranges` (array, optional): A1 notation ranges (e.g., `['Sheet1!A1:B10']`)
- `sheetId` (number, optional): Specific sheet ID

**Returns:** Spreadsheet data in structured format

### gsheets_update_cell
Update a cell value in a Google Spreadsheet.

**Parameters:**
- `fileId` (string, required): Spreadsheet ID
- `range` (string, required): Cell range in A1 notation (e.g., `'Sheet1!A1'`)
- `value` (string, required): New cell value

**Returns:** Confirmation of updated value

## Troubleshooting

### Authentication Issues

**Problem:** "Authentication required" or OAuth errors

**Solution:**
1. Verify `CLIENT_ID` and `CLIENT_SECRET` are correct
2. Check `GDRIVE_CREDS_DIR` exists and is writable
3. Run `node ./dist/index.js` to re-authenticate
4. Ensure OAuth consent screen is configured

### File Not Found

**Problem:** "File not found" when reading files

**Solution:**
1. Verify the file ID is correct (from search results)
2. Ensure the authenticated account has access to the file
3. Check file permissions in Google Drive

### Spreadsheet Access Issues

**Problem:** Cannot read or update spreadsheets

**Solution:**
1. Verify Google Sheets API is enabled
2. Check OAuth scopes include `spreadsheets`
3. Ensure authenticated account has edit permissions

### Build Issues

**Problem:** Server won't start or missing dist files

**Solution:**
```bash
cd MCP-servers/OI-mcp-gdrive
npm install
npm run build
```

## Resources

- **Repository**: https://github.com/OI-OS/OI-mcp-gdrive
- **Original Fork**: https://github.com/isaacphi/mcp-gdrive
- **Google Drive API Docs**: https://developers.google.com/drive/api
- **Google Sheets API Docs**: https://developers.google.com/sheets/api

## License

MIT License - See LICENSE file in repository

