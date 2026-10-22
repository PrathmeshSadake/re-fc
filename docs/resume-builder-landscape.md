# Resume builder landscape

Notes for what is worth copying into a small builder, and what it costs. FlowCV findings are in `flowcv-architecture.md`. Other products are from their public docs or READMEs as of 2026-10-22, not from a reverse-engineering pass.

## Patterns that show up everywhere

| Concern | Usual approaches | What we saw on FlowCV |
| --- | --- | --- |
| Document model | JSON Resume, a custom schema, or a rich-text blob | Custom schema: `personalDetails` + `content[sectionId].entries` + `customization` |
| Editor state | Redux, Zustand, or a server cache (TanStack Query) | Zustand `persist` → `localStorage` key `flowcv-state` |
| Autosave | Debounced `PATCH`, or local-only | Local immediately; debounced `PATCH` only once logged in |
| Preview | HTML/CSS, a second PDF renderer, or PDF.js of the export | Same-document HTML, custom page packer, `#resumePages` |
| PDF | Headless Chrome, `@react-pdf/renderer`, or `pdf-lib` | `GET /api/resumes/download` blob. Engine on the server was not visible |
| Reorder | dnd-kit, react-beautiful-dnd, SortableJS | `data-rbd-*` in the editor; `react-sortablejs` on template admin |
| Templates | Data (tokens) vs separate components | A template is customization JSON plus placeholder content |
| ATS | Single column, real text, standard headings, no text-in-images | Marketing claims ATS-friendly templates. The packer emits HTML text, which is the right direction. Multi-column (`two`, `mix`) is optional and harder for parsers |
| Share | Public link, JSON export | `webResumeLive`, `webToken`, `publish_web_resume` in the client |

## Open source

### JSON Resume

https://jsonresume.org/ — a community JSON document (`basics`, `work`, `education`, `skills`, …) plus themes. The registry's PDF formatter renders a theme to HTML and prints it with headless Chromium (`apps/registry/lib/formatters/pdf.js` in the docs at https://jsonresume.org/docs/010-formatters).

Worth copying: a stable, boring schema and “theme = presentation, JSON = data”. Tradeoff: the official schema has no place for FlowCV-style layout (`sectionOrder.mix`, per-section icons, accent colors). Those belong beside the schema, not inside `work[]`.

### Reactive Resume

https://github.com/amruthpillai/reactive-resume and https://docs.rxresu.me/guides/json-resume-schema

- Own JSON Schema (draft 2020-12) at `/schema.json`. It can import JSON Resume. It is not the same document.
- Sections have `items[]`, headings, and layout flags (`columns`, `hidden`, `keepTogether`, `startOnNewPage`).
- v5.1.0 (2026-05-07) dropped Browserless / Puppeteer. PDF is `@react-pdf/renderer` in the browser. The live preview is PDF.js of that same document, so preview and download match. Custom CSS went away because there is no HTML print step anymore.
- Resume state moved from a Zustand store to TanStack Query. Forms use TanStack Form.

Worth copying: one renderer for preview and PDF if pixel match matters. Tradeoff: `@react-pdf/renderer` is not CSS. FlowCV kept CSS for the preview and a server print for the file, which can drift. Reactive Resume chose the other side of that tradeoff and had to re-port every template.

### OpenResume (xitanggg/open-resume)

https://github.com/xitanggg/open-resume and https://www.open-resume.com/

README stack: Next.js, React, Redux Toolkit, Tailwind, **react-pdf** for the file, PDF.js for the parser. Data stays in the browser. No account. The design is intentionally one column, no photo, US Letter habits, aimed at ATS parsers such as Greenhouse and Lever. Their own site names FlowCV and Reactive Resume as the more global, more customizable cousins.

Worth copying: local-only privacy and a single predictable column. Tradeoff: almost no theming. A second column looks better and parses worse.

There is a different project, “The OpenResume Project” (https://theopenresumeproject.github.io/OpenResume/), which is a JSON spec (`version`, `format: "orf"`, `meta`, `data`). It is not the xitanggg app.

## Commercial products, from their public behavior and docs

These were not packet-captured for this repo. Treat them as product positions, not implementation proofs.

- **FlowCV.** Guest editor, local store, account required to download. First resume free, no watermark (their marketing page). Large template gallery (109 published records in the public cache). HTML preview, server PDF.
- **Resume.io, Novoresume, Kickresume, Enhancv, Zety.** Account-gated builders with template galleries, often a paywall on download or on extra templates. Public pages emphasize ATS checks, job-tailored text, and DOCX as well as PDF. Their client architectures were not inspected here.
- **Canva.** A general design surface. Resumes are pages of absolutely positioned objects. That is flexible and easy to make into a picture that an ATS cannot read. The opposite of OpenResume's single text column.

## What this repo copies

1. **Zustand + `localStorage`.** Same idea as FlowCV's guest store, without the server queue. OpenResume's “nothing leaves the browser” is the right default for a demo.
2. **Immediate preview from the same state.** FlowCV re-renders HTML on each keystroke. We do that too. We do not copy the height packer; a simple CSS page is enough at this size.
3. **Section reorder.** FlowCV stores three layouts (`one`, `two`, `mix`). We store one array and drag it with dnd-kit. dnd-kit is maintained; the `data-rbd-*` library family is not something to start a new app on.
4. **Two templates as data, not two documents.** `template: "classic" | "sidebar"` plus the same sections. Classic is one column (the ATS-friendly choice OpenResume argues for). Sidebar is the two-column option FlowCV's `layout.colsFromDetails` represents, with the known parsing tradeoff.
5. **Client PDF via `@react-pdf/renderer`.** FlowCV's server blob is the better way to guarantee the HTML preview and the file match, and it needs a print worker we should not ship. Reactive Resume v5.1 and OpenResume both landed on react-pdf for a self-contained app. The cost is a second layout. The preview stays HTML so the editor feels instant; the PDF is a simpler twin of the same fields.

Not copied, on purpose: account wall, Stripe, Bugsnag, Turnstile, the 109-template catalog, AI rewrite endpoints, and the debounced server `PATCH` queue. Those matter once there is a user service. They are not required to show the data-to-preview loop.
