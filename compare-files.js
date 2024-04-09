const fs = require("fs");

let sourceList = fs.readFileSync("./sourceList.txt").toString().split("\n");
console.log("sourceList length", sourceList.length);
const sourceMap = new Map();
sourceList.forEach((i, idx) => {
  sourceMap.set(i, idx);
});
sourceList = [];

let destList = fs.readFileSync("./destList.txt").toString().split("\n");

console.log("destList length", destList.length);
const destMap = new Map();
destList.forEach((i, idx) => {
  destMap.set(i, idx);
});
destList = [];

let notExists = [];
sourceMap.forEach((value, key) => {
  const exists = destMap.get(key);
  if (!exists) notExists.push(key);
});

fs.writeFileSync("notExists.txt", notExists.toString());
