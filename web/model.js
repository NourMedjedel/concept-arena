import { codebook, regions } from "./data/sample-study.js";
export const contexts = { personal: "For myself", gift: "As a gift" };
export function unique(items) {
  return [...new Set(items)];
}
export function createState(study) {
  return {
    context: "personal",
    phase: "concept",
    overrides: {},
    approvals: {},
    revision: 0,
    notes: {},
    selectedConcept: "A",
    selectedParticipant: study.participants[0]?.id,
  };
}
export function effectiveRows(study, state) {
  return study.responses.map((r) => ({
    ...r,
    ...state.overrides[r.id],
    source: r.source,
    text: r.text,
  }));
}
export function visibleRows(
  study,
  state,
  { concept, region, participant } = {},
) {
  return effectiveRows(study, state).filter(
    (r) =>
      (!concept || r.concept === concept) &&
      (!region || r.region === region) &&
      (!participant || r.participant === participant) &&
      (state.phase === "all" || r.phase === state.phase) &&
      (r.context === "general" || r.context === state.context),
  );
}
export function preferenceCounts(study, context) {
  const choices = study.choices.filter((r) => r.context === context);
  const n = unique(choices.map((r) => r.participant)).length;
  return {
    n,
    counts: Object.fromEntries(
      study.concepts.map((c) => [
        c.id,
        unique(
          choices.filter((r) => r.concept === c.id).map((r) => r.participant),
        ).length,
      ]),
    ),
  };
}
export function themeCounts(rows) {
  return Object.keys(codebook)
    .map((id) => ({
      id,
      label: codebook[id].label,
      n: unique(
        rows
          .filter((r) => r.status !== "needs_review" && r.codes.includes(id))
          .map((r) => r.participant),
      ).length,
    }))
    .sort((a, b) => b.n - a.n);
}
export function fingerprint(value) {
  let h = 2166136261;
  for (const c of JSON.stringify(value)) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
export function studyFingerprint(study) {
  return fingerprint([
    study.id,
    study.responses.map((r) => [r.id, r.text]),
    study.choices,
  ]);
}
function evidenceFingerprint(rows) {
  return fingerprint(
    rows
      .map((r) => [r.id, r.codes, r.stance])
      .sort((a, b) => a[0].localeCompare(b[0])),
  );
}
export function buildFindings(study, state) {
  const rows = effectiveRows(study, state).filter(
    (r) => r.phase === "concept" && r.status !== "needs_review",
  );
  const countsPersonal = preferenceCounts(study, "personal");
  const countsGift = preferenceCounts(study, "gift");
  const leader = (counts) => {
    const max = Math.max(...Object.values(counts));
    const ids = Object.keys(counts).filter((k) => counts[k] === max);
    return [ids.length === 1 && max > 0 ? ids[0] : null, max];
  };
  const p = leader(countsPersonal.counts),
    g = leader(countsGift.counts);
  const name = (id) => study.concepts.find((c) => c.id === id)?.name || id;
  const concerned = (theme) =>
    rows.filter(
      (r) => r.codes.includes(theme) && ["concern", "mixed"].includes(r.stance),
    );
  const positive = (theme) =>
    rows.filter((r) => r.codes.includes(theme) && r.stance === "positive");
  const refill = concerned("refill_clarity"),
    practical = concerned("portability");
  const findings = [
    {
      id: "occasion",
      title:
        !p[0] || !g[0]
          ? "Compare choices by occasion"
          : p[0] === g[0]
            ? "The same concept leads in both occasions"
            : "The occasion changes the preferred concept",
      observation:
        countsPersonal.n && countsGift.n
          ? (p[0]
              ? name(p[0]) +
                " is selected by " +
                p[1] +
                "/" +
                countsPersonal.n +
                " for personal use"
              : "Personal use has no single leading concept") +
            "; " +
            (g[0]
              ? name(g[0]) +
                " by " +
                g[1] +
                "/" +
                countsGift.n +
                " for gifting."
              : "gifting has no single leading concept.")
          : "Not enough explicit choice data to compare occasions.",
      interpretation:
        "Explore personal purchase and gifting as separate decisions in the next study.",
      support: rows.filter(
        (r) =>
          r.question === "choice_reason" &&
          ((r.context === "personal" && r.concept === p[0]) ||
            (r.context === "gift" && r.concept === g[0])),
      ),
      counter: rows.filter(
        (r) =>
          r.question === "choice_reason" &&
          ((r.context === "personal" && r.concept !== p[0]) ||
            (r.context === "gift" && r.concept !== g[0])),
      ),
      fingerprint: fingerprint(study.choices),
    },
    {
      id: "refill",
      title: "Make the refill mechanism easier to understand",
      observation:
        unique(refill.map((r) => r.participant)).length +
        " participants raise a question or mixed reaction about refill understanding across the concepts.",
      interpretation:
        "Test a clearer visual explanation of the refill interface before changing the product promise.",
      support: refill,
      counter: positive("refill_clarity"),
      fingerprint: evidenceFingerprint(
        rows.filter((r) => r.codes.includes("refill_clarity")),
      ),
    },
    {
      id: "practicality",
      title: "Separate visual appeal from everyday practicality",
      observation:
        unique(practical.map((r) => r.participant)).length +
        " participants express a practical reservation or mixed reaction about a case.",
      interpretation:
        "Carry the practical reservations into a physical handling test. Renders do not establish usability.",
      support: practical,
      counter: positive("portability"),
      fingerprint: evidenceFingerprint(
        rows.filter((r) => r.codes.includes("portability")),
      ),
    },
  ];
  return findings.map((f) => ({
    ...f,
    interpretation: state.notes[f.id] || f.interpretation,
    status:
      state.approvals[f.id] ===
      fingerprint([f.fingerprint, state.notes[f.id] || f.interpretation])
        ? "approved"
        : state.approvals[f.id]
          ? "stale"
          : "draft",
  }));
}
export function approveFinding(study, state, id, note) {
  const f = buildFindings(study, state).find((f) => f.id === id);
  if (!f) throw Error("Unknown finding.");
  if (!f.support.length)
    throw Error("This finding has no supporting responses.");
  if (typeof note === "string") {
    if (!note.trim() || note.length > 600)
      throw Error("Write a recommendation of 1–600 characters.");
    state.notes[id] = note.trim();
  }
  const current = buildFindings(study, state).find((f) => f.id === id);
  state.approvals[id] = fingerprint([
    current.fingerprint,
    current.interpretation,
  ]);
}
export function applyCoding(study, state, id, change) {
  if (!study.responses.some((r) => r.id === id))
    throw Error("Unknown response.");
  if (
    !Array.isArray(change.codes) ||
    !change.codes.length ||
    change.codes.some((c) => !Object.hasOwn(codebook, c))
  )
    throw Error("Choose valid themes.");
  if (
    !Object.hasOwn(regions, change.region) ||
    !["positive", "concern", "neutral", "mixed"].includes(change.stance)
  )
    throw Error("Choose a valid region and stance.");
  state.overrides[id] = {
    codes: unique(change.codes),
    region: change.region,
    stance: change.stance,
    status: "reviewed",
  };
  state.revision++;
}
export function validateStudy(input) {
  if (
    !input ||
    !Array.isArray(input.responses) ||
    !Array.isArray(input.choices)
  )
    throw Error("The workbook needs Responses and Choices sheets.");
  if (
    !input.responses.length ||
    input.responses.length > 5000 ||
    input.choices.length > 5000
  )
    throw Error("Use between 1 and 5,000 responses and at most 5,000 choices.");
  const ids = new Set();
  const participants = new Set();
  const allowedConcepts = new Set(["A", "B", "C"]);
  const responses = input.responses.map((r, i) => {
    if (!r.id || ids.has(r.id))
      throw Error(
        "Response IDs must be present and unique (row " + (i + 2) + ").",
      );
    ids.add(r.id);
    if (
      typeof r.participant !== "string" ||
      !r.participant.trim() ||
      !allowedConcepts.has(r.concept)
    )
      throw Error("Invalid participant or concept in response " + r.id + ".");
    participants.add(r.participant);
    if (typeof r.text !== "string" || !r.text.trim() || r.text.length > 4000)
      throw Error(
        "Response " + r.id + " needs text of at most 4,000 characters.",
      );
    if (
      !["personal", "gift", "general"].includes(r.context) ||
      !["pack", "concept"].includes(r.phase)
    )
      throw Error("Invalid context or exposure phase in " + r.id + ".");
    if (
      !Array.isArray(r.codes) ||
      r.codes.some((c) => !Object.hasOwn(codebook, c))
    )
      throw Error("Unknown theme in " + r.id + ".");
    if (
      !Object.hasOwn(regions, r.region) ||
      !["positive", "concern", "neutral", "mixed"].includes(r.stance)
    )
      throw Error("Invalid coding in " + r.id + ".");
    return {
      ...r,
      question: r.question || "reaction",
      language: r.language || "unknown",
      status: ["authored", "reviewed", "needs_review"].includes(r.status)
        ? r.status
        : "needs_review",
      source: r.source || { sheet: "Responses", row: i + 2 },
    };
  });
  const seen = new Set();
  const choices = input.choices.map((r) => {
    const key = r.participant + ":" + r.context;
    if (seen.has(key))
      throw Error(
        "Only one explicit choice per participant and occasion is allowed.",
      );
    seen.add(key);
    if (
      !participants.has(r.participant) ||
      !allowedConcepts.has(r.concept) ||
      !["personal", "gift"].includes(r.context)
    )
      throw Error("A choice has an unknown participant, concept or occasion.");
    const response = responses.find((x) => x.id === r.responseId);
    if (
      !response ||
      response.participant !== r.participant ||
      response.concept !== r.concept ||
      response.context !== r.context
    )
      throw Error("A choice must link to a matching source response.");
    return { ...r };
  });
  return {
    ...input,
    responses,
    choices,
    participants: [...participants].map(
      (id) =>
        input.participants?.find((p) => p.id === id) || {
          id,
          language: "unknown",
          routine: "Not provided",
        },
    ),
  };
}
export function validateSuggestion(suggestion, text) {
  if (
    !suggestion ||
    !Array.isArray(suggestion.codes) ||
    !suggestion.codes.length ||
    suggestion.codes.length > 3 ||
    suggestion.codes.some((c) => !Object.hasOwn(codebook, c))
  )
    throw Error("The model returned unknown themes.");
  if (
    !Object.hasOwn(regions, suggestion.region) ||
    !["positive", "concern", "neutral", "mixed"].includes(suggestion.stance)
  )
    throw Error("The model returned invalid coding.");
  if (
    typeof suggestion.excerpt !== "string" ||
    suggestion.excerpt.length < 4 ||
    !text.includes(suggestion.excerpt)
  )
    throw Error("The model must quote an exact excerpt from the response.");
  return {
    codes: unique(suggestion.codes),
    region: suggestion.region,
    stance: suggestion.stance,
    excerpt: suggestion.excerpt,
    rationale: String(suggestion.rationale || "").slice(0, 500),
  };
}
