import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import JSZip from "jszip";
import { escapeHTML } from "../web/text.js";
import { guardWorkbook } from "../web/workbook-guard.js";
import { createAssistHandler } from "../scripts/local-assist.mjs";
import { createSampleStudy } from "../web/data/sample-study.js";
import { createState, applyCoding, effectiveRows } from "../web/model.js";
import { workbookBuffer, readStudy } from "../web/exports.js";
const validHeaders = {
  host: "127.0.0.1:8789",
  origin: "http://127.0.0.1:8789",
  "content-type": "application/json",
};
async function request(
  handler,
  {
    headers = {},
    body = JSON.stringify({ text: "A small case." }),
    method = "POST",
  } = {},
) {
  const req = Readable.from([Buffer.from(body)]);
  req.headers = { ...validHeaders, ...headers };
  req.method = method;
  const res = {
    statusCode: 200,
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    end(v) {
      this.body = v;
    },
  };
  await handler(req, res);
  return res;
}
test("only same-origin JSON POSTs can invoke the local model", async () => {
  let calls = 0;
  const handler = createAssistHandler({
    infer: async () => {
      calls++;
      return { ok: true };
    },
  });
  for (const options of [
    { method: "GET" },
    { headers: { origin: undefined } },
    { headers: { origin: "https://evil.example" } },
    { headers: { origin: "http://localhost:9999" } },
    { headers: { host: "evil.example", origin: "http://evil.example" } },
    { headers: { "content-type": "text/plain" } },
  ])
    assert.notEqual((await request(handler, options)).statusCode, 200);
  assert.equal(calls, 0);
  assert.equal((await request(handler)).statusCode, 200);
  assert.equal(calls, 1);
});
test("request limits and rate limits run before inference", async () => {
  let calls = 0;
  const handler = createAssistHandler({
    infer: async () => {
      calls++;
      return {};
    },
  });
  assert.equal(
    (await request(handler, { body: " ".repeat(12001) })).statusCode,
    413,
  );
  assert.equal(
    (
      await request(handler, {
        body: JSON.stringify({ text: "x".repeat(4001) }),
      })
    ).statusCode,
    400,
  );
  for (let i = 0; i < 3; i++) await request(handler);
  assert.equal((await request(handler)).statusCode, 429);
  assert.equal(calls, 3);
});
test("one pending request prevents concurrent model workloads", async () => {
  let finish;
  const handler = createAssistHandler({
    infer: () => new Promise((resolve) => (finish = resolve)),
  });
  const first = request(handler);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal((await request(handler)).statusCode, 429);
  finish({});
  assert.equal((await first).statusCode, 200);
});
test("HTML-like source text and IDs are escaped for the page", () => {
  const hostile = '<img src=x onerror="alert(1)">';
  assert.equal(
    escapeHTML(hostile),
    "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
  );
  assert.equal(escapeHTML("'&"), "&#39;&amp;");
});
test("reserved response IDs cannot modify state prototypes", () => {
  const study = createSampleStudy();
  study.responses[0].id = "__proto__";
  const state = createState(study);
  applyCoding(study, state, "__proto__", {
    codes: ["luxury"],
    region: "cap",
    stance: "positive",
  });
  assert.equal(Object.getPrototypeOf(state.overrides), null);
  assert.equal(Object.prototype.codes, undefined);
  assert.deepEqual(
    effectiveRows(study, state)[1].codes,
    study.responses[1].codes,
  );
});
async function base() {
  const s = createSampleStudy();
  return JSZip.loadAsync(await workbookBuffer(s, createState(s)));
}
const bytes = (zip) =>
  zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
test("compressed bombs are stopped by the expanded-size limit", async () => {
  const zip = await base();
  zip.file("huge.xml", "x".repeat(4 * 1024 * 1024 + 1));
  const b = await bytes(zip);
  await assert.rejects(() => guardWorkbook(b), /expanded workbook/);
});
test("macro objects, external links and XML entities are rejected", async () => {
  for (const [name, content, pattern] of [
    ["xl/vbaProject.bin", "bad", /macros/],
    [
      "xl/externalLinks/_rels/externalLink1.xml.rels",
      '<Relationships><Relationship TargetMode="External" Target="https://evil.example"/></Relationships>',
      /external links/,
    ],
    ["xl/entities.xml", '<!DOCTYPE x [<!ENTITY e "bad">]><x/>', /entity/],
  ]) {
    const zip = await base();
    zip.file(name, content);
    const b = await bytes(zip);
    await assert.rejects(() => guardWorkbook(b), pattern);
  }
});
test("excessive ZIP entries and sparse out-of-range cells are rejected before ExcelJS", async () => {
  let zip = await base();
  for (let i = 0; i < 129; i++) zip.file("extra" + i + ".xml", "<x/>");
  const crowded = await bytes(zip);
  await assert.rejects(() => guardWorkbook(crowded), /too many/);
  zip = await base();
  const name = "xl/worksheets/sheet1.xml";
  zip.file(
    name,
    (await zip.file(name).async("string")).replace('r="A1"', 'r="XFD1048576"'),
  );
  const b = await bytes(zip);
  await assert.rejects(() => guardWorkbook(b), /32 columns/);
});
test("formula-like text stays a string in exported workbooks", async () => {
  const s = createSampleStudy();
  s.responses[0].text = '=HYPERLINK("https://evil.example", "click")';
  const roundtrip = await readStudy(await workbookBuffer(s, createState(s)));
  assert.equal(roundtrip.responses[0].text, s.responses[0].text);
});

test("alternate XML quotes and encoded cell addresses cannot bypass size limits", async () => {
  for (const address of ["r='XFD1048576'", 'r="XFD&#49;048576"']) {
    const zip = await base(),
      name = "xl/worksheets/sheet1.xml";
    zip.file(
      name,
      (await zip.file(name).async("string")).replace('r="A1"', address),
    );
    const b = await bytes(zip);
    await assert.rejects(() => guardWorkbook(b), /32 columns/);
  }
});
