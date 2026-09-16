# Airtable Design UI Redesign Plan

## Goal
Apply the Airtable editorial design system (from `DESIGN-airtable.md`) to every page/section/component of the Electro Infinity frontend, **without deleting any routes, UX flows, or API code**. Only the visual layer changes.

## Design System Summary (from the spec)
- **Colors**: primary `#181d26` (near-black), canvas `#ffffff`, ink `#181d26`, body `#333840`, muted `#41454d`, hairline `#dddddd`, surface-soft `#f8fafc`, surface-strong `#e0e2e6`, surface-dark `#181d26`, signature coral `#aa2d00`, forest `#0a2e0e`, cream `#f5e9d4`, peach `#fcab79`, mint `#a8d8c4`, yellow `#f4d35e`, mustard `#d9a441`, link `#1b61c9`, info `#254fad`, success `#006400`.
- **Typography**: Haas Groot Disp / Haas Grotesk (fallback: Inter). Display weights 400/500 only. Body 14px/400. Pricing sub-system uses Inter Display at 475.
- **Radius**: xs 2px, sm 6px, md 10px, lg 12px, pill 9999px (pricing only), full 9999px.
- **Spacing**: base 4px; section vertical padding 96px universal.
- **Buttons**: primary = near-black bg + white text + 12px radius; secondary = white bg + ink text + hairline outline; pricing pill = 9999px radius (pricing page only); icon circular = 40px full circle.
- **Elevation**: color-block first, shadow second. No gradients on hero, no atmospheric mesh.
- **Section rhythm**: white → coral/forest/dark signature card → white → cream callout → dark navy CTA → light gray CTA banner → footer.

## Files to Change (frontend only)
1. `frontend/src/index.css` — replace CSS variables + component classes with Airtable tokens.
2. `frontend/src/components/Navbar.jsx` — 64px white top-nav, Airtable wordmark, primary/secondary button pair, mobile full-screen sheet.
3. `frontend/src/components/Footer.jsx` — light canvas footer, 6-column link grid, Airtable-style legal row.
4. `frontend/src/pages/Home.jsx` — white hero (96px padding), coral signature card, dark navy CTA card, cream callout, demo-grid cards, logo strip.
5. `frontend/src/pages/About.jsx` — editorial body, stats, timeline, signature cards.
6. `frontend/src/pages/Contact.jsx` — white canvas, hairline form card, info column.
7. `frontend/src/pages/Placements.jsx` — stats grid, recruiter list, internship cards, alumni spotlights.
8. `frontend/src/pages/Gallery.jsx` — filter rail, demo-grid style photo cards, upload modal.
9. `frontend/src/pages/Projects.jsx` — project cards, submit modal.
10. `frontend/src/pages/Labs.jsx` — lab rule-separated cards.
11. `frontend/src/pages/Achievements.jsx` — achievement cards with signature surfaces.
12. `frontend/src/pages/Announcements.jsx` — announcement list + detail modal.
13. `frontend/src/pages/Calendar.jsx` — timeline list.
14. `frontend/src/pages/Courses.jsx` — semester pills + course table.
15. `frontend/src/pages/Dashboard.jsx` — stat cards + sections.
16. `frontend/src/pages/Forum.jsx` — post feed, rooms, comments.
17. `frontend/src/pages/Login.jsx` — login form + carousel.
18. `frontend/src/components/Carousel.jsx` — carousel controls (circular icon buttons).
19. `frontend/src/components/Hero.jsx`, `Button.jsx` — align with Airtable button variants.
20. `frontend/src/components/*.jsx` — any other shared components using old tokens.

## Implementation Steps
1. **Rewrite `index.css`** — define CSS variables matching the Airtable palette, Haas/Inter font stacks, and component classes (`button-primary`, `button-secondary`, `signature-coral-card`, `hero-card-dark`, `feature-card-tabbed`, `cream-callout-card`, `demo-grid-card`, `pricing-tier-card`, etc.).
2. **Update `Navbar.jsx`** — 64px white bar, Airtable wordmark, primary horizontal menu, "Book Demo" outline + "Sign up for free" near-black CTA, mobile hamburger → full-screen sheet.
3. **Update `Footer.jsx`** — light canvas, 6-column link grid, Airtable legal row.
4. **Update each page** — apply 96px section padding, signature cards, hairline borders, Haas type scale, near-black primary CTAs, white outlined secondary CTAs.
5. **Update shared components** — `Carousel`, `Hero`, `Button`, `Skeleton`, etc.
6. **Verify** — run `npm run lint` / typecheck if available; ensure no routes/UX/API code removed.

## Constraints
- Do NOT delete or modify any route, API endpoint, or backend code.
- Preserve all existing functionality (auth, CRUD, attendance, forum, etc.).
- Only change visual styling and layout.