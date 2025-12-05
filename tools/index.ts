import { schema as gdriveSearchSchema, search } from './gdrive_search.js';
import { schema as gdriveReadFileSchema, readFile } from './gdrive_read_file.js';
import { schema as gdriveCreateFolderSchema, createFolder } from './gdrive_create_folder.js';
import { schema as gdriveUploadFileSchema, uploadFile } from './gdrive_upload_file.js';
import { schema as gsheetsUpdateCellSchema, updateCell } from './gsheets_update_cell.js';
import { schema as gsheetsReadSchema, readSheet } from './gsheets_read.js';
import { 
  Tool, 
  GDriveSearchInput, 
  GDriveReadFileInput,
  GDriveCreateFolderInput,
  GDriveUploadFileInput,
  GSheetsUpdateCellInput,
  GSheetsReadInput 
} from './types.js';

export const tools: [
  Tool<GDriveSearchInput>,
  Tool<GDriveReadFileInput>,
  Tool<GDriveCreateFolderInput>,
  Tool<GDriveUploadFileInput>,
  Tool<GSheetsUpdateCellInput>,
  Tool<GSheetsReadInput>
] = [
  {
    ...gdriveSearchSchema,
    handler: search,
  },
  {
    ...gdriveReadFileSchema,
    handler: readFile,
  },
  {
    ...gdriveCreateFolderSchema,
    handler: createFolder,
  },
  {
    ...gdriveUploadFileSchema,
    handler: uploadFile,
  },
  {
    ...gsheetsUpdateCellSchema,
    handler: updateCell,
  },
  {
    ...gsheetsReadSchema,
    handler: readSheet,
  }
];