const fs = require("fs");
const path = require("path");

const knexVersion = process.argv[2];

if (!knexVersion) {
  throw new Error("Usage: node scripts/configure-knex-version.js <knex-version>");
}

const rootPackageFile = path.join(__dirname, "..", "package.json");
const rootPackage = JSON.parse(fs.readFileSync(rootPackageFile, "utf8"));

rootPackage.pnpm = rootPackage.pnpm || {};
rootPackage.pnpm.overrides = rootPackage.pnpm.overrides || {};
rootPackage.pnpm.overrides.knex = knexVersion;

fs.writeFileSync(rootPackageFile, `${JSON.stringify(rootPackage, null, 2)}\n`);

process.stdout.write(`Configured knex compatibility version ${knexVersion}\n`);
