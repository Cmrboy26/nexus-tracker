import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const schemaUrl = process.env.OPENAPI_URL || "http://127.0.0.1:8000/openapi.json";
const generator = fileURLToPath(new URL("./bin/cli.js", import.meta.resolve("openapi-typescript/package.json")));
const output = fileURLToPath(new URL("../app/models/api.generated.ts", import.meta.url));

const result = spawnSync(process.execPath, [generator, schemaUrl, "-o", output, ...process.argv.slice(2)], {
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error);
}
process.exitCode = result.status ?? 1;