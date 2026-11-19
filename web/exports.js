export { presentationBuffer } from "./pptx-compat.js";
import ExcelJS from "exceljs";
import { guardWorkbook } from "./workbook-guard.js";
import pptxgen from "pptxgenjs";
import { codebook, createSampleStudy } from "./data/sample-study.js";
import {
  effectiveRows,
  preferenceCounts,
  buildFindings,
  validateStudy,
  studyFingerprint,
} from "./model.js";
const columns = [
  "id",
  "participant",
  "concept",
  "question",
  "context",
  "phase",
  "language",
  "text",
  "codes",
  "region",
  "stance",
  "status",
];
function plain(value) {
  if (value == null) return "";
  if (typeof value === "object") {
    if ("formula" in value || "sharedFormula" in value)
      throw Error("Use plain values, not formulas, in study sheets.");
    if (value.richText) return value.richText.map((x) => x.text).join("");
    if (value.text) return value.text;
    throw Error("Use plain text cells in the study sheets.");
  }
  return String(value).trim();
}
const normalize = (s) => s.toLowerCase().replace(/[^a-z]/g, "");
const aliases = {
  responseid: "id",
  participantid: "participant",
  conceptid: "concept",
  occasion: "context",
  exposurephase: "phase",
  response: "text",
  themes: "codes",
  sourceid: "responseId",
  responseidchoice: "responseId",
};
function records(sheet, required, choice = false) {
  if (!sheet)
    throw Error("Missing " + (choice ? "Choices" : "Responses") + " sheet.");
  if (sheet.columnCount > 32)
    throw Error("Use at most 32 columns per study sheet.");
  if (sheet.rowCount > 5001)
    throw Error("Each input sheet may contain at most 5,000 data rows.");
  const headers = sheet
    .getRow(1)
    .values.slice(1)
    .map((v) => {
      const k = normalize(plain(v));
      return choice && k === "responseid"
        ? "responseId"
        : Object.hasOwn(aliases, k)
          ? aliases[k]
          : k;
    });
  if (required.some((k) => !headers.includes(k)))
    throw Error(sheet.name + " needs columns: " + required.join(", ") + ".");
  if (
    headers.some((k) => ["constructor", "prototype", "__proto__"].includes(k))
  )
    throw Error("Reserved column names are not supported.");
  const present = headers.filter(Boolean);
  if (new Set(present).size !== present.length)
    throw Error("Use unique column names in each sheet.");
  const rows = [];
  sheet.eachRow((row, i) => {
    if (i === 1) return;
    const item = Object.create(null);
    headers.forEach((key, j) => {
      if (key) item[key] = plain(row.getCell(j + 1).value);
    });
    if (Object.values(item).some(Boolean))
      rows.push({ ...item, source: { sheet: sheet.name, row: i } });
  });
  return rows;
}
export async function readStudy(buffer) {
  if (buffer.byteLength > 4 * 1024 * 1024)
    throw Error("Please use a workbook smaller than 4 MB.");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await guardWorkbook(buffer));
  const responses = records(
    wb.getWorksheet("Responses"),
    columns.filter((k) => k !== "status"),
  ).map((r) => ({
    ...r,
    codes: r.codes
      .split(/[;,]/)
      .map((x) => x.trim())
      .filter(Boolean),
    status: r.status || "needs_review",
  }));
  const choices = records(
    wb.getWorksheet("Choices"),
    ["participant", "context", "concept", "responseId"],
    true,
  );
  const base = createSampleStudy();
  const participantsSheet = wb.getWorksheet("Participants");
  const participants = participantsSheet
    ? records(participantsSheet, ["id"]).map((p) => ({
        id: p.id,
        language: p.language,
        routine: p.routine?.slice(0, 120),
      }))
    : [];
  return validateStudy({
    ...base,
    id: "import-" + Date.now(),
    title: "Imported lip-colour study",
    synthetic: false,
    participants,
    responses,
    choices,
    meta: {
      ...base.meta,
      source: "Imported workbook; research provenance supplied by uploader",
      analysis: "Imported coding; review before publishing",
    },
  });
}
function sheet(wb, name, keys, data, widths = {}) {
  const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = keys.map((key) => ({
    header: key,
    key,
    width: widths[key] || 20,
  }));
  for (const item of data)
    ws.addRow(
      Object.fromEntries(
        keys.map((key) => [
          key,
          Array.isArray(item[key]) ? item[key].join("; ") : (item[key] ?? ""),
        ]),
      ),
    );
  ws.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF35232E" },
    };
    cell.font = { bold: true, color: { argb: "FFF8F4ED" } };
    cell.alignment = { vertical: "middle" };
  });
  ws.getRow(1).height = 26;
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: keys.length },
  };
  ws.eachRow((row, i) => {
    if (i > 1) {
      row.alignment = { vertical: "top", wrapText: true };
      row.font = { name: "Aptos", size: 11 };
      if (i % 2 === 0)
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF5F1EC" },
          };
        });
    }
  });
  return ws;
}
export async function workbookBuffer(study, state) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ConceptArena";
  wb.subject = study.synthetic
    ? "Synthetic demonstration study"
    : "User-imported study";
  sheet(wb, "Responses", columns, effectiveRows(study, state), { text: 80 });
  sheet(
    wb,
    "Choices",
    ["participant", "context", "concept", "responseId"],
    study.choices,
  );
  sheet(wb, "Participants", ["id", "language", "routine"], study.participants);
  sheet(
    wb,
    "Codebook",
    ["code", "label", "description"],
    Object.entries(codebook).map(([code, x]) => ({ code, ...x })),
    { description: 85 },
  );
  sheet(
    wb,
    "Findings",
    ["id", "status", "observation", "interpretation", "support", "counter"],
    buildFindings(study, state).map((f) => ({
      ...f,
      support: f.support.map((r) => r.id),
      counter: f.counter.map((r) => r.id),
    })),
    { observation: 70, interpretation: 75, support: 40, counter: 40 },
  );
  sheet(
    wb,
    "Read me",
    ["field", "value"],
    [
      { field: "Data provenance", value: study.meta.source },
      { field: "Study fingerprint", value: studyFingerprint(study) },
      { field: "Coding", value: study.meta.analysis },
      {
        field: "Counting",
        value:
          "Distinct participant IDs per theme; explicit choices only for preference. No weighting or significance testing.",
      },
      {
        field: "Scope",
        value:
          "Three fictional refillable lip-colour cases; same formula, shade and stated price. Packaging/communication varies.",
      },
      {
        field: "Limit",
        value:
          "Qualitative exploratory study. Renders do not establish physical performance or forecast sales.",
      },
    ],
    { value: 110 },
  );
  return wb.xlsx.writeBuffer();
}
export function exportableFindings(study, state) {
  const findings = buildFindings(study, state);
  if (!findings.some((f) => f.status === "approved"))
    throw Error(
      "Approve at least one finding before creating the presentation.",
    );
  return findings.filter((f) => f.status === "approved");
}
export function createDeck(study, state, images = {}) {
  const approved = exportableFindings(study, state),
    pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "ConceptArena";
  pptx.subject = study.synthetic
    ? "Synthetic luxury beauty research demonstration"
    : "Qualitative concept research";
  pptx.title = study.title;
  pptx.company = "Independent portfolio demo";
  pptx.lang = "en-GB";
  pptx.theme = {
    headFontFace: "Georgia",
    bodyFontFace: "Aptos",
    lang: "en-GB",
  };
  const ink = "32252E",
    plum = "634551",
    cream = "F8F5EF",
    muted = "746B6C",
    line = "DCD3CF";
  let page = 0;
  const text = (s, t, x, y, w, h, size = 20, extra = {}) =>
    s.addText(t, {
      x,
      y,
      w,
      h,
      fontSize: size,
      color: ink,
      fontFace: "Aptos",
      margin: 0,
      breakLine: false,
      fit: "shrink",
      ...extra,
    });
  function slide(kicker, title) {
    const s = pptx.addSlide();
    s.background = { color: cream };
    text(s, kicker.toUpperCase(), 0.7, 0.42, 11, 0.3, 11, {
      charSpacing: 2,
      color: plum,
    });
    text(s, title, 0.7, 0.95, 11.8, 0.85, 32, { fontFace: "Georgia" });
    s.addShape(pptx.ShapeType.line, {
      x: 0.7,
      y: 6.96,
      w: 11.9,
      h: 0,
      line: { color: line, width: 0.6 },
    });
    text(
      s,
      (study.synthetic ? "SYNTHETIC DEMO DATA" : "IMPORTED STUDY") +
        "  ·  ConceptArena  ·  " +
        studyFingerprint(study),
      0.7,
      7.08,
      10,
      0.18,
      9,
      { color: muted },
    );
    text(s, String(++page), 12, 7.06, 0.6, 0.2, 10, {
      align: "right",
      color: muted,
    });
    return s;
  }
  let s = slide("Concept study / 01", study.title);
  text(s, "Three cases. One formula. Two occasions.", 0.7, 2.1, 10, 0.6, 28, {
    fontFace: "Georgia",
    color: plum,
  });
  text(
    s,
    study.participants.length +
      " participants  ·  " +
      study.responses.length +
      " responses  ·  Languages: " +
      [...new Set(study.responses.map((r) => r.language.toUpperCase()))].join(
        " / ",
      ),
    0.7,
    3.05,
    11,
    0.4,
    20,
  );
  text(
    s,
    "Same formula, shade, stated price and refill function. We compare reactions to packaging and communication, with personal purchase and gifting asked separately.",
    0.7,
    3.95,
    10.8,
    1,
    23,
  );
  text(
    s,
    "Exploratory qualitative evidence; no representative market estimate, sales prediction or physical-use claim.",
    0.7,
    5.55,
    10.8,
    0.7,
    18,
    { color: muted },
  );
  s.addNotes(
    study.meta.source +
      "\n" +
      study.meta.analysis +
      "\nOnly currently approved interpretations are included. Draft and stale findings are excluded.",
  );
  if (study.concepts.every((c) => images[c.id])) {
    s = slide(
      "The concepts / illustrated",
      "Three expressions of the same idea",
    );
    study.concepts.forEach((c, i) => {
      const x = 0.7 + i * 4.05;
      s.addImage({ data: images[c.id], x, y: 2, w: 3.8, h: 3.8 });
      text(s, c.id + " / " + c.name, x, 6.02, 3.8, 0.35, 22, {
        fontFace: "Georgia",
      });
      text(s, c.finish, x, 6.45, 3.8, 0.22, 12, { color: muted });
    });
    s.addNotes(
      "Original AI-generated fictional packaging illustrations. Same formula, shade, stated price and refill function. These renders are not tested physical prototypes.",
    );
  }
  s = slide("Explicit choices", "The occasion matters");
  const p = preferenceCounts(study, "personal"),
    g = preferenceCounts(study, "gift");
  s.addChart(
    pptx.ChartType.bar,
    [
      {
        name: "For myself (n=" + p.n + ")",
        labels: study.concepts.map((c) => c.name),
        values: study.concepts.map((c) => p.counts[c.id]),
      },
      {
        name: "As a gift (n=" + g.n + ")",
        labels: study.concepts.map((c) => c.name),
        values: study.concepts.map((c) => g.counts[c.id]),
      },
    ],
    {
      x: 0.7,
      y: 2,
      w: 11.7,
      h: 3.9,
      barDir: "col",
      grouping: "clustered",
      catAxisLabelFontSize: 18,
      valAxisLabelFontSize: 13,
      showLegend: true,
      legendFontSize: 14,
      showValue: true,
      dataLabelPosition: "outEnd",
      chartColors: [plum, "B6A18A"],
      showTitle: false,
      showBorder: false,
      showCatName: false,
      valAxisMinVal: 0,
      valAxisMajorUnit: Math.max(1, Math.ceil(Math.max(p.n, g.n) / 6)),
      showShadow: false,
    },
  );
  text(
    s,
    "Counts are distinct participants, not mentions. These are explicit choices after the full concept was shown.",
    0.8,
    6.2,
    11.5,
    0.45,
    16,
    { color: muted },
  );
  s.addNotes(
    study.choices
      .map(
        (c) =>
          c.participant +
          " / " +
          c.context +
          " / " +
          c.concept +
          " / " +
          c.responseId,
      )
      .join("\n"),
  );
  for (const f of approved) {
    s = slide("Reviewed finding / " + f.id, f.title);
    text(s, "OBSERVATION", 0.7, 2, 5, 0.3, 11, {
      color: plum,
      charSpacing: 1.8,
    });
    text(s, f.observation, 0.7, 2.5, 5.35, 1.1, 24);
    text(s, "RECOMMENDATION", 0.7, 4.05, 5, 0.3, 11, {
      color: plum,
      charSpacing: 1.8,
    });
    text(s, f.interpretation, 0.7, 4.55, 5.35, 1.5, 22);
    const quote = (r, y, label) => {
      text(s, label, 6.7, y, 5.5, 0.25, 11, { color: plum, charSpacing: 1.2 });
      text(
        s,
        r
          ? "“" + r.text + "”"
          : "No counterexample coded in the current dataset.",
        6.7,
        y + 0.4,
        5.5,
        1.05,
        19,
        { italic: true },
      );
      if (r)
        text(
          s,
          r.participant +
            " · " +
            r.id +
            " · " +
            r.source.sheet +
            "!" +
            r.source.row,
          6.7,
          y + 1.5,
          5.5,
          0.3,
          11,
          { color: muted },
        );
    };
    quote(f.support[0], 2, "SUPPORTING RESPONSE");
    quote(f.counter[0], 4.25, "COUNTEREXAMPLE / LIMIT");
    s.addNotes(
      "Finding status: approved\nSupport:\n" +
        f.support
          .map(
            (r) =>
              r.id +
              " / " +
              r.participant +
              " / " +
              r.source.sheet +
              "!" +
              r.source.row +
              " / " +
              r.text,
          )
          .join("\n") +
        "\nCounterevidence:\n" +
        f.counter.map((r) => r.id + " / " + r.text).join("\n"),
    );
  }
  s = slide("Next test / untested", "A clearer refill story");
  text(s, "Proposed stimulus v2 — not evaluated", 0.7, 2.1, 11, 0.5, 26, {
    fontFace: "Georgia",
    color: plum,
  });
  text(
    s,
    "Add an opening diagram and a clear view of the refill interface. Preserve the formula, price and core claim so the communication change can be examined.",
    0.7,
    3.1,
    10.6,
    1.1,
    24,
  );
  text(
    s,
    "Next study: ask participants to explain the mechanism in their own words, then perform a physical handling task. Capture confusion and contradictory responses, not just preference.",
    0.7,
    4.65,
    10.6,
    1.1,
    22,
  );
  s.addNotes(
    "This is an untested research recommendation. No lift, preference change or market performance has been estimated.",
  );
  return pptx;
}
export function downloadBytes(bytes, name, type) {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
