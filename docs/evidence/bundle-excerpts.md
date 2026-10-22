# Bundle excerpts

These are short slices of public JavaScript that the browser downloaded from
`https://app.flowcv.com/assets/`. They are evidence for the architecture note,
not a copy of the application.

Files observed on 2026-10-22:

| File | Role |
| --- | --- |
| `/assets/index-76c0f4b1.js` | App module. Starts with an ESM import of `./vendor-3446ddb3.js` and ends by rendering into `#root`. |
| `/assets/vendor-3446ddb3.js` | Shared vendor chunk (React, router, Zustand persist, Axios, Immer, Bugsnag, Stripe, SortableJS, Redux). |
| `/assets/index-11e1b4cc.css` | App stylesheet, including `@font-face` for DM Sans. |

Neither JavaScript file ends with a `sourceMappingURL`. `analyze-web-bundle` on
the marketing origin also reported `source_maps.status = "not_requested"` for
the small Astro scripts; the app bundles do not declare maps in their tails.

## Render entry

The app chunk ends by mounting React on `#root`:

```js
const e = document.getElementById("root");
if (e) {
  yl(e).render(n(uW, {}));
}
```

`yl(element).render(...)` is the React 18 `createRoot` shape. The vendor chunk
contains `react-router-dom`'s `RouterProvider` error text.

## Zustand persist key

```js
const la = "flowcv-state";
const na = P(B(E((...e) => ({
  ...Wl(...e), ...cn(...e), ...hn(...e), ...Gl(...e),
  ...bn(...e), ...xn(...e), ...fn(...e), ...pn(...e),
}))), {
  name: la,
  storage: T(() => Al() ? localStorage : { getItem: () => null, setItem: () => null, removeItem: () => null }),
```

The vendor chunk contains the Zustand persist warning string
`[zustand persist middleware] Unable to update item`.

A new resume object is created with the sentinel id `"resumeId"`:

```js
Vn = "resumeId";
return { id: Vn, uuid: "", mongoId: "", userId: "", /* ... */ };
```

## Autosave

Entry order is debounced by 1 second and skipped while the id is still the sentinel:

```js
if (a.id === Vn) return;
await za.patch("/api/resumes/save_entries_order", {
  resumeId: a.id,
  sectionId: e,
  newEntriesIdsOrder: t,
  disableAutoSort: l,
});
const Um = ne.debounce(Gm, 1e3);
```

Personal details use a separate debounced queue (`savePersonalDetailsStatus`
goes to `"pending"`) and `za.patch("/api/resumes/save_personal_details", ...)`.
Another debounce near that code is `ne.debounce(Lm, 5e3, { maxWait: 1e4 })`.
Section display names use a 500 ms `setTimeout` before
`PATCH /api/resumes/save_section_name`.
Full customization sync is `ue(nL, 1e3)` and returns immediately unless
`Sa().auth.loggedIn`.

## Preview and pagination

Pages are React elements inside a div, not a canvas or iframe:

```js
n("div", {
  id: "resumePages",
  children: e.map((t, l) => s(qh, { children: [/* header */, s(Kh, { isFirstPage: l === 0, children: t.map(/* blocks */) })] })),
});
```

The packer measures block heights and opens a new page when the next block
does not fit (`o + t < e`). Block kinds include `"pagebreak"`, `"heading"`,
and `"spacer"`. Two-column rows carry `leftCol` and `rightCol`.

## PDF download

```js
const t = document.getElementById("resumePages") ? document.getElementById("resumePages").children.length : 0;
const r = await fm.get("/api/resumes/download", {
  params: { resumeId: i.id, previewPageCount: t },
  responseType: "blob",
  retry: { retriesMs: [4e3, 8e3] },
});
const h = new Blob([r.data], { type: "application/pdf" });
De.saveAs(h, `${s}.pdf`);
```

`fm` is an Axios instance (`axios@` appears in the vendor chunk). `De.saveAs`
is the FileSaver `saveAs(blob, filename)` call shape. The function also waits
until at least 6 seconds have elapsed before saving.

## Drag and drop

Section layout changes go through a component whose callback receives
`source`, `destination`, and `draggableId`, then writes `sectionOrder` and
`hasManuallyResortedSectionOrder`:

```js
onDragEnd: (n) => {
  const { source: a, destination: r } = n;
  if (!r || !a) return;
  // ... rewrites sectionOrder ...
  ph(l, "sectionOrder", [{ value: true, path: "hasManuallyResortedSectionOrder" }]);
}
```

Template-admin grids are a different library. The vendor chunk contains
`react-sortablejs` and the SortableJS README URL, and the app chunk renders
`gl.ReactSortable` for template lists.

## Analytics beacon

```js
const a = { event: e, href: l, referrer: n, width: window.innerWidth, props: t ?? {}, timestamp: new Date().toISOString() };
const r = "https://app.flowcv.com/clientlog";
if (navigator.sendBeacon) {
  navigator.sendBeacon(r, new Blob([JSON.stringify(a)], { type: "application/json" }));
} else {
  fetch(r, { method: "POST", body: JSON.stringify(a), headers: { "Content-Type": "application/json" } });
}
```

## Auth captcha

The signup path renders Cloudflare Turnstile into `#turnstile-container` and
posts the token to an `/api/auth/...` route. The site key is present in the
bundle; it is a public widget key. Stripe is loaded with `loadStripe` and a
`pk_live_` publishable key (not repeated here).
