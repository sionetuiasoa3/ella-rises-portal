/**
 * File Upload Middleware using AWS S3
 * 
 * This module provides multer middleware configured to upload files directly to S3.
 * 
 * Environment Variables Required:
 * - S3_BUCKET_NAME (or AWS_S3_BUCKET): The name of your S3 bucket
 * - AWS_REGION (or AWS_DEFAULT_REGION): The AWS region (defaults to us-east-2)
 * 
 * Optional (if not using EC2 instance role):
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * 
 * Files are stored in S3 under: uploads/<entity>/<timestamp>-<originalname>
 * Example: uploads/participants/1234567890-123456789-image.jpg
 */

import multer from 'multer';
import multerS3 from 'multer-s3';
import s3Client, { getBucketName } from '../services/s3.js';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

const bucketName = getBucketName();

// File filter to only allow images
const imageFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, jpeg, png, webp) are allowed!'), false);
  }
};

// Create S3 storage configuration for a specific entity
const createS3Storage = (entity) => {
  if (!bucketName) {
    throw new Error('S3_BUCKET_NAME or AWS_S3_BUCKET environment variable is not set');
  }

  return multerS3({
    s3: s3Client,
    bucket: bucketName,
    // Note: ACL is not set because modern S3 buckets use "Bucket owner enforced" 
    // which disables ACLs. Use bucket policy instead for public access.
    contentType: multerS3.AUTO_CONTENT_TYPE, // Automatically set content type
    key: (req, file, cb) => {
      // Generate unique filename: timestamp-random-originalname
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = file.originalname.substring(file.originalname.lastIndexOf('.'));
      const baseName = file.originalname.substring(0, file.originalname.lastIndexOf('.'));
      const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
      
      // Store in S3 under: uploads/<entity>/<sanitized-name>-<timestamp>-<random>.<ext>
      const key = `uploads/${entity}/${sanitizedName}-${uniqueSuffix}${ext}`;
      cb(null, key);
    }
  });
};

// Create multer instance for a specific entity
export const createUpload = (entity, fieldName = 'photo', maxSizeMB = 5) => {
  // Check if S3 is configured
  if (!bucketName) {
    console.warn('⚠️  S3_BUCKET_NAME not set. File uploads will fail.');
    console.warn('   Please set S3_BUCKET_NAME or AWS_S3_BUCKET environment variable.');
  }

  const storage = bucketName ? createS3Storage(entity) : null;
  
  // If S3 is not configured, return a multer instance that will fail gracefully
  if (!storage) {
    return multer({
      fileFilter: imageFilter,
      limits: {
        fileSize: maxSizeMB * 1024 * 1024,
      }
    }).single(fieldName);
  }

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

// Helper to get the public URL for an uploaded file
export const getUploadPath = (entity, filename) => {
  if (!filename) return null;
  
  // If it's already a full URL (S3 URL), return as is
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  
  // If it's already a path starting with /, return as is (for backward compatibility)
  if (filename.startsWith('/')) {
    return filename;
  }
  
  // If bucket name is set, construct S3 URL
  if (bucketName) {
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-2';
    // S3 URL format: https://<bucket>.s3.<region>.amazonaws.com/<key>
    return `https://${bucketName}.s3.${region}.amazonaws.com/uploads/${entity}/${filename}`;
  }
  
  // Fallback to local path (for backward compatibility)
  return `/uploads/${entity}/${filename}`;
};

// Helper to extract S3 key from URL or path
const extractS3Key = (filePath) => {
  if (!filePath) return null;
  
  // If it's an S3 URL, extract the key
  if (filePath.includes('.s3.') || filePath.includes('s3.amazonaws.com')) {
    // Extract key from URL like: https://bucket.s3.region.amazonaws.com/uploads/entity/filename
    const urlMatch = filePath.match(/s3[^/]*\/.*$/);
    if (urlMatch) {
      return urlMatch[0].replace(/^s3[^/]*\//, '');
    }
    // Alternative format: https://bucket.s3.region.amazonaws.com/uploads/...
    const altMatch = filePath.match(/\.amazonaws\.com\/(.+)$/);
    if (altMatch) {
      return altMatch[1];
    }
  }
  
  // If it's a local path starting with /uploads/, convert to S3 key
  if (filePath.startsWith('/uploads/')) {
    return filePath.substring(1); // Remove leading /
  }
  
  // If it's already a key (no leading / and contains uploads/), return as is
  if (filePath.includes('uploads/') && !filePath.startsWith('/')) {
    return filePath;
  }
  
  return null;
};

// Helper to delete an uploaded file from S3
export const deleteUploadedFile = async (filePath) => {
  if (!filePath || !bucketName) return;
  
  try {
    const key = extractS3Key(filePath);
    
    if (!key) {
      console.warn(`Could not extract S3 key from path: ${filePath}`);
      return;
    }
    
    // Delete from S3
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key
    });
    
    await s3Client.send(command);
    console.log(`Deleted file from S3: ${key}`);
  } catch (error) {
    console.error('Error deleting file from S3:', error);
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
