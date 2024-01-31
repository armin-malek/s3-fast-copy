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

const TRANSFER_THREADS = parseInt(process.env.TRANSFER_THREADS);
if (!TRANSFER_THREADS) {
  console.log("TRANSFER_THREADS incorrect");
  process.exit(1);
}

if (!fs.existsSync("./imgs")) {
  console.log("no filder");
  fs.mkdirSync("./imgs");
}

let sourceList = fs.readFileSync("./sourceList.txt").toString().split("\n");

let lastIdx = 0;
if (fs.existsSync("./lastIdx-download.txt")) {
  lastIdx = fs.readFileSync("./lastIdx-download.txt").toString();
  lastIdx = parseInt(lastIdx);
  if (!lastIdx) lastIdx = 0;
}
console.log("List Length,", sourceList.length);
console.log("LastIdx,", lastIdx);
console.log("TRANSFER_THREADS", TRANSFER_THREADS);

async function doTask() {
  try {
    const startTime = Date.now();
    const ListToTransfer = sourceList.slice(
      lastIdx,
      lastIdx + TRANSFER_THREADS * 5
    );

    await Promise.map(
      ListToTransfer,
      async (item) => {
        if (item == "") return;
        const sourceFile = await SourceS3.getObject({
          Bucket: SOURCE_BUCKET,
          Key: item,
        }).promise();

        await fs.promises.writeFile(`imgs/${item}`, sourceFile.Body);
      },
      { concurrency: TRANSFER_THREADS }
    );
    lastIdx += ListToTransfer.length;
    fs.writeFileSync("./lastIdx-download.txt", lastIdx.toString());
    let took = Date.now() - startTime;
    console.log(
      `Last ${lastIdx} | took ${took}ms | PerItem ${Math.round(
        took / (TRANSFER_THREADS * 5)
      )}`
    );
    doTask();
  } catch (err) {
    console.log(err);
    setTimeout(() => doTask(), 1000);
  }
}

doTask();
