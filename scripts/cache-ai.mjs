import { writeFile } from "node:fs/promises";
import { createSampleStudy } from "../web/data/sample-study.js";
import { proposeCoding } from "./local-assist.mjs";
const study = createSampleStudy();
const rows = study.responses
  .filter(
    (r) => r.question === "reaction" && r.codes.includes("refill_clarity"),
  )
  .slice(0, 3);
const results = {};
for (const row of rows) {
  try {
    results[row.id] = await proposeCoding(row.text);
    console.log("Cached " + row.id + " with " + results[row.id].model);
  } catch (e) {
    console.log("No cached suggestion for " + row.id + ": " + e.message);
  }
}
await writeFile(
  "web/data/ai-cache.json",
  JSON.stringify(
    {
      createdAt: new Date().toISOString(),
      kind: "recorded-local-model-proposals",
      results,
    },
    null,
    2,
  ) + "\n",
);
