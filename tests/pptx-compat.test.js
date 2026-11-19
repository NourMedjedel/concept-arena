import test from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import ExcelJS from "exceljs";
import { createSampleStudy } from "../web/data/sample-study.js";
import { createState, approveFinding } from "../web/model.js";
import { createDeck, presentationBuffer } from "../web/exports.js";

async function inspect(study) {
  const state = createState(study);
  approveFinding(study, state, "occasion");
  const deck = await JSZip.loadAsync(
    await presentationBuffer(createDeck(study, state)),
  );
  const chart = await deck
    .file(/^ppt\/charts\/chart\d+\.xml$/)[0]
    .async("string");
  const workbook = await JSZip.loadAsync(
    await deck.file(/^ppt\/embeddings\/[^/]+\.xlsx$/)[0].async("uint8array"),
  );
  return { chart, workbook, deck };
}
test("chart keeps its native data and a valid embedded spreadsheet range", async () => {
  const { chart, workbook, deck } = await inspect(createSampleStudy());
  const table = await workbook.file("xl/tables/table1.xml").async("string");
  assert.match(table, /\bref="A1:C4"/);
  const chartAxes = [
    ...chart
      .match(/<c:barChart>[\s\S]*?<\/c:barChart>/)[0]
      .matchAll(/<c:axId val="(\d+)"/g),
  ].map((m) => m[1]);
  assert.equal(chartAxes.length, 2);
  for (const id of chartAxes)
    assert.match(
      chart,
      new RegExp('<c:(?:catAx|valAx)>\\s*<c:axId val="' + id + '"'),
    );
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await workbook.generateAsync({ type: "nodebuffer" }));
  const sheet = wb.getWorksheet("Sheet1");
  assert.deepEqual(
    [2, 3, 4].map((r) => [
      sheet.getCell("B" + r).value,
      sheet.getCell("C" + r).value,
    ]),
    [
      [3, 7],
      [6, 2],
      [3, 3],
    ],
  );
  assert.match(
    await deck.file("ppt/slides/slide2.xml").async("string"),
    /<c:chart\b/,
  );
});
test("zero choices remain numeric zeros in the embedded chart workbook", async () => {
  const study = createSampleStudy();
  study.choices = study.choices.map((c) => ({ ...c, concept: "A" }));
  const { workbook } = await inspect(study);
  const xml = await workbook.file("xl/worksheets/sheet1.xml").async("string");
  assert.doesNotMatch(xml, /<v>\s*<\/v>/);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await workbook.generateAsync({ type: "nodebuffer" }));
  assert.equal(wb.getWorksheet("Sheet1").getCell("B3").value, 0);
  assert.equal(wb.getWorksheet("Sheet1").getCell("C4").value, 0);
});
