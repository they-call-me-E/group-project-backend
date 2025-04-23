const { S3Client } = require("@aws-sdk/client-s3");

module.exports.BUCKET_NAME = process.env.AWS_BUCKET_NAME;

// AWS S3 Client
module.exports.s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
