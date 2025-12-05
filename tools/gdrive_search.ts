import { google } from "googleapis";
import { GDriveSearchInput, InternalToolResponse } from "./types.js";

export const schema = {
  name: "gdrive_search",
  description: "Search for files in Google Drive. Optionally filter by shared drive name.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query",
      },
      pageToken: {
        type: "string",
        description: "Token for the next page of results",
        optional: true,
      },
      pageSize: {
        type: "number",
        description: "Number of results per page (max 100)",
        optional: true,
      },
      driveName: {
        type: "string",
        description: "Optional shared drive name to filter files by (e.g., 'OI Team')",
        optional: true,
      },
    },
    required: ["query"],
  },
} as const;

export async function search(
  args: GDriveSearchInput,
): Promise<InternalToolResponse> {
  const drive = google.drive("v3");
  const userQuery = args.query.trim();
  let searchQuery = "";
  let driveId: string | undefined;

  // If driveName is provided, find the shared drive by name
  if (args.driveName) {
    try {
      const drivesRes = await drive.drives.list({
        pageSize: 100,
        q: `name = '${args.driveName.replace(/'/g, "\\'")}'`,
      });

      if (drivesRes.data.drives && drivesRes.data.drives.length > 0) {
        driveId = drivesRes.data.drives[0].id!;
      } else {
        return {
          content: [
            {
              type: "text",
              text: `Shared drive "${args.driveName}" not found. Please check the drive name and ensure you have access to it.`,
            },
          ],
          isError: true,
        };
      }
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error finding shared drive "${args.driveName}": ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  // Build search query
  // If driveName is provided, check if query only contains drive-related terms or the drive name itself
  if (driveId) {
    const cleanedQuery = userQuery.toLowerCase().trim();
    const driveNameLower = args.driveName?.toLowerCase().trim() || "";
    // If query is empty, only contains drive-related words, or matches the drive name, use empty query
    if (!userQuery || 
        cleanedQuery === driveNameLower ||
        cleanedQuery.includes("drive") && cleanedQuery.replace(/drive|shared|in|from|search|find|google|gdrive|for|list|show|everything|all|files/g, "").trim() === "" ||
        cleanedQuery.split(/\s+/).every(word => ["drive", "shared", "in", "from", "search", "find", "google", "gdrive", "for", "list", "show", "everything", "all", "files", ...driveNameLower.split(/\s+/)].includes(word))) {
      searchQuery = "trashed = false";
    } else {
      // Query has actual search terms, use them
      const escapedQuery = userQuery.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      searchQuery = `name contains '${escapedQuery}' and trashed = false`;
    }
  } else if (!userQuery) {
    searchQuery = "trashed = false";
  } else {
    // Escape special characters in the query
    const escapedQuery = userQuery.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

    // Build search query with multiple conditions
    const conditions = [];

    // Search in title
    conditions.push(`name contains '${escapedQuery}'`);

    // If specific file type is mentioned in query, add mimeType condition
    if (userQuery.toLowerCase().includes("sheet")) {
      conditions.push("mimeType = 'application/vnd.google-sheets.spreadsheet'");
    }

    searchQuery = `(${conditions.join(" or ")}) and trashed = false`;
  }

  // Add drive filter if driveId is found
  if (driveId) {
    searchQuery += ` and '${driveId}' in parents`;
  }

  const listParams: any = {
    q: searchQuery,
    pageSize: args.pageSize || 10,
    pageToken: args.pageToken,
    orderBy: "modifiedTime desc",
    fields: "nextPageToken, files(id, name, mimeType, modifiedTime, size)",
  };

  // Enable shared drive support
  if (driveId) {
    listParams.supportsAllDrives = true;
    listParams.includeItemsFromAllDrives = true;
    listParams.corpora = "drive";
    listParams.driveId = driveId;
  } else {
    listParams.supportsAllDrives = true;
    listParams.includeItemsFromAllDrives = true;
  }

  const res = await drive.files.list(listParams);

  const fileList = res.data.files
    ?.map((file: any) => `${file.id} ${file.name} (${file.mimeType})`)
    .join("\n");

  let response = `Found ${res.data.files?.length ?? 0} files:\n${fileList}`;

  // Add pagination info if there are more results
  if (res.data.nextPageToken) {
    response += `\n\nMore results available. Use pageToken: ${res.data.nextPageToken}`;
  }

  return {
    content: [
      {
        type: "text",
        text: response,
      },
    ],
    isError: false,
  };
}
