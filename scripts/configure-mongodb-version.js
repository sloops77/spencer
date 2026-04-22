const fs = require("fs");
const path = require("path");

const mongodbVersion = process.argv[2];

if (!mongodbVersion) {
  throw new Error("Usage: node scripts/configure-mongodb-version.js <mongodb-version>");
}

const rootPackageFile = path.join(__dirname, "..", "package.json");
const rootPackage = JSON.parse(fs.readFileSync(rootPackageFile, "utf8"));

rootPackage.pnpm = rootPackage.pnpm || {};
rootPackage.pnpm.overrides = rootPackage.pnpm.overrides || {};
rootPackage.pnpm.overrides.mongodb = mongodbVersion;

fs.writeFileSync(rootPackageFile, `${JSON.stringify(rootPackage, null, 2)}\n`);

process.stdout.write(`Configured mongodb compatibility version ${mongodbVersion}\n`);
