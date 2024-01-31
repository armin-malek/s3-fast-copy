require("dotenv").config();
const AWS = require("aws-sdk");
const fs = require("fs");
const Promise = require("bluebird");
const SourceS3 = new AWS.S3({
  endpoint: process.env.SOURCE_ENDPOINT,
  accessKeyId: process.env.SOURCE_KEY,
  secretAccessKey: process.env.SOURCE_SECRET,
  // BUCKET: process.env.SOURCE_BUCKET,
});
const SOURCE_BUCKET = process.env.SOURCE_BUCKET;

const TargetS3 = new AWS.S3({
  endpoint: process.env.TARGET_ENDPOINT,
  accessKeyId: process.env.TARGET_KEY,
  secretAccessKey: process.env.TARGET_SECRET,
  // BUCKET: process.env.TARGET_BUCKET,
});
const TARGET_BUCKET = process.env.TARGET_BUCKET;

const TRANSFER_THREADS = parseInt(process.env.TRANSFER_THREADS);
if (!TRANSFER_THREADS) {
  console.log("TRANSFER_THREADS incorrect");
  process.exit(1);
}

let sourceList = fs.readFileSync("./sourceList.txt").toString().split("\n");

let lastIdx = 0;
if (fs.existsSync("./lastIdx.txt")) {
  lastIdx = fs.readFileSync("./lastIdx.txt").toString();
  lastIdx = parseInt(lastIdx);
  if (!lastIdx) lastIdx = 0;
}
console.log("List Length,", sourceList.length);
console.log("LastIdx,", lastIdx);

async function doTask() {
  try {
    const ListToTransfer = sourceList.slice(
      lastIdx,
      lastIdx + TRANSFER_THREADS * 5
    );
    console.log("ListToTransfer", ListToTransfer);

    await Promise.map(
      ListToTransfer,
      async (item) => {
        if (item == "") return;
        const sourceFile = await SourceS3.getObject({
          Bucket: SOURCE_BUCKET,
          Key: item,
        }).promise();

        // await TargetS3.putObject({
        //   Bucket: TARGET_BUCKET,
        //   Key: item,
        //   Body: sourceFile.Body,
        // }).promise();
        await fs.promises.writeFile(`imgs/${item}`, sourceFile.Body);
      },
      { concurrency: TRANSFER_THREADS }
    );
    lastIdx += ListToTransfer.length;
    fs.writeFileSync("./lastIdx.txt", lastIdx.toString());
    console.log(`Last ${lastIdx}`);
    doTask();
  } catch (err) {
    console.log(err);
    setTimeout(() => doTask(), 1000);
  }
}

doTask();
