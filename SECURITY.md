# Security scope

Reviewed: 19 November 2026. This is a portfolio prototype, not a security certification or a deployment approved for confidential consumer research.

## Public demo: no AI inference service

GitHub Pages serves static JavaScript, fonts, images and three recorded Qwen3:8b proposals. The public build has no application server, model credential, live inference endpoint or file-upload API. It cannot access a visitor's local Ollama service.

The public button is labelled **View recorded AI**. A proposal is shown only if the response ID and exact source text match the recorded sample. Source text, model, date and playback status remain visible. A person must review and save any coding change; a model proposal cannot run tools or execute an action.

Imported workbooks are processed in browser memory, not sent to the repository owner. Reloading clears the app session. The only application-generated files are downloads explicitly requested by the visitor. GitHub and normal internet infrastructure can still receive page-access metadata. This does not eliminate browser extensions, compromised devices, download retention or hosting risks.

## Browser controls

- Source text, participant fields and model explanations are escaped before insertion into HTML.
- A content-security policy permits scripts, fonts and connections from the same origin. Inline scripts, external AI/CDN requests, object embedding, base URL changes and native form submissions are disallowed. Inline **styles** remain permitted for computed chart widths and library styling.
- The policy is delivered as an HTML meta tag because GitHub Pages does not support custom response headers. It does not provide a `frame-ancestors` header or a full set of configurable HTTP security headers.
- Fonts and product illustrations are bundled locally; no analytics or external model scripts are included. External links use a no-referrer policy.
- Lookup maps for response overrides and review state have no object prototype, preventing reserved imported IDs from mutating their prototypes.

## Workbook handling

The importer accepts a small, plain study workbook, not general-purpose Office documents:

- 4 MB compressed; 12 MB actual expanded content; 4 MB per ZIP entry; at most 128 entries, 32 columns and 5,000 data rows per sheet.
- ZIP entry count is checked before ZIP parsing. Content is streamed with an actual byte budget before ExcelJS sees a rebuilt, validated archive. Declared uncompressed sizes are not trusted.
- Unsafe archive paths, macros/binary objects, external relationships, XML entity declarations, formulas and out-of-range sparse cells are rejected. Limits also cover single-quoted or numerically encoded cell references.
- Input validation checks response IDs, allowed concepts/themes, source-linked choices and duplicate participant choices. Imported values are not evaluated as code. Formula-like response text is exported as a string, not as an Excel formula.

Resource limits reduce denial-of-service risk; they are not a formal proof against all malformed parser inputs. Only open files from sources you trust. No confidential data should be committed as a demo fixture.

## Optional local inference

`npm run dev` binds to `127.0.0.1:8789`, with a fixed port. The development-only adapter accepts JSON POST requests only when Host is a recognised loopback host and Origin matches that exact host and port. Missing or cross-origin requests are refused before inference.

The adapter allows one active request, at most five attempts per minute, a 12,000-byte request body, a 4,000-character response text, a request-body timeout and a 120-second model timeout. The inference target and model are fixed in source, preventing user-selected upstream URLs. Error responses do not return raw internal exception details.

Only the selected response is sent to the locally running Ollama service. Output themes, region, stance and an exact source excerpt are validated. These checks establish structure and source linkage, not semantic correctness. Local users and software on the same computer remain within the local trust boundary. Do not expose Vite or Ollama to an untrusted network or use this adapter as a public multi-user service.

## Supply chain and checks

Dependencies and the lockfile are committed; patched transitive versions are pinned. GitHub Actions are pinned to verified full commit hashes. Checkout does not persist credentials, and deployment uses limited Pages/OIDC permissions in its own job. Dependabot is configured for weekly npm and Action update pull requests; updates require review and passing checks.

CI runs a dependency audit, formatting checks, regression tests and a production build before deployment. Tests cover unsafe origins, request limits, concurrency, escaped HTML, prototype-sensitive IDs, compressed-workbook limits, external links, formulas, XML entities and native-chart compatibility. The dependency audit reported no known vulnerabilities on the review date; vulnerability databases and dependencies change.

For a sensitive issue, use the repository's private vulnerability reporting feature. Do not post tokens, personal data or confidential workbooks in public issues. There has been no independent penetration test or exhaustive audit.
