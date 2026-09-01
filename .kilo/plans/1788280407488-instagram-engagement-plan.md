# Plan: Instagram-like Engagement Features for Profile & Search

## Objective
Transform the profile and search experience into an engaging, addictive social flow — adapted for a college community context.

---

## Scope: What's Already Built (Use as Foundation)

| Feature | Status |
|---|---|
| Profile page with cover, avatar, bio, stats | ✅ |
| Follow / Unfollow with notifications | ✅ |
| User search (name, roll, dept, batch, skills) | ✅ |
| Global search navbar dropdown | ✅ |
| Network / Connect page | ✅ |
| Social links (9 platforms) | ✅ |
| Forum posts (room-scoped) | ✅ |
| Projects, Achievements, Gallery | ✅ |

---

## Phase 1: Profile Page Engagement (Highest Impact)

### 1.1 Enhanced Profile Header (`ProfileHeader.jsx`)
- **Story/Activity ring** around avatar — show "Active now" or "New content" indicator based on recent forum posts / projects / gallery uploads
- **Mutual connections count** — show how many mutual followers between viewer and profile owner
- **Connection degree badge** — e.g., "1st connection" if following, "2nd" if mutual
- **Quick action pills** — "Message" (placeholder for future DM), "Add to Circle" (favorite follow)

### 1.2 Profile Tab Redesign (`Profile.jsx`)
- Replace current tabs (About, Projects, Achievements, Gallery) with Instagram-style horizontal scroll:
  - **Posts** — combined feed of user's forum posts + projects (sorted by date)
  - **Projects** — grid layout, 3-column on desktop
  - **Achievements** — card-based
  - **Gallery** — masonry grid
- Add **"Saved"** tab (localStorage-based, no backend) for bookmarked items
- Add **view count** on profile (track `profileViews` array on User model, increment on visit)
- Add **"Similar profiles"** sidebar — users with same department/batch/skills

### 1.3 Profile Edit Enhancements (`EditProfile.jsx`)
- Add **"Profile Highlights"** section — let users pin 3-5 highlights (e.g., "Hackathon Winner", "Open Source") with cover image and title
- Add **"Featured Project"** pinning — one project that shows prominently on profile
- Add **status/activity text** — short status message (like WhatsApp/Instagram status, max 100 chars)

---

## Phase 2: Search & Discover Experience

### 2.1 Search Results Redesign (`Search.jsx`, `Network.jsx`)
- Replace list view with **card-based grid** — avatar, name, role badge, mutual count, follow button inline
- Add **"Trending Now"** section — users with most follows this week
- Add **"People You May Know"** section — algorithm: same department + not followed + active recently
- Add **filter chips** for quick filtering by role (Student / CR / Faculty / Admin)

### 2.2 Enhanced Global Search (`GlobalSearch.jsx`)
- Show **recently viewed** users when search input is empty
- Show **trending searches** placeholder
- Add **quick profile preview** on hover — mini card with avatar, name, role, follow button

---

## Phase 3: Feed & Activity (Engagement Driver)

### 3.1 Activity Feed Page (New: `/feed`)
- New page showing activity from followed users:
  - "X posted in Y forum room"
  - "X uploaded a new project"
  - "X earned an achievement"
  - "X joined the platform"
- Pull from existing data (ForumPost, Project, Achievement, User createdAt)
- Infinite scroll, real-time updates via Socket.io

### 3.2 Notification Enhancements (`Notifications.jsx`)
- Add **notification categories** — All / Connections / Forum / Projects
- Add **"Turn on notifications for X"** per user
- Show **preview thumbnail** for project/achievement notifications
- Group notifications by actor ("X and 3 others posted")

---

## Phase 4: Backend Changes

### 4.1 User Model Updates (`backend/src/models/User.js`)
- Add `profileViews: [{ viewer: ObjectId, viewedAt: Date }]` — capped at last 50
- Add `status: { text: String, expiresAt: Date }` — temporary status
- Add `highlights: [{ title, coverImage, items: [{ type, refId }] }]`
- Add `featuredProject: ObjectId` ref to Project
- Add `lastActive: Date` — update on every API call via middleware

### 4.2 New API Endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/profile/:id/views` | Recent profile viewers |
| POST | `/api/profile/me/status` | Set temporary status |
| DELETE | `/api/profile/me/status` | Clear status |
| POST | `/api/profile/me/highlight` | Create highlight |
| DELETE | `/api/profile/me/highlight/:id` | Delete highlight |
| PATCH | `/api/profile/me/featured` | Set featured project |
| GET | `/api/profile/trending` | Trending users (most follows this week) |
| GET | `/api/profile/suggested` | Suggested connections (same dept/batch) |
| GET | `/api/feed` | Activity feed from followed users |

### 4.3 Middleware
- Add `updateLastActive` middleware to all authenticated routes — updates `lastActive` on User

---

## Phase 5: Frontend API Layer (`frontend/src/api/profile.js`)
Add client functions for all new endpoints. Use existing `axios` instance pattern.

---

## Phase 6: Polish & Micro-interactions

- **Framer Motion animations** on all new components — slide-up cards, heart burst on follow, staggered list entrance
- **Skeleton loaders** on profile, search, feed
- **Toast notifications** for actions (followed, saved, status updated)
- **Empty states** with illustrations for no posts, no followers, no feed activity
- **Dark mode compatibility** — all new components respect existing theme context
- **Mobile responsive** — test all new layouts at 375px

---

## Design Decisions Needed

1. **Status persistence** — Should status auto-expire after 24h? (Recommended: Yes)
2. **Profile views privacy** — Show viewer identity to profile owner only, or anonymous count? (Recommended: Show name + timestamp to owner only)
3. **Activity feed scope** — Include all followed users or only mutual connections? (Recommended: All followed users, matches existing follow model)
4. **Trending algorithm** — Most new follows in 7 days, or most overall activity? (Recommended: Most new follows in 7 days — simple and fast)
5. **Suggested users algorithm** — Same department + same batch + not followed + active in last 30 days? (Recommended: Yes, limit to 10 results)

---

## Out of Scope (Defer to v2)
- Direct Messaging (DMs)
- Stories / ephemeral content
- Save/Bookmark to backend
- Hashtags / trending topics
- Block / Mute / Report
- Verified blue check badges
- Algorithmic "Explore" page
- Post comments on projects/achievements/gallery

---

## Files to Modify

| File | Change |
|---|---|
| `frontend/src/components/ProfileHeader.jsx` | Activity ring, mutual count, connection badge, quick actions |
| `frontend/src/pages/Profile.jsx` | Tab redesign, view count, similar profiles, highlights |
| `frontend/src/pages/EditProfile.jsx` | Highlights, featured project, status |
| `frontend/src/pages/Search.jsx` | Card-based layout, trending, suggested |
| `frontend/src/pages/Network.jsx` | Card-based layout, filter chips |
| `frontend/src/components/GlobalSearch.jsx` | Recent views, trending placeholder, hover preview |
| `frontend/src/components/FollowButton.jsx` | Heart burst animation |
| `frontend/src/pages/Feed.jsx` | New file — activity feed |
| `frontend/src/pages/Notifications.jsx` | Categories, previews, grouping |
| `frontend/src/api/profile.js` | New API functions |
| `backend/src/models/User.js` | New fields |
| `backend/src/routes/profile.js` | New endpoints |
| `backend/src/middleware/` | `updateLastActive` middleware |
| `backend/src/server.js` | Mount new routes |

---

## Validation Steps
1. Profile page renders with new tabs and animations
2. Search returns card-based results with mutual counts
3. Follow button triggers heart animation + notification
4. Activity feed loads posts from followed users
5. Profile views increment on visit
6. Status sets and auto-expires after 24h
7. Mobile responsive at 375px, 768px, 1024px
