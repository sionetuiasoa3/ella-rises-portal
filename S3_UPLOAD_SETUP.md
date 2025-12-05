# S3 File Upload Setup

## Overview

This application now uses AWS S3 for storing uploaded files (profile pictures) instead of local file storage. This provides better scalability, reliability, and is compatible with AWS Elastic Beanstalk's ephemeral file system.

## Implementation Summary

### Files Created/Modified

1. **`server/services/s3.js`** (NEW)
   - Creates and exports a configured S3Client using AWS SDK v3
   - Uses environment variables for configuration
   - Automatically uses EC2 instance role if access keys are not provided

2. **`server/middleware/upload.js`** (MODIFIED)
   - Replaced local disk storage with S3 storage using `multer-s3`
   - Files are uploaded directly to S3
   - Updated `deleteUploadedFile()` to delete from S3 instead of local filesystem
   - Updated `getUploadPath()` to return S3 URLs

3. **`server/routes/index.js`** (MODIFIED)
   - Updated profile edit route to use S3 URLs from `req.file.location`
   - Made `deleteUploadedFile()` calls async

4. **`server/routes/participantsRoutes.js`** (MODIFIED)
   - Updated photo upload route to use S3 URLs
   - Made `deleteUploadedFile()` calls async

5. **`package.json`** (MODIFIED)
   - Added dependencies: `@aws-sdk/client-s3` and `multer-s3`

## Environment Variables

### Required

- **`S3_BUCKET_NAME`** (or `AWS_S3_BUCKET`): The name of your S3 bucket
  - Example: `ella-rises-uploads`
  - Set this in your AWS Elastic Beanstalk environment configuration

- **`AWS_REGION`** (or `AWS_DEFAULT_REGION`): The AWS region where your S3 bucket is located
  - Example: `us-east-2`
  - Defaults to `us-east-2` if not set
  - Set this in your AWS Elastic Beanstalk environment configuration

### Optional (if not using EC2 instance role)

- **`AWS_ACCESS_KEY_ID`**: AWS access key ID (only needed if not using instance role)
- **`AWS_SECRET_ACCESS_KEY`**: AWS secret access key (only needed if not using instance role)

**Note**: On AWS Elastic Beanstalk, it's recommended to use an IAM instance role instead of access keys. The SDK will automatically use the instance role credentials if access keys are not provided.

## IAM Permissions Required

Your EC2 instance role (or IAM user if using access keys) needs the following S3 permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/uploads/*"
    }
  ]
}
```

**Note**: `s3:PutObjectAcl` is not needed because modern buckets use bucket policies instead of ACLs.

## S3 Bucket Configuration

1. **Create an S3 bucket** in your AWS account
2. **Configure bucket policy for public read access** (required for modern S3 buckets):
   
   Modern S3 buckets (created after April 2023) have "Bucket owner enforced" Object Ownership, which disables ACLs. Instead, use a bucket policy:
   
   Go to your S3 bucket → Permissions → Bucket Policy, and add:
   
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/uploads/*"
       }
     ]
   }
   ```
   
   Replace `YOUR_BUCKET_NAME` with your actual bucket name.
   
   **Important**: Also uncheck "Block all public access" in the bucket's Public Access settings, or the policy won't work.

3. **Set CORS configuration** (if needed for direct browser uploads in the future):

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://rise.is404.net"],
    "ExposeHeaders": []
  }
]
```

## File Storage Structure

Files are stored in S3 under the following structure:

```
uploads/
  └── participants/
      └── <sanitized-name>-<timestamp>-<random>.<ext>
```

Example:
```
uploads/participants/john_doe-1234567890-987654321.jpg
```

## How It Works

1. **User uploads a file** via the profile edit form (`/portal/profile/edit`)
2. **Multer middleware** (`uploadParticipantPhoto`) receives the file
3. **File is uploaded directly to S3** using `multer-s3`
4. **S3 returns a public URL** in `req.file.location`
5. **URL is stored in database** in the `ParticipantPhotoPath` column
6. **Views display the image** using the stored S3 URL

## Backward Compatibility

The implementation maintains backward compatibility:

- If `S3_BUCKET_NAME` is not set, the upload middleware will warn but not crash
- Old local file paths (starting with `/uploads/`) will still work in views
- The `getUploadPath()` function handles both S3 URLs and local paths
- The `deleteUploadedFile()` function can delete from both S3 and local filesystem

## Testing

1. **Set environment variables** in your EB environment:
   - `S3_BUCKET_NAME=your-bucket-name`
   - `AWS_REGION=us-east-2` (or your region)

2. **Ensure IAM permissions** are configured for the instance role

3. **Test upload**:
   - Go to `/portal/profile/edit`
   - Upload a profile picture
   - Verify the image displays correctly
   - Check S3 bucket to confirm file was uploaded

4. **Test deletion**:
   - Upload a new picture (should delete old one)
   - Verify old file is removed from S3

## Troubleshooting

### Upload fails with "Access Denied" or "The bucket does not allow ACLs"
- **If you see "The bucket does not allow ACLs"**: This means your bucket has "Bucket owner enforced" Object Ownership. The code has been updated to not use ACLs. Instead, configure a bucket policy for public read access (see S3 Bucket Configuration above).
- Check IAM permissions for the instance role
- Verify bucket name is correct
- Ensure bucket exists in the specified region

### Images don't display
- Verify S3 bucket policy allows public read access (see S3 Bucket Configuration above)
- Check that "Block all public access" is disabled in bucket settings
- Verify the bucket policy targets the correct path (`uploads/*`)
- Check browser console for CORS errors

### Old files not being deleted
- Check IAM permissions include `s3:DeleteObject`
- Verify the file path format matches what's stored in the database
- Check application logs for deletion errors

## Migration from Local Storage

If you have existing files in local storage (`public/uploads/`), you can:

1. **Keep them as-is**: The views will continue to work with local paths
2. **Migrate to S3**: Write a migration script to upload existing files to S3 and update database URLs
3. **Hybrid approach**: New uploads go to S3, old files remain local until replaced

## Security Considerations

- Files are stored with public read access via bucket policy (not ACLs, which are disabled on modern buckets)
- Consider implementing signed URLs for private files in the future
- File types are restricted to images (jpg, jpeg, png, webp)
- File size is limited to 5MB
- File names are sanitized to prevent path traversal attacks
- Bucket policy only grants public read access to `uploads/*` path, keeping other bucket contents private

