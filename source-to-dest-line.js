require("dotenv").config();
// const AWS = require("aws-sdk");
const fs = require("fs");
const Promise = require("bluebird");
const { SourceS3, SOURCE_BUCKET, TargetS3, TARGET_BUCKET } = require("./s3");
const readline = require("readline");
const events = require("events");
// const { targetMinio } = require("./minio");
// const util = require("util");
// const PutObject = util.promisify(targetMinio.putObject);

const TRANSFER_THREADS = parseInt(process.env.TRANSFER_THREADS);
if (!TRANSFER_THREADS) {
  console.log("TRANSFER_THREADS incorrect");
  process.exit(1);
}

let lastIdx = 0;
if (fs.existsSync("./lastIdx.txt")) {
  lastIdx = fs.readFileSync("./lastIdx.txt").toString();
  lastIdx = parseInt(lastIdx);
  if (!lastIdx) lastIdx = 0;
}
console.log("LastIdx,", lastIdx);

// let sourceList = fs.readFileSync("./sourceList.txt").toString().split("\n");
// console.log("totalLength", sourceList.length);
// const startIdx = 0;
// const endIdx = 1000000;
// sourceList = sourceList.slice(startIdx, endIdx);
const startIdx = 1000000;
const endIdx = 2000000;

let lineNumber = 0;
let sourceList = [];
(async function processLineByLine() {
  try {
    const rl = readline.createInterface({
      input: fs.createReadStream("./sourceList.txt"),
      crlfDelay: Infinity,
    });

    rl.on("line", (line) => {
      if (lineNumber >= startIdx && lineNumber <= endIdx) {
        sourceList.push(line);
      } else if (lineNumber > endIdx) {
        // console.log("over at ", lineNumber);
        rl.close();
      }
      // console.log(`Line from file: ${line}`);

      lineNumber++;
    });

    await events.once(rl, "close");

    console.log("Reading file line by line with readline done.");
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(
      `The script uses approximately ${Math.round(used * 100) / 100} MB`
    );
    console.log("start end", startIdx, endIdx, sourceList.length, lineNumber);
    doTask();
  } catch (err) {
    console.error(err);
  }
})();

async function doTask() {
  try {
    if (lastIdx > sourceList.length) {
      console.log("Done");
      process.exit(1);
    }
    const startTime = Date.now();
    const ListToTransfer = sourceList.slice(
      lastIdx,
      lastIdx + TRANSFER_THREADS * 5
    );
    // console.log("ListToTransfer", ListToTransfer.length);

    await Promise.map(
      ListToTransfer,
      async (item) => {
        if (item == "") return;
        const sourceFile = await SourceS3.getObject({
          Bucket: SOURCE_BUCKET,
          Key: item,
        }).promise();
        await TargetS3.putObject({
          Bucket: TARGET_BUCKET,
          Key: item,
          Body: sourceFile.Body,
        }).promise();
        // await PutObject(TARGET_BUCKET, item, sourceFile.Body);
        // await targetMinio.putObject(TARGET_BUCKET, item, sourceFile.Body);
        // await fs.promises.writeFile(`imgs/${item}`, sourceFile.Body);
      },
      { concurrency: TRANSFER_THREADS }
    );
    lastIdx += ListToTransfer.length;
    fs.writeFileSync("./lastIdx.txt", lastIdx.toString());
    console.log(`Last ${lastIdx}, took: ${Date.now() - startTime}ms`);
    doTask();
  } catch (err) {
    console.log(err);
    setTimeout(() => doTask(), 1000);
  }
}
