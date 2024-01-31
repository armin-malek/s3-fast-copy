require("dotenv").config();
const AWS = require("aws-sdk");
const fs = require("fs");
const SourceS3 = new AWS.S3({
  endpoint: process.env.SOURCE_ENDPOINT,
  accessKeyId: process.env.SOURCE_KEY,
  secretAccessKey: process.env.SOURCE_SECRET,
  // BUCKET: process.env.SOURCE_BUCKET,
});

const TargetS3 = new AWS.S3({
  endpoint: process.env.TARGET_ENDPOINT,
  accessKeyId: process.env.TARGET_KEY,
  secretAccessKey: process.env.TARGET_SECRET,
  // BUCKET: process.env.TARGET_BUCKET,
});

// const ObjectsOnSource = [];
// const ObjectsOnDest = [];
let lastSourceKey;
let count = 0;

async function getSourceObjects() {
  try {
    const data = await SourceS3.listObjectsV2({
      Bucket: process.env.SOURCE_BUCKET,
      // MaxKeys: 10,
      StartAfter: lastSourceKey || undefined,
    }).promise();

    if (data.Contents.length == 0) return;

    lastSourceKey = data.Contents[data.Contents.length - 1].Key;
    count += data.Contents.length;

    let str = "";
    data.Contents.map((i) => {
      str += i.Key + "\n";
    });

    fs.appendFileSync("./sourceList.txt", str);
    console.log(`Last ${lastSourceKey} COUNT ${count}`);
    getSourceObjects();
  } catch (err) {
    console.log(err);
    setTimeout(() => getSourceObjects(), 1000);
  }
}

getSourceObjects();
