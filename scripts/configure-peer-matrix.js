const fs = require("fs");
const path = require("path");

const preset = process.argv[2];

if (!preset) {
  throw new Error("Usage: node scripts/configure-peer-matrix.js <lower|higher>");
}

const presetMap = {
  lower: {
    fastify: "4.29.1",
    mongodb: "6.19.0",
    pg: "8.19.0",
  },
  higher: {
    fastify: "5.6.0",
    mongodb: "7.0.0",
    pg: "8.19.0",
  },
};

const selectedPreset = presetMap[preset];

if (selectedPreset == null) {
  throw new Error(`Unsupported preset "${preset}"`);
}

const updates = [
  ["packages/spence-api/package.json", "devDependencies", "fastify", selectedPreset.fastify],
  ["packages/spence-api/package.json", "devDependencies", "mongodb", selectedPreset.mongodb],
  ["packages/spence-factories/package.json", "devDependencies", "mongodb", selectedPreset.mongodb],
  ["packages/spence-mongo-repos/package.json", "devDependencies", "mongodb", selectedPreset.mongodb],
  ["packages/spence-pg-repos/package.json", "devDependencies", "pg", selectedPreset.pg],
];

for (const [relativeFile, section, dependency, version] of updates) {
  const file = path.join(__dirname, "..", relativeFile);
  const pack = JSON.parse(fs.readFileSync(file, "utf8"));

  if (pack[section] == null || pack[section][dependency] == null) {
    throw new Error(`Missing ${section}.${dependency} in ${relativeFile}`);
  }

  pack[section][dependency] = version;
  fs.writeFileSync(file, `${JSON.stringify(pack, null, 2)}\n`);
}

process.stdout.write(`Configured ${preset} peer matrix preset\n`);
