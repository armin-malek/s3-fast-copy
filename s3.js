const AWS = require("aws-sdk");
const SourceS3 = new AWS.S3({
  endpoint: process.env.SOURCE_ENDPOINT,
  accessKeyId: process.env.SOURCE_KEY,
  secretAccessKey: process.env.SOURCE_SECRET,
  // BUCKET: process.env.SOURCE_BUCKET,
});
const SOURCE_BUCKET = process.env.SOURCE_BUCKET;

// const TargetS3 = new AWS.S3({
//   endpoint: process.env.TARGET_ENDPOINT,
//   accessKeyId: process.env.TARGET_KEY,
//   secretAccessKey: process.env.TARGET_SECRET,
//   // BUCKET: process.env.TARGET_BUCKET,
// });
const TARGET_BUCKET = process.env.TARGET_BUCKET;

module.exports = {
  SourceS3,
  SOURCE_BUCKET,
  //   TargetS3,
  TARGET_BUCKET,
};
