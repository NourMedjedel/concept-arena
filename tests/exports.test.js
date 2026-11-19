import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { createSampleStudy } from "../web/data/sample-study.js";
import {
  createState,
  approveFinding,
  applyCoding,
  preferenceCounts,
} from "../web/model.js";
import {
  workbookBuffer,
  readStudy,
  createDeck,
  exportableFindings,
  presentationBuffer,
} from "../web/exports.js";
test("XLSX roundtrip preserves source IDs, choices and response text", async () => {
  const s = createSampleStudy(),
    st = createState(s);
  const buffer = await workbookBuffer(s, st);
  const imported = await readStudy(buffer);
  assert.equal(imported.responses.length, 96);
  assert.deepEqual(
    imported.choices.map(({ source, ...r }) => r),
    s.choices,
  );
  assert.deepEqual(preferenceCounts(imported, "gift"), {
    n: 12,
    counts: { A: 7, B: 2, C: 3 },
  });
  assert.equal(imported.responses[25].text, s.responses[25].text);
  assert.equal(imported.responses[25].source.row, 27);
});
test("workbook formula cells are rejected rather than silently evaluated", async () => {
  const s = createSampleStudy(),
    st = createState(s);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await workbookBuffer(s, st));
  wb.getWorksheet("Responses").getCell("H2").value = {
    formula: "1+1",
    result: 2,
  };
  const bytes = await wb.xlsx.writeBuffer();
  await assert.rejects(() => readStudy(bytes), /plain values/);
});
test("stale interpretations cannot enter the deck", () => {
  const s = createSampleStudy(),
    st = createState(s);
  assert.throws(() => createDeck(s, st), /Approve/);
  approveFinding(s, st, "refill");
  assert.equal(exportableFindings(s, st).length, 1);
  const r = s.responses.find((r) => r.codes.includes("refill_clarity"));
  applyCoding(s, st, r.id, {
    codes: ["value"],
    region: r.region,
    stance: r.stance,
  });
  assert.throws(() => createDeck(s, st), /Approve/);
});
test("reviewed presentation generates a real editable PPTX", async () => {
  const s = createSampleStudy(),
    st = createState(s);
  for (const id of ["occasion", "refill", "practicality"])
    approveFinding(s, st, id);
  const pptx = createDeck(s, st);
  const buffer = Buffer.from(await presentationBuffer(pptx));
  assert.ok(buffer.length > 10000);
  assert.equal(buffer.subarray(0, 2).toString(), "PK");
  assert.equal(pptx._slides.length, 6);
});
