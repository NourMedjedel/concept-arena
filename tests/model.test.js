import test from "node:test";
import assert from "node:assert/strict";
import { createSampleStudy } from "../web/data/sample-study.js";
import {
  createState,
  preferenceCounts,
  themeCounts,
  visibleRows,
  buildFindings,
  approveFinding,
  applyCoding,
  validateStudy,
  validateSuggestion,
  effectiveRows,
} from "../web/model.js";
const fixture = () => {
  const s = createSampleStudy();
  return [s, createState(s)];
};
test("sample choices use explicit, distinct people across two occasions", () => {
  const [s] = fixture();
  assert.equal(s.responses.length, 96);
  assert.equal(s.choices.length, 24);
  assert.deepEqual(preferenceCounts(s, "personal"), {
    n: 12,
    counts: { A: 3, B: 6, C: 3 },
  });
  assert.deepEqual(preferenceCounts(s, "gift"), {
    n: 12,
    counts: { A: 7, B: 2, C: 3 },
  });
  assert.equal(validateStudy(s).participants.length, 12);
});
test("repeated mentions do not inflate a theme count; pending coding is excluded", () => {
  const [s] = fixture();
  const r = s.responses.find((r) => r.codes.includes("refill_clarity"));
  assert.equal(
    themeCounts([r, { ...r, id: "again" }]).find(
      (x) => x.id === "refill_clarity",
    ).n,
    1,
  );
  assert.equal(
    themeCounts([{ ...r, status: "needs_review" }]).find(
      (x) => x.id === "refill_clarity",
    ).n,
    0,
  );
});
test("phase and occasion filters retain only appropriate evidence", () => {
  const [s, st] = fixture();
  assert.ok(
    visibleRows(s, st).every(
      (r) => r.phase === "concept" && r.context !== "gift",
    ),
  );
  st.phase = "pack";
  assert.equal(visibleRows(s, st).length, 36);
  st.context = "gift";
  assert.ok(visibleRows(s, st).every((r) => r.phase === "pack"));
});
test("a correction invalidates the affected approval without changing explicit choices or source text", () => {
  const [s, st] = fixture();
  for (const f of buildFindings(s, st)) approveFinding(s, st, f.id);
  const before = structuredClone(s);
  const r = s.responses.find(
    (r) => r.codes.includes("refill_clarity") && r.stance === "concern",
  );
  applyCoding(s, st, r.id, {
    codes: ["value"],
    region: r.region,
    stance: r.stance,
  });
  const f = buildFindings(s, st);
  assert.equal(f.find((x) => x.id === "refill").status, "stale");
  assert.equal(f.find((x) => x.id === "occasion").status, "approved");
  assert.equal(f.find((x) => x.id === "practicality").status, "approved");
  assert.deepEqual(s, before);
  assert.equal(effectiveRows(s, st).find((x) => x.id === r.id).text, r.text);
});
test("editing recommendation requires review again", () => {
  const [s, st] = fixture();
  approveFinding(s, st, "refill");
  st.notes.refill = "Test the opening diagram with a fresh sample.";
  assert.equal(
    buildFindings(s, st).find((x) => x.id === "refill").status,
    "stale",
  );
  approveFinding(s, st, "refill", st.notes.refill);
  assert.equal(
    buildFindings(s, st).find((x) => x.id === "refill").status,
    "approved",
  );
});
test("ties and missing choices do not invent a single winning concept", () => {
  const [s, st] = fixture();
  s.choices = s.choices.filter(
    (x) => x.participant === "P01" || x.participant === "P09",
  );
  assert.match(
    buildFindings(s, st)[0].observation,
    /no single leading concept/,
  );
  s.choices = [];
  assert.match(buildFindings(s, st)[0].observation, /Not enough/);
});
test("invalid source IDs, choice links and duplicate people fail validation", () => {
  for (const mutate of [
    (s) => (s.responses[1].id = s.responses[0].id),
    (s) => (s.choices[0].responseId = "missing"),
    (s) => s.choices.push(s.choices[0]),
    (s) => (s.responses[0].text = ""),
    (s) => (s.responses[0].codes = ["invented"]),
    (s) => (s.choices[0].concept = "A"),
  ]) {
    const s = createSampleStudy();
    mutate(s);
    assert.throws(() => validateStudy(s));
  }
});
test("AI schema and exact excerpt checks reject unsupported outputs", () => {
  const text = "The refill is hard to understand.";
  const valid = {
    codes: ["refill_clarity"],
    region: "refill",
    stance: "concern",
    excerpt: "hard to understand",
    rationale: "A stated difficulty.",
  };
  assert.equal(validateSuggestion(valid, text).codes[0], "refill_clarity");
  assert.throws(() =>
    validateSuggestion({ ...valid, excerpt: "easy to use" }, text),
  );
  assert.throws(() =>
    validateSuggestion({ ...valid, codes: ["sales_lift"] }, text),
  );
  assert.throws(() => validateSuggestion({ ...valid, region: "eyes" }, text));
});
test("accepting a proposal still requires an explicit coding edit", () => {
  const [s, st] = fixture();
  const r = s.responses[0];
  const proposal = validateSuggestion(
    {
      codes: ["luxury"],
      region: "cap",
      stance: "positive",
      excerpt: r.text,
      rationale: "Example",
    },
    r.text,
  );
  assert.deepEqual(st.overrides, {});
  applyCoding(s, st, r.id, proposal);
  assert.deepEqual(st.overrides[r.id].codes, ["luxury"]);
});

test("reviewing unchanged coding does not invalidate the interpretation", () => {
  const [s, st] = fixture();
  approveFinding(s, st, "refill");
  const r = s.responses.find((r) => r.codes.includes("refill_clarity"));
  applyCoding(s, st, r.id, {
    codes: r.codes,
    region: r.region,
    stance: r.stance,
  });
  assert.equal(
    buildFindings(s, st).find((f) => f.id === "refill").status,
    "approved",
  );
});
