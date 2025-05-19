import multer from 'multer';
import { Request } from 'express';
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Create upload directories if they don't exist
const uploadDir = path.join(process.cwd(), 'uploads');
const resumeDir = path.join(uploadDir, 'resumes');

// Ensure directories exist
fs.ensureDirSync(uploadDir);
fs.ensureDirSync(resumeDir);

// Storage configuration for multer
const storage = multer.diskStorage({
  destination: function(_req, _file, cb) {
    cb(null, resumeDir);
  },
  filename: function(_req, file, cb) {
    // Generate unique filename with original extension
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    cb(null, fileName);
  }
});

// File filter to validate uploads
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only PDF and DOC/DOCX files
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
  }
};

// Configure upload middleware
export const resumeUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Function to get the public URL for an uploaded file
export function getFileUrl(filename: string): string {
  return `/uploads/resumes/${filename}`;
}

// Function to delete uploaded file
export async function deleteFile(filename: string): Promise<void> {
  const filePath = path.join(resumeDir, filename);
  try {
    if (await fs.pathExists(filePath)) {
      await fs.unlink(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}