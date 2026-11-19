import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createSampleStudy } from "../web/data/sample-study.js";
import { createState, approveFinding } from "../web/model.js";
import { workbookBuffer, createDeck } from "../web/exports.js";
const s = createSampleStudy(),
  st = createState(s);
for (const id of ["occasion", "refill", "practicality"])
  approveFinding(s, st, id);
await mkdir("artifacts", { recursive: true });
await writeFile(
  "artifacts/concept-arena-evidence.xlsx",
  await workbookBuffer(s, st),
);
const images = Object.fromEntries(
  await Promise.all(
    s.concepts.map(async (c) => [
      c.id,
      "data:image/png;base64," +
        (await readFile("web/public/" + c.image)).toString("base64"),
    ]),
  ),
);
await createDeck(s, st, images).writeFile({
  fileName: "artifacts/concept-arena-study.pptx",
  compression: true,
});
console.log("Created editable XLSX and PPTX samples in artifacts/.");
