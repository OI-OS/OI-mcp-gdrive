import { google } from "googleapis";
import { GDriveCreateFolderInput, InternalToolResponse } from "./types.js";

export const schema = {
  name: "gdrive_create_folder",
  description: "Create a new folder in Google Drive. Optionally specify a parent folder or shared drive.",
  inputSchema: {
    type: "object",
    properties: {
      folderName: {
        type: "string",
        description: "Name of the folder to create",
      },
      parentId: {
        type: "string",
        description: "Optional parent folder ID. If not provided, folder will be created in root or specified drive.",
        optional: true,
      },
      driveName: {
        type: "string",
        description: "Optional shared drive name. If provided, folder will be created in that shared drive.",
        optional: true,
      },
    },
    required: ["folderName"],
  },
} as const;

export async function createFolder(
  args: GDriveCreateFolderInput,
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
        // If no parentId specified, create in root of the shared drive
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

  try {
    const fileMetadata: any = {
      name: args.folderName,
      mimeType: "application/vnd.google-apps.folder",
    };

    // Set parent folder
    if (parentId) {
      fileMetadata.parents = [parentId];
    }

    const createParams: any = {
      requestBody: fileMetadata,
      fields: "id, name, mimeType, parents",
    };

    // Enable shared drive support if driveId is provided
    if (driveId) {
      createParams.supportsAllDrives = true;
      createParams.driveId = driveId;
    }

    const res = await drive.files.create(createParams);

    const folderId = res.data.id!;
    const folderName = res.data.name!;

    return {
      content: [
        {
          type: "text",
          text: `✅ Successfully created folder "${folderName}"\nFolder ID: ${folderId}\n${driveId ? `In shared drive: ${args.driveName}` : parentId ? `In parent folder: ${parentId}` : "In root"}`,
        },
      ],
      isError: false,
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Error creating folder: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

