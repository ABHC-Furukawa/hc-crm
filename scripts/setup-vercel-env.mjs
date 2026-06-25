import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const envFile = join(root, "vercel-import.env");
const lines = readFileSync(envFile, "utf8").split(/\r?\n/);

for (const line of lines) {
  if (!line || line.startsWith("#")) continue;
  const idx = line.indexOf("=");
  if (idx < 1) continue;
  const name = line.slice(0, idx).trim();
  const value = line.slice(idx + 1);
  console.log(`Setting ${name}...`);
  for (const target of ["production", "preview", "development"]) {
    const result = spawnSync(
      "npx",
      ["vercel", "env", "add", name, target, "--value", value, "--yes", "--force"],
      { cwd: root, stdio: "inherit", shell: true }
    );
    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  }
}

console.log("Done. Run: npx vercel env ls");
