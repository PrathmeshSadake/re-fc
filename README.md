# re-fc

A small resume builder, plus the notes from reverse-engineering [FlowCV](https://flowcv.com/) with [REA](https://github.com/morluto/rea) (npm package `rea-agents`).

The app is a Next.js (App Router) editor: personal info, experience, education, and skills, a Zustand store persisted in `localStorage`, drag-and-drop section order, two templates, a same-page live preview, and a client-side PDF download.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000. `npm run build` then `npm start` is the production path.

Edits are stored in the browser under the key `re-fc-resume`. **Reset sample** restores the seeded resume. **Download PDF** builds a US Letter file in the browser with `@react-pdf/renderer`. No account and no server round-trip.

## Why the PDF is client-side

FlowCV's editor renders HTML, then `GET /api/resumes/download` returns a PDF blob. Guests never reach that call: Download opens a signup dialog. The server engine (Chrome, a PDF library, or something else) is not in the public bundles.

This app does not ship a print worker. `@react-pdf/renderer` is the same choice OpenResume documents and the choice Reactive Resume made in v5.1 when it dropped headless Chrome. The tradeoff is real: the on-screen preview is HTML, and the file is a second, simpler layout of the same fields. See [docs/resume-builder-landscape.md](docs/resume-builder-landscape.md).

## FlowCV, short version

Full write-up, evidence, and confidence labels: [docs/flowcv-architecture.md](docs/flowcv-architecture.md).

| Question | Finding | Confidence |
| --- | --- | --- |
| Where does text live? | Zustand `persist` in `localStorage["flowcv-state"]`. Guest edits do not call `/api/resumes/*`. Logged-in edits are debounced `PATCH`es. | High for guests. The patch queue is from the bundle and was not executed while logged in. |
| How does reorder work? | Editor rows expose `data-rbd-draggable-id`. Order is `customization.sectionOrder` with `one` / `two` / `mix`. Template admin uses `react-sortablejs`. | High for the DOM contract and the state shape. The npm package name is not in the bundle. |
| How does preview stay in sync? | Same React tree. `#resumePages` is HTML. A height packer makes one child per page. US Letter measured 816×1056 CSS pixels. | High |
| Who makes the PDF? | The browser downloads a blob from `GET /api/resumes/download` and saves it as `application/pdf`. Guests are stopped first. Producer/Creator metadata was not available. | High for the client contract. Unknown for the server engine. |

The same document continues past those four questions: routes, the guest tour of login / plans / cover letters / job tracker, the pricing payload, the template schema, and the static API catalog from REA's application graph.

How REA was installed, which commands worked, and where `analyze-web-bundle` ran out of memory: [docs/rea-setup-and-method.md](docs/rea-setup-and-method.md).

Screenshots and trimmed network notes: [docs/evidence/](docs/evidence/).

## Docs

- [docs/rea-setup-and-method.md](docs/rea-setup-and-method.md)
- [docs/flowcv-architecture.md](docs/flowcv-architecture.md)
- [docs/resume-builder-landscape.md](docs/resume-builder-landscape.md)
