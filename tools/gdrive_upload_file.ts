import { google } from "googleapis";
import { GDriveUploadFileInput, InternalToolResponse } from "./types.js";
import fs from "fs";

export const schema = {
  name: "gdrive_upload_file",
  description: "Upload a file to Google Drive. Optionally specify a parent folder or shared drive.",
  inputSchema: {
    type: "object",
    properties: {
      filePath: {
        type: "string",
        description: "Local file path to upload",
      },
      fileName: {
        type: "string",
        description: "Name for the file in Google Drive (optional, defaults to original filename)",
        optional: true,
      },
      parentId: {
        type: "string",
        description: "Optional parent folder ID. If not provided, file will be uploaded to root or specified drive.",
        optional: true,
      },
      driveName: {
        type: "string",
        description: "Optional shared drive name. If provided, file will be uploaded to that shared drive.",
        optional: true,
      },
    },
    required: ["filePath"],
  },
} as const;

export async function uploadFile(
  args: GDriveUploadFileInput,
): Promise<InternalToolResponse> {
  const drive = google.drive("v3");
  let parentId = args.parentId;
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
        // If no parentId specified, upload to root of the shared drive
        if (!parentId) {
          parentId = driveId;
        }
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

  // Check if file exists
  if (!fs.existsSync(args.filePath)) {
    return {
      content: [
        {
          type: "text",
          text: `File not found: ${args.filePath}`,
        },
      ],
      isError: true,
    };
  }

  try {
    const fileName = args.fileName || args.filePath.split("/").pop() || "uploaded-file";
    const mimeType = getMimeType(args.filePath);

    const fileMetadata: any = {
      name: fileName,
    };

    // Set parent folder
    if (parentId) {
      fileMetadata.parents = [parentId];
    }

    const createParams: any = {
      requestBody: fileMetadata,
      media: {
        mimeType: mimeType,
        body: fs.createReadStream(args.filePath),
      },
      fields: "id, name, mimeType, webViewLink, parents",
    };

    // Enable shared drive support if driveId is provided
    if (driveId) {
      createParams.supportsAllDrives = true;
      createParams.driveId = driveId;
    }

    const res = await drive.files.create(createParams);

    const fileId = res.data.id!;
    const uploadedFileName = res.data.name!;
    const webViewLink = res.data.webViewLink || "";

    return {
      content: [
        {
          type: "text",
          text: `✅ Successfully uploaded file "${uploadedFileName}"\nFile ID: ${fileId}\n${webViewLink ? `View link: ${webViewLink}` : ""}\n${driveId ? `In shared drive: ${args.driveName}` : parentId ? `In parent folder: ${parentId}` : "In root"}`,
        },
      ],
      isError: false,
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Error uploading file: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

// Simple MIME type detection based on file extension
function getMimeType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  const mimeTypes: Record<string, string> = {
    "md": "text/markdown",
    "txt": "text/plain",
    "json": "application/json",
    "pdf": "application/pdf",
    "doc": "application/msword",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "xls": "application/vnd.ms-excel",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "gif": "image/gif",
    "zip": "application/zip",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

