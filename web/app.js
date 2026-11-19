import "@fontsource/instrument-serif/latin-400.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "@fontsource-variable/manrope/index.css";
import { createSampleStudy, codebook, regions } from "./data/sample-study.js";
import cache from "./data/ai-cache.json";
import {
  contexts,
  createState,
  effectiveRows,
  visibleRows,
  preferenceCounts,
  buildFindings,
  approveFinding,
  applyCoding,
  validateSuggestion,
  unique,
} from "./model.js";
let study = createSampleStudy(),
  state = createState(study),
  tab = "concepts",
  region = "",
  phase = "concept",
  participantTheme = "",
  proposal = null;
const app = document.querySelector("#app"),
  dialog = document.querySelector("#dialog");
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const button = (text, action, cls = "", attrs = "") =>
  `<button type="button" class="${cls}" data-action="${action}" ${attrs}>${text}</button>`;
const concept = (id) => study.concepts.find((c) => c.id === id);
const source = (r) =>
  `${esc(r.participant)} <span>·</span> ${esc(r.id)} <span>·</span> ${esc(r.source.sheet)}!${esc(r.source.row)}`;
const quote = (r, compact = false) =>
  `<article class="quote ${compact ? "compact" : ""}"><div class="quote-meta">${source(r)}<span class="language">${esc(r.language.toUpperCase())}</span></div><blockquote>${esc(r.text)}</blockquote><div class="quote-bottom"><span>${r.codes.map((c) => esc(codebook[c].label)).join(" · ")}${r.status === "needs_review" ? " · Needs review" : ""}</span>${button("Check themes", "coding", "text-button", `data-id="${esc(r.id)}"`)}</div></article>`;
function toast(text) {
  const el = document.querySelector("#toast");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 4500);
}
function contextSwitch() {
  return `<div class="segmented" aria-label="Purchase occasion">${Object.entries(
    contexts,
  )
    .map(([id, label]) =>
      button(
        label,
        "context",
        state.context === id ? "active" : "",
        `data-id="${id}" aria-pressed="${state.context === id}"`,
      ),
    )
    .join("")}</div>`;
}
function render() {
  const active = tab === "participants" ? "feedback" : tab;
  const titles = {
    concepts: "Turn product feedback into <em>clear decisions.</em>",
    feedback: "What people <em>said.</em>",
    participants: "One person. <em>Two choices.</em>",
    findings: "What should <em>change?</em>",
  };
  const descriptions = {
    concepts:
      "Compare three lip-colour cases. Switch the occasion, then select a case to read its feedback.",
    feedback: "Read the original responses before drawing a conclusion.",
    participants: "Follow individual choices without losing the context.",
    findings:
      "Check the evidence, edit the recommendation, then approve it for your presentation.",
  };
  app.innerHTML = `<header class="masthead"><a class="wordmark" href="#" data-action="home" aria-label="ConceptArena home">Concept<span>Arena</span></a><nav aria-label="Study navigation">${[
    ["concepts", "Compare"],
    ["feedback", "Feedback"],
    ["findings", "Findings"],
  ]
    .map(([id, label]) =>
      button(
        label,
        "tab",
        active === id ? "nav-link active" : "nav-link",
        `data-id="${id}" aria-current="${active === id ? "page" : "false"}"`,
      ),
    )
    .join(
      "",
    )}</nav><div class="header-actions">${button("Import", "import", "quiet")}${button("Export", "export", "primary")}</div></header>
  <main><section class="intro"><p class="eyebrow">${study.synthetic ? "SYNTHETIC SAMPLE" : "IMPORTED STUDY"} · ${study.participants.length} PARTICIPANTS</p><h1>${titles[tab]}</h1><p class="intro-description">${descriptions[tab]}</p></section>
  ${tab !== "findings" ? `<div class="study-toolbar">${tab === "concepts" ? "<p>Who is it for?</p>" : tab === "participants" ? button("Back to feedback", "tab", "text-button", 'data-id="feedback"') : `<div class="concept-switch" aria-label="Selected concept">${study.concepts.map((c) => button(c.name, "concept", c.id === state.selectedConcept ? "active" : "", `data-id="${c.id}" aria-pressed="${c.id === state.selectedConcept}"`)).join("")}</div>`}${contextSwitch()}</div>` : ""}
  ${tab === "concepts" ? renderConcepts() : tab === "feedback" ? renderFeedback() : tab === "participants" ? renderParticipants() : renderFindings()}</main>
  <footer><p>ConceptArena by Nour Medjedel · ${study.synthetic ? "Fictional concepts and responses" : "Files stay in this browser session"}</p><div><a href="https://github.com/NourMedjedel/concept-arena" target="_blank" rel="noreferrer">GitHub</a>${button("About the study", "methods", "text-button")}${button("Reset", "reset", "text-button")}</div></footer>`;
}
function renderConcepts() {
  const choices = preferenceCounts(study, state.context);
  return `<div class="concept-grid">${study.concepts.map((c) => `<button type="button" class="concept-card" data-action="concept" data-id="${c.id}" aria-label="Read feedback on ${c.name}"><div class="product-image"><img src="${c.image}" alt="Fictional ${c.finish.toLowerCase()} lip-colour case"><span class="inspect-label">Read feedback</span></div><div class="concept-heading"><h2>${c.name}</h2><p>${c.finish}</p></div><div class="choice-count"><strong>${choices.counts[c.id]} of ${choices.n}</strong> people chose this ${state.context === "gift" ? "as a gift" : "for themselves"}</div><div class="meter"><span style="width:${choices.n ? (choices.counts[c.id] / choices.n) * 100 : 0}%;background:${c.accent}"></span></div></button>`).join("")}</div><p class="comparison-caption">All three share the same formula, shade, stated price and refill function. These sample choices are not a market forecast.</p>`;
}
function renderFeedback() {
  state.phase = phase;
  const c = concept(state.selectedConcept),
    rows = visibleRows(study, state, { concept: c.id, region });
  const sorted = [...rows].sort(
    (a, b) =>
      (a.question === "reaction" ? 0 : 1) - (b.question === "reaction" ? 0 : 1),
  );
  return `<section class="feedback-layout" id="evidence"><div class="feedback-product"><img src="${c.image}" alt="${c.name} packaging"><h2>${c.name}</h2><p>${c.finish}</p></div><div class="feedback-responses"><div class="section-heading"><h2>In their own words</h2><span>${unique(rows.map((r) => r.participant)).length} people</span></div><details class="filters" ${region || phase !== "concept" ? "open" : ""}><summary>Filter responses</summary><div class="form-row"><label for="detail-filter">Packaging detail<select id="detail-filter"><option value="">All details</option>${Object.entries(
    regions,
  )
    .map(
      ([id, label]) =>
        `<option value="${id}" ${region === id ? "selected" : ""}>${label}</option>`,
    )
    .join(
      "",
    )}</select></label><label for="phase">Exposure<select id="phase"><option value="concept" ${phase === "concept" ? "selected" : ""}>Full concept</option><option value="pack" ${phase === "pack" ? "selected" : ""}>Pack only</option><option value="all" ${phase === "all" ? "selected" : ""}>Both exposures</option></select></label></div></details><div class="quote-list">${
    sorted
      .slice(0, 3)
      .map((r) => quote(r))
      .join("") || '<p class="empty">No responses match these filters.</p>'
  }</div>${rows.length > 3 ? button("Read all " + rows.length + " responses", "all-quotes", "quiet") : ""}<div class="feedback-next">${button("View participants", "participants", "text-button")}${button("Review findings", "tab", "primary", 'data-id="findings"')}</div></div></section>`;
}
function renderParticipants() {
  const p =
    study.participants.find((p) => p.id === state.selectedParticipant) ||
    study.participants[0];
  const personal = study.choices.find(
      (c) => c.participant === p.id && c.context === "personal",
    ),
    gift = study.choices.find(
      (c) => c.participant === p.id && c.context === "gift",
    );
  const rows = effectiveRows(study, state).filter(
    (r) =>
      r.participant === p.id &&
      r.phase === "concept" &&
      (r.context === "general" || r.context === state.context) &&
      (!participantTheme || r.codes.includes(participantTheme)),
  );
  return `<section class="participant-layout"><aside class="participant-picker"><p class="eyebrow">PARTICIPANTS</p><div>${study.participants.map((x) => button(x.id, "participant", x.id === p.id ? "active" : "", `data-id="${esc(x.id)}" aria-pressed="${x.id === p.id}"`)).join("")}</div></aside><div class="participant-detail"><div class="participant-heading"><div><p class="eyebrow">INDIVIDUAL VIEW</p><h2>${esc(p.id)}<em> / ${esc(p.routine || "Routine not provided")}</em></h2></div><span class="badge">${esc(p.language?.toUpperCase() || "UNKNOWN")}</span></div><div class="individual-choices"><div><span>For myself</span><strong>${personal ? esc(concept(personal.concept).name) : "Not provided"}</strong></div><span class="choice-divider">/</span><div><span>As a gift</span><strong>${gift ? esc(concept(gift.concept).name) : "Not provided"}</strong></div></div><label class="filter-label" for="participant-theme">Explore a theme</label><select id="participant-theme"><option value="">All themes</option>${Object.entries(
    codebook,
  )
    .map(
      ([id, v]) =>
        `<option value="${id}" ${participantTheme === id ? "selected" : ""}>${esc(v.label)}</option>`,
    )
    .join(
      "",
    )}</select><div class="participant-quotes">${rows.map((r) => `<div class="with-concept"><span class="concept-stamp">${r.concept} / ${concept(r.concept).name}</span>${quote(r)}</div>`).join("") || '<p class="empty">No responses match this theme for this person and occasion.</p>'}</div></div></section>
 <section class="matrix-section"><div class="section-heading"><h2>The pattern behind the voices</h2><span>Distinct people · full concept · current occasion</span></div><div class="table-scroll"><table class="matrix"><thead><tr><th>Participant</th>${Object.values(
   codebook,
 )
   .map((t) => `<th>${esc(t.label)}</th>`)
   .join("")}</tr></thead><tbody>${study.participants
   .map(
     (p) =>
       `<tr><th>${button(p.id, "participant", "text-button", `data-id="${esc(p.id)}"`)}</th>${Object.keys(
         codebook,
       )
         .map((id) => {
           const matches = effectiveRows(study, state).filter(
             (r) =>
               r.participant === p.id &&
               r.phase === "concept" &&
               (r.context === "general" || r.context === state.context) &&
               r.status !== "needs_review" &&
               r.codes.includes(id),
           );
           return `<td>${matches.length ? button('<span class="matrix-dot" aria-hidden="true"></span><span class="sr-only">View ' + esc(p.id) + " responses about " + esc(codebook[id].label) + "</span>", "matrix", "", `data-id="${esc(p.id)}" data-theme="${id}"`) : '<span class="matrix-dash">—</span>'}</td>`;
         })
         .join("")}</tr>`,
   )
   .join(
     "",
   )}</tbody></table></div><p class="fine-print">A dot means a theme was coded at least once. It does not mean the participant liked the concept.</p></section>`;
}
function renderFindings() {
  const findings = buildFindings(study, state);
  return `<div class="findings-list">${findings.map((f, i) => `<details class="finding" ${i === 0 ? "open" : ""}><summary><h2>${f.title}</h2><span class="status ${f.status}">${f.status === "stale" ? "Review again" : f.status === "approved" ? "Approved" : "Draft"}</span><span class="disclosure-mark" aria-hidden="true"></span></summary><div class="finding-body"><p class="observation">${esc(f.observation)}</p><details class="finding-sources"><summary>Read supporting and contrasting feedback</summary><div class="finding-evidence"><div><p class="eyebrow">SUPPORT</p>${f.support[0] ? quote(f.support[0], true) : "<p>No supporting response.</p>"}</div><div><p class="eyebrow">COUNTERPOINT</p>${f.counter[0] ? quote(f.counter[0], true) : "<p>No counterexample coded. This does not establish unanimity.</p>"}</div></div>${button("See all evidence", "finding-sources", "text-button", `data-id="${f.id}"`)}</details><label for="note-${f.id}">Recommendation for the next test</label><textarea id="note-${f.id}" data-note="${f.id}" maxlength="600" rows="2">${esc(f.interpretation)}</textarea><div class="finding-actions">${button(f.status === "approved" ? "Approved for deck" : "Approve finding", "approve", f.status === "approved" ? "quiet" : "primary", `data-id="${f.id}" ${f.support.length ? "" : "disabled"}`)}</div></div></details>`).join("")}</div><div class="review-footer"><p>${findings.filter((f) => f.status === "approved").length} of ${findings.length} findings approved</p>${button("Export presentation", "export", "primary")}</div>`;
}
function showDialog(html, cls = "") {
  dialog.className = cls;
  dialog.innerHTML = `<div class="dialog-top"><span class="eyebrow">CONCEPTARENA</span>${button("Close", "close", "close-button", 'aria-label="Close dialog"')}</div>${html}`;
  if (!dialog.open) dialog.showModal();
}
function showCoding(id) {
  const r = effectiveRows(study, state).find((r) => r.id === id);
  proposal = null;
  showDialog(
    `<p class="eyebrow">RESEARCHER REVIEW / ${esc(r.id)}</p><h2>Review this response.</h2><div class="coding-source"><div class="quote-meta">${source(r)}</div><blockquote>${esc(r.text)}</blockquote></div><form id="coding-form" data-id="${esc(r.id)}"><fieldset><legend>Themes</legend><div class="theme-options">${Object.entries(
      codebook,
    )
      .map(
        ([key, c]) =>
          `<label><input type="checkbox" name="codes" value="${key}" ${r.codes.includes(key) ? "checked" : ""}><span>${esc(c.label)}<small>${esc(c.description)}</small></span></label>`,
      )
      .join(
        "",
      )}</div></fieldset><div class="form-row"><label>Packaging detail<select name="region">${Object.entries(
      regions,
    )
      .map(
        ([key, name]) =>
          `<option value="${key}" ${r.region === key ? "selected" : ""}>${name}</option>`,
      )
      .join(
        "",
      )}</select></label><label>Stance<select name="stance">${["positive", "concern", "neutral", "mixed"].map((key) => `<option ${r.stance === key ? "selected" : ""}>${key}</option>`).join("")}</select></label></div><div id="ai-proposal"></div><div class="dialog-actions">${button("Suggest with local AI", "assist", "quiet", `data-id="${esc(r.id)}"`)}<button class="primary" type="submit">Save reviewed coding</button></div><p class="fine-print">${import.meta.env.DEV ? "Live local Qwen3:8b. Only this response is sent to Ollama on your computer." : "Recorded Qwen3:8b proposals are available for R006, R014 and R026. Nothing is sent to a hosted model."} Suggestions never apply automatically.</p></form>`,
    "coding-dialog",
  );
}
async function assist(id, el) {
  const r = effectiveRows(study, state).find((r) => r.id === id);
  el.disabled = true;
  el.textContent = "Reading the response…";
  const target = dialog.querySelector("#ai-proposal");
  try {
    let result;
    const recorded = cache.results[id];
    if (import.meta.env.DEV) {
      const response = await fetch("./api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: r.text }),
      });
      result = await response.json();
      if (!response.ok) throw Error(result.error);
    } else if (recorded && recorded.sourceText === r.text) {
      result = recorded;
    } else
      throw Error(
        "No recorded proposal for this response. Run locally with Ollama to code your own responses.",
      );
    proposal = validateSuggestion(result.suggestion, r.text);
    target.innerHTML = `<div class="ai-proposal"><p class="eyebrow">${import.meta.env.DEV ? "LIVE LOCAL MODEL" : "RECORDED MODEL OUTPUT"} / ${esc(result.model)}</p><h3>${proposal.codes.map((c) => esc(codebook[c].label)).join(" + ")}</h3><p>${esc(proposal.rationale)}</p><blockquote>“${esc(proposal.excerpt)}”</blockquote><p class="fine-print">${esc(regions[proposal.region])} · ${esc(proposal.stance)} · ${esc(result.createdAt?.slice(0, 10) || "")}</p>${button("Use proposal in form", "use-proposal", "text-button")}<p class="fine-print">Review it, then save. A valid schema is not proof of a correct interpretation.</p></div>`;
  } catch (e) {
    target.innerHTML = `<p class="form-error" role="alert">${esc(e.message)}</p>`;
  } finally {
    el.disabled = false;
    el.textContent = "Suggest with local AI";
  }
}
function showMethods() {
  showDialog(
    `<h2>Evidence, not<br><em>an illusion of certainty.</em></h2><div class="method-list"><section><h3>Original, fictional study</h3><p>The sample contains 12 invented participants, 96 authored responses and 24 explicit choices. No consumer fieldwork or client data is represented. Product renders are original AI-generated illustrations.</p></section><section><h3>One controlled comparison</h3><p>All three concepts describe the same formula, shade, stated price and refill function. Pack-only impressions and full-concept responses are kept separate. A render cannot establish texture, weight, durability or efficacy.</p></section><section><h3>Counts you can trace</h3><p>Theme counts use distinct participant IDs, not repeated mentions. Preference uses explicit choices, never sentiment. Findings include source rows and counterexamples. This small qualitative sample does not estimate market share or statistical significance.</p></section><section><h3>AI proposes. A person reviews.</h3><p>Included coding is researcher-authored. The optional Qwen3:8b assistant proposes a theme, stance and exact source excerpt. Public hosting uses labelled recorded outputs; local mode can call your own Ollama instance. Model suggestions may be wrong and require review.</p></section><section><h3>What leaves your browser?</h3><p>Workbook parsing and PPTX/XLSX generation happen in this browser session. Imported workbooks are not uploaded or saved by this app. Live local AI sends only the selected response to your local Ollama server. Hosting infrastructure can still receive normal page-access metadata.</p></section></div>`,
    "methods-dialog",
  );
}
function showImport() {
  showDialog(
    `<h2>Your evidence.<br><em>A clear structure.</em></h2><p class="dialog-intro">Import an .xlsx workbook for a three-concept lip-colour study. Start from the sample to keep source links and choices intact.</p><ol class="import-steps"><li><b>Responses</b><span>One response per row, with participant, concept A/B/C, exposure, occasion, text and coding.</span></li><li><b>Choices</b><span>One explicit choice per person and occasion, linked to its response ID.</span></li><li><b>Participants</b><span>Optional language and routine fields. Anonymous IDs only.</span></li></ol><div class="dialog-actions">${button("Download sample workbook", "sample-xlsx", "quiet")}<label class="primary file-button">Choose .xlsx<input type="file" id="study-file" accept=".xlsx"></label></div><div id="import-error" role="alert"></div><p class="fine-print">Maximum 4 MB and 5,000 rows per input sheet. Canonical columns required; arbitrary workbooks are not automatically interpreted. Opening a workbook replaces the current session. No file upload.</p>`,
  );
}
function showExport() {
  const findings = buildFindings(study, state),
    n = findings.filter((f) => f.status === "approved").length;
  showDialog(
    `<h2>Export your study.</h2><p class="dialog-intro">An editable presentation, with source references. A workbook with the full evidence and current coding.</p><div class="export-status">${findings.map((f) => `<div><span>${esc(f.title)}</span><span class="status ${f.status}">${f.status === "stale" ? "Review again" : f.status}</span></div>`).join("")}</div><div class="dialog-actions">${button("Download evidence .xlsx", "xlsx", "quiet")}${button("Create presentation .pptx", "pptx", "primary", n ? "" : "disabled")}</div><p class="fine-print">${n ? n + " approved finding" + (n === 1 ? "" : "s") + " will enter the deck. Draft and stale interpretations are excluded." : "Approve a finding in the Findings view to enable the presentation."} Charts, text and recommendations are editable; counts remain traceable to source IDs.</p>${button("Review findings", "go-findings", "text-button")}`,
  );
}
function quoteDialog(title, rows) {
  showDialog(
    `<h2>${title}</h2><p class="dialog-intro">${rows.length} source responses. Read the original wording before interpreting the pattern.</p><div class="quote-list all-quotes">${rows.map((r) => quote(r)).join("") || "<p>No responses.</p>"}</div>`,
    "sources-dialog",
  );
}
app.addEventListener("click", handleAction);
dialog.addEventListener("click", handleAction);
async function handleAction(event) {
  const el = event.target.closest("[data-action]");
  if (!el) return;
  if (el.tagName === "A") event.preventDefault();
  const action = el.dataset.action,
    id = el.dataset.id;
  switch (action) {
    case "home":
      tab = "concepts";
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      break;
    case "tab":
      tab = id;
      render();
      window.scrollTo({ top: 0, behavior: "instant" });
      break;
    case "context":
      state.context = id;
      render();
      break;
    case "concept":
      state.selectedConcept = id;
      region = "";
      tab = "feedback";
      render();
      window.scrollTo({ top: 0, behavior: "instant" });
      break;
    case "region":
      region = id;
      render();
      break;
    case "participants":
      tab = "participants";
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      break;
    case "participant":
      state.selectedParticipant = id;
      render();
      if (el.closest(".matrix"))
        document
          .querySelector(".participant-detail")
          .scrollIntoView({ behavior: "smooth" });
      break;
    case "matrix":
      state.selectedParticipant = id;
      participantTheme = el.dataset.theme;
      render();
      document
        .querySelector(".participant-detail")
        .scrollIntoView({ behavior: "smooth" });
      break;
    case "coding":
      showCoding(id);
      break;
    case "assist":
      await assist(id, el);
      break;
    case "use-proposal":
      if (proposal) {
        const form = dialog.querySelector("#coding-form");
        form
          .querySelectorAll("[name=codes]")
          .forEach((x) => (x.checked = proposal.codes.includes(x.value)));
        form.elements.region.value = proposal.region;
        form.elements.stance.value = proposal.stance;
        toast("Proposal copied to the form. Review and save when ready.");
      }
      break;
    case "approve":
      try {
        approveFinding(
          study,
          state,
          id,
          document.querySelector("#note-" + id).value,
        );
        render();
        toast("Finding approved for the current evidence.");
      } catch (e) {
        toast(e.message);
      }
      break;
    case "finding-sources": {
      const f = buildFindings(study, state).find((f) => f.id === id);
      quoteDialog(
        "Inspect the finding.",
        unique([...f.support, ...f.counter].map((r) => r.id)).map((id) =>
          effectiveRows(study, state).find((r) => r.id === id),
        ),
      );
      break;
    }
    case "all-quotes":
      quoteDialog(
        "Every response. In context.",
        visibleRows(study, state, { concept: state.selectedConcept, region }),
      );
      break;
    case "methods":
      showMethods();
      break;
    case "import":
      showImport();
      break;
    case "export":
      showExport();
      break;
    case "close":
      dialog.close();
      break;
    case "go-findings":
      dialog.close();
      tab = "findings";
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      break;
    case "reset":
      showDialog(
        `<h2>Start fresh?</h2><p class="dialog-intro">This restores the synthetic sample. Unsaved coding and approvals in this session will be removed.</p><div class="dialog-actions">${button("Keep working", "close", "quiet")}${button("Reset to sample", "confirm-reset", "primary")}</div>`,
      );
      break;
    case "confirm-reset":
      study = createSampleStudy();
      state = createState(study);
      tab = "concepts";
      phase = "concept";
      region = "";
      dialog.close();
      render();
      toast("Sample restored.");
      break;
    case "sample-xlsx":
    case "xlsx":
    case "pptx": {
      const label = el.textContent;
      el.disabled = true;
      el.textContent = "Preparing your file…";
      try {
        const exp = await import("./exports.js");
        if (action === "pptx") {
          const images = Object.fromEntries(
            await Promise.all(
              study.concepts.map(async (c) => {
                const response = await fetch("./" + c.image);
                if (!response.ok)
                  throw Error("Could not load the concept illustration.");
                const blob = await response.blob();
                const data = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result);
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                });
                return [c.id, data];
              }),
            ),
          );
          const deck = exp.createDeck(study, state, images);
          await deck.writeFile({
            fileName: "concept-arena-reviewed-study.pptx",
            compression: true,
          });
        } else {
          const s = action === "sample-xlsx" ? createSampleStudy() : study;
          const st = action === "sample-xlsx" ? createState(s) : state;
          exp.downloadBytes(
            await exp.workbookBuffer(s, st),
            action === "sample-xlsx"
              ? "concept-arena-sample.xlsx"
              : "concept-arena-evidence.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          );
        }
        toast("Your file is ready.");
      } catch (e) {
        toast("Export failed: " + e.message);
      } finally {
        el.disabled = false;
        el.textContent = label;
      }
      break;
    }
  }
}
app.addEventListener("change", (e) => {
  if (e.target.id === "detail-filter") {
    region = e.target.value;
    render();
  }
  if (e.target.id === "phase") {
    phase = e.target.value;
    render();
  }
  if (e.target.id === "participant-theme") {
    participantTheme = e.target.value;
    render();
  }
});
app.addEventListener("input", (e) => {
  if (e.target.dataset.note) {
    state.notes[e.target.dataset.note] = e.target.value;
    const card = e.target.closest(".finding");
    const status = card.querySelector(".status");
    status.className = "status draft";
    status.textContent = "Unsaved recommendation";
    card.querySelector("[data-action=approve]").textContent = "Approve finding";
  }
});
dialog.addEventListener("submit", (e) => {
  if (e.target.id !== "coding-form") return;
  e.preventDefault();
  const data = new FormData(e.target);
  try {
    const before = buildFindings(study, state).filter(
      (f) => f.status === "approved",
    ).length;
    applyCoding(study, state, e.target.dataset.id, {
      codes: data.getAll("codes"),
      region: data.get("region"),
      stance: data.get("stance"),
    });
    const after = buildFindings(study, state).filter(
      (f) => f.status === "approved",
    ).length;
    dialog.close();
    render();
    toast(
      "Coding saved." +
        (before > after
          ? " " + (before - after) + " finding(s) need a new review."
          : " Explicit choices are unchanged."),
    );
  } catch (err) {
    toast(err.message);
  }
});
dialog.addEventListener("change", async (e) => {
  if (e.target.id !== "study-file" || !e.target.files[0]) return;
  const file = e.target.files[0],
    error = dialog.querySelector("#import-error");
  try {
    if (!file.name.toLowerCase().endsWith(".xlsx"))
      throw Error("Choose an .xlsx workbook.");
    if (file.size > 4 * 1024 * 1024)
      throw Error("Please use a workbook smaller than 4 MB.");
    error.textContent = "Reading your workbook…";
    const { readStudy } = await import("./exports.js");
    const next = await readStudy(await file.arrayBuffer());
    study = next;
    state = createState(study);
    tab = "concepts";
    region = "";
    phase = "concept";
    dialog.close();
    render();
    toast("Workbook opened. Review imported coding before exporting.");
  } catch (err) {
    error.className = "form-error";
    error.textContent = err.message;
    e.target.value = "";
  }
});
render();
