const Minio = require("minio");
const targetMinio = new Minio.Client({
  endPoint: process.env.TARGET_ENDPOINT,
  port: 49322,
  useSSL: false,
  accessKey: process.env.TARGET_KEY,
  secretKey: process.env.TARGET_SECRET,
});

const TARGET_BUCKET = process.env.TARGET_BUCKET;

module.exports = {
  targetMinio,
  TARGET_BUCKET,
};
