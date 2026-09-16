# PYQ Inline Preview & Direct Download

## Goal
- **View** on a PYQ opens a left-side slide-over drawer that renders the file inline (PDF/image) without ever displaying the direct Cloudinary link to the user.
- **Download** triggers a true file download without navigating away or opening a new tab.

## Scope
- Public `/resources` page, PYQ tab only.
- Other resource types (`notes`, `assignment`, `lab_manual`, etc.) keep their current behavior unless explicitly requested later.
- Backend endpoints are shared but the new flow is wired only from the PYQ `ResourceCard`.

---

## Backend Changes

**File:** `backend/src/routes/resources.js`

1. **Add a small MIME-type helper** near the top of the file.
   - Maps common extensions (`pdf`, `png`, `jpg`, `jpeg`, `webp`) to MIME types.
   - Defaults to `application/octet-stream`.

2. **Add new endpoint:** `GET /api/resources/:id/preview`
   - Looks up resource by ID.
   - Streams the file from Cloudinary to the client.
   - Sets `Content-Type` based on the helper.
   - Does **not** set `Content-Disposition` (or sets `inline`) so the browser renders it.
   - Used exclusively by the frontend preview drawer iframe/img.

3. **Modify existing endpoint:** `GET /api/resources/:id/download`
   - Replace `res.redirect(resource.fileUrl)` with a streamed response.
   - Streams file from Cloudinary.
   - Sets `Content-Disposition: attachment; filename="<resource.fileName>"`.
   - Sets `Content-Type` from the helper.
   - Still increments `downloadCount` before streaming.

**Streaming approach:**
- Use `axios` (already a dependency) with `responseType: 'stream'` to fetch the Cloudinary URL.
- Pipe `response.data` to `res`.
- Forward relevant Cloudinary content headers when present.
- Handle errors (404 from Cloudinary, network errors) with `res.status(500)`.

---

## Frontend Changes

**New component:** `frontend/src/components/ResourcePreviewDrawer.jsx`

Slide-over panel anchored to the left edge.

Props:
- `resource` — the resource object to preview (null/undefined = hidden)
- `onClose` — callback to close

Behavior:
- Fixed position, full viewport height, slides in from the left.
- Backdrop overlay behind it; clicking backdrop closes.
- Escape key closes.
- Content area:
  - Loading spinner while the preview loads.
  - If `resource.fileUrl` ends with `.pdf` (or MIME is PDF): render `<iframe>` with `src={previewApiUrl}`.
  - If image: render `<img>` with `src={previewApiUrl}`.
  - Else: show a message that preview is unavailable, plus a Download button.
- **Never** render `resource.fileUrl` as text or a clickable link in the UI.
- Close button in the top-right corner.

**API addition:** `frontend/src/api/resources.js`
- Add `getPreviewUrl(id)` → returns `/api/resources/${id}/preview`
- Add `downloadResource(id)` → returns `/api/resources/${id}/download` (used as `href` for hidden anchor or fetch)

**Modify:** `frontend/src/pages/Resources.jsx`

1. Add state: `const [previewResource, setPreviewResource] = useState(null)`
2. Pass an `onView` handler down to `ResourceCard` (or make `ResourceCard` accept an `onView` prop).
3. Conditionally render `<ResourcePreviewDrawer resource={previewResource} onClose={() => setPreviewResource(null)} />`.
4. For the **PYQ tab only**, the `ResourceCard` "View" button calls `onView(r)` instead of linking to `r.fileUrl`.
5. The **Download** button uses a programmatic download:
   - Create a hidden `<a>` element with `href={downloadApiUrl}` and `download` attribute.
   - Programmatically click it.
   - Remove the element.
   - This keeps the user on the same page.

**Modify:** `frontend/src/pages/Resources.jsx` — `ResourceCard`
- Accept optional `onView` prop.
- If `onView` is provided and `resource.type === 'pyq'`, the "View" button becomes a `<button>` (or `<a>` with `href="#"`) that calls `onView(resource)`.
- For other types, keep existing `<a href={r.fileUrl} target="_blank">View</a>` behavior.
- "Download" button always uses the programmatic download approach for PYQs; other types can keep the existing `target="_blank"` behavior.

---

## Edge Cases & Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Drawer direction | Left slide-over | User explicitly asked for "left side like a pop up". |
| Preview for non-PDF/image | Show "Preview unavailable" message | Avoids broken iframes; user can still download. |
| Hide direct URL | Backend proxy for both preview and download | Cloudinary URL never appears in frontend markup or UI text. |
| Download UX | Programmatic hidden anchor click | Keeps user on the page; no new tab. |
| Scope | PYQ tab only | User request was specific to PYQs. Other tabs unchanged. |
| File type detection | Extension + MIME helper | No model migration required; works with existing `fileName` field. |

---

## Files to Touch

1. `backend/src/routes/resources.js`
2. `frontend/src/api/resources.js`
3. `frontend/src/pages/Resources.jsx`
4. `frontend/src/components/ResourcePreviewDrawer.jsx` (new)

---

## Validation

- Open `/resources`, switch to PYQs tab.
- Click **View** on a PDF: left drawer slides in, PDF renders inside iframe, no URL shown in UI.
- Click **View** on an image: left drawer slides in, image renders, no URL shown in UI.
- Click **Download**: browser prompts for download, page does not navigate or open a new tab.
- Click backdrop or press Escape: drawer closes.
- Verify non-PYQ tabs (Notes, Assignments, etc.) still open View in a new tab as before.
