import process from "node:process";
import fs from "node:fs";
import path from "node:path";
import pluralize from "pluralize";
import * as common from "./common.ts";

const pwd = process.cwd();
const publicDir = path.join(pwd, "locales");

function determineRule(key: string) {
  if (key.includes("WithCount_plural")) {
    return 0;
  }
  if (key.includes("WithCount")) {
    return 1;
  }
  if (key.includes("_plural")) {
    return 2;
  }
  return 3;
}

function updateFile(fileName: string) {
  const file = JSON.parse(fs.readFileSync(fileName).toString());
  const updatedFile = {};

  const keys = Object.keys(file);

  let originalKey: string;

  for (let i = 0; i < keys.length; i++) {
    if (file[keys[i]] === "") {
      // follow i18next rules
      // "key": "item",
      // "key_plural": "items",
      // "keyWithCount": "{{count}} item",
      // "keyWithCount_plural": "{{count}} items"
      switch (determineRule(keys[i])) {
        case 0:
          [originalKey] = keys[i].split("WithCount_plural");
          updatedFile[keys[i]] = `{{count}} ${pluralize(originalKey)}`;
          break;
        case 1:
          [originalKey] = keys[i].split("WithCount");
          updatedFile[keys[i]] = `{{count}} ${originalKey}`;
          break;
        case 2:
          [originalKey] = keys[i].split("_plural");
          updatedFile[keys[i]] = pluralize(originalKey);
          break;
        default:
          updatedFile[keys[i]] = keys[i];
      }
    } else {
      updatedFile[keys[i]] = file[keys[i]];
    }
  }

  fs.promises
    .writeFile(fileName, JSON.stringify(updatedFile, null, 2))
    .catch((e) => console.error(fileName, e));
}

function processLocalesFolder(filePath: string) {
  if (path.basename(filePath) === "en") {
    common.parseFolder(filePath, updateFile);
  }
}

console.log("Setting EN defaults...");
common.parseFolder(publicDir, processLocalesFolder);
console.log("Done");
