/**
 * AWS S3 Client Configuration
 * 
 * This module creates and exports a configured S3Client for use throughout the application.
 * 
 * Environment Variables Required:
 * - AWS_REGION (or AWS_DEFAULT_REGION): The AWS region where your S3 bucket is located
 *   Example: "us-east-2"
 * 
 * Optional Environment Variables (if not using EC2 instance role):
 * - AWS_ACCESS_KEY_ID: AWS access key ID
 * - AWS_SECRET_ACCESS_KEY: AWS secret access key
 * 
 * Note: On AWS Elastic Beanstalk, you can use an IAM instance role instead of access keys.
 * The SDK will automatically use the instance role credentials if access keys are not provided.
 * 
 * To change the bucket name or region:
 * - Update the S3_BUCKET_NAME environment variable in your EB environment configuration
 * - Update the AWS_REGION environment variable in your EB environment configuration
 */

import { S3Client } from '@aws-sdk/client-s3';

// Get region from environment variables
// AWS_REGION is standard, but AWS_DEFAULT_REGION is also commonly used
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-2';

// Create S3 client
// If AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are not set,
// the SDK will automatically use the EC2 instance role credentials
const s3Client = new S3Client({
  region: region,
  // Credentials will be automatically loaded from:
  // 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
  // 2. EC2 instance role (if running on EC2/EB)
  // 3. Default credential provider chain
});

export default s3Client;

// Export bucket name helper
export const getBucketName = () => {
  return process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || null;
};

// Export region for reference
export { region };

