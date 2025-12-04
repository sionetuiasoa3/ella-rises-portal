import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base upload directory (relative to project root)
const UPLOAD_BASE_DIR = path.join(__dirname, '../../public/uploads');

// Ensure upload directories exist
const ensureUploadDir = (entity) => {
  const uploadDir = path.join(UPLOAD_BASE_DIR, entity);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

// File filter to only allow images
const imageFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, jpeg, png, webp) are allowed!'), false);
  }
};

// Create storage configuration for a specific entity
const createStorage = (entity) => {
  const uploadDir = ensureUploadDir(entity);
  
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Generate unique filename: timestamp-random-originalname
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
      cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
    }
  });
};

// Create multer instance for a specific entity
export const createUpload = (entity, fieldName = 'photo', maxSizeMB = 5) => {
  const storage = createStorage(entity);
  
  return multer({
    storage: storage,
    fileFilter: imageFilter,
    limits: {
      fileSize: maxSizeMB * 1024 * 1024, // Convert MB to bytes
    }
  }).single(fieldName);
};

// Pre-configured uploaders
export const uploadParticipantPhoto = createUpload('participants', 'photo');

// Helper to get the public URL path for an uploaded file
export const getUploadPath = (entity, filename) => {
  if (!filename) return null;
  // If it's already a full URL or path, return as is
  if (filename.startsWith('http') || filename.startsWith('/')) {
    return filename;
  }
  // Otherwise, construct the path relative to public/uploads
  return `/uploads/${entity}/${filename}`;
};

// Helper to delete an uploaded file
export const deleteUploadedFile = (filePath) => {
  if (!filePath) return;
  
  try {
    // Extract filename from path
    const filename = path.basename(filePath);
    const entity = filePath.includes('/participants/') ? 'participants' : null;
    
    if (entity) {
      const fullPath = path.join(UPLOAD_BASE_DIR, entity, filename);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
  } catch (error) {
    console.error('Error deleting uploaded file:', error);
    // Don't throw - file deletion is not critical
  }
};

// Middleware to handle upload errors gracefully
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'File too large. Maximum size is 5MB.' 
      });
    }
    return res.status(400).json({ 
      message: `Upload error: ${err.message}` 
    });
  }
  
  if (err) {
    return res.status(400).json({ 
      message: err.message || 'File upload failed' 
    });
  }
  
  next();
};
