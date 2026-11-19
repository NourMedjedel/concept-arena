# ConceptArena — Beauty Research Studio

Status: first playable prototype. See the root README for implemented features and current limits. This brief also contains later design goals.

Research-informed refinement: see [research-brief.md](research-brief.md),
19 November 2026. Prioritise the inspect/compare/revise loop over additional
dashboard features.

## Purpose

An interactive workspace for analysing qualitative beauty concept studies and
preparing editable, evidence-linked presentation slides. The first demo should
make the connection between an individual participant, a collective finding and
the source evidence visible without requiring technical knowledge.

Keep the project independent and sector-specific. Use original fictional
products and synthetic study data. Do not include real client or employer names,
logos, proprietary research, implied partnerships or brand endorsements.

## First study

Compare three luxury lip-colour packaging directions. Hold the stated formula,
shade, size and price constant to keep the comparison focused on packaging.
The assets are concept renders, not photographs of tested physical prototypes.

- Concept A: sculpted brushed-metal pack; a decorative object for the vanity.
- Concept B: understated deep-plum pack; compact and practical for everyday use.
- Concept C: tactile ivory pack with a clearly explained refill mechanism.

All three share the same stated refill functionality; vary how the design
communicates it rather than introducing an extra functional benefit to only one.
Perceived quality, portability and usability are perceptions of the concepts,
not measured product performance.

Use twelve fictional participants and short authored answers about first
impressions, perceived luxury, clarity, practical reservations, personal purchase
and gifting. Responses may be in French or English. Clearly mark the dataset as
synthetic in the interface, exports and repository.

Record stimulus version and exposure phase, distinguishing pack-only reactions
from answers given after reading a concept board. Do not combine these phases
silently or infer a causal effect from their differences.

## Signature interaction

Switch the occasion between personal purchase and gifting. Recalculate results
from participants' explicit answers to those questions. Show why their choices
can differ, with the exact supporting quotes and counterexamples.

Do not infer a participant's preference from sentiment alone. Do not substitute
a model-generated simulated shopper for an actual source response.

Link reviewed response spans to named pack regions where the text supports that
mapping. Clicking the cap, label or refill interface should reveal the associated
comments and findings. This is a qualitative annotation, not an eye-tracking map.

## Main interface

1. Study setup: import an XLSX workbook and map participant, concept, question,
   context and response columns. Offer a sample workbook for the public demo.
2. Concept comparison: large original product renders, comparable dimensions,
   participant counts, reservations and occasion-specific preferences.
3. Participant view: the person's explicit choices, source excerpts and tensions
   across questions. Avoid invented personality traits or purchasing motivations.
4. Evidence matrix: participants by theme/concept, with drill-down to workbook
   sheet, row and response. Expose missing answers and ambiguous classifications.
5. Slide rail: build findings, comparison slides and participant summaries. Each
   finding retains supporting and contrasting evidence for researcher review.

Keep the visual language editorial and premium: generous whitespace, strong
product photography-style renders, precise typography, ink, cream and muted plum.
The study workspace should remain readable and restrained.

## A meaningful correction

Let the researcher correct a theme assignment or interpretation. Recalculate
affected counts and mark dependent findings/slides for review. The researcher
approves a revised narrative before it appears in the export. A coding change
does not rewrite the participant's original answer or explicit preference.

A proposed pack redesign creates a new, untested stimulus version. Keep existing
feedback attached to the version participants saw and prepare a next-test brief;
do not invent a new preference score for the revised design.

## Analysis and exports

- Use actual NLP processing for proposed coding; identify model, configuration
  and analysis version. Label any cached demo analysis clearly.
- Separate source statements, computed quantities, model interpretations and
  researcher-approved findings.
- Count unique participants, not repeated mentions. Display the denominator and
  question context; report counts for this sample without population estimates.
- Evaluate coding and extraction against separate labelled examples, including
  negation, mixed opinions, occasion changes and French/English variation.
- Generate editable PPTX text, quote cards and charts, plus source identifiers in
  slide notes and an evidence appendix. Do not silently make unsupported claims.
- Export participant-level and collective results to XLSX as well.

## First release boundary

One study format, three packaging concepts, one sample workbook, participant and
collective analysis, reviewable findings, and editable PPTX/XLSX exports.
Use an existing local model where practical; no paid API is required to inspect
the included sample analysis. General multi-study repositories, real consumer
recruitment, campaign effectiveness prediction and physical product testing are
outside this initial release.

## Industry context

The workflow is informed by public descriptions of concept and package research:

- https://www.kantar.com/marketplace/solutions/innovation-and-product-development/package-design-screening-and-testing
- https://www.ipsos.com/en/packaging-research

These references establish relevant research activities, not validation of this
prototype or an endorsement by a research organisation.
