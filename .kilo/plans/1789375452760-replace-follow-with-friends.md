# Plan: Replace Follow System with Friends System

## Goal
Replace the existing unidirectional `followers`/`following` graph with a bilateral **Friends + Friend Requests** system across backend, frontend, and database. Coexist with the existing `profileVisibility` privacy field.

## Scope
- Backend: models, routes, notifications
- Frontend: pages (Profile, Network, Search), components (FollowButton → FriendActionButton, ProfileHeader, PeerCard, UserPopover), API wrappers
- Database: migration from `followers`/`following` to `friends` + `FriendRequest`
- Out of scope: chat/messaging UI (socket infra already exists but no messaging feature yet)

## Decisions Made

| Decision | Choice |
|----------|--------|
| Replace or coexist? | **Replace** — remove `followers`/`following`, add `friends` and `FriendRequest` |
| Friendship semantics | Bilateral request/accept. Sender requests → recipient accepts → both added to `friends` array |
| Migration of existing follows | Mutual follows → accepted friends. One-way follows → pending `FriendRequest` from follower to followee |
| Privacy "friends" visibility | `profile.friends` array replaces `user.followers` as the gate for friends-only visibility |
| Network "People You May Know" | Sort by descending mutual-friend count (intersection of viewer's `friends` with candidate's `friends`) |

## 1. Schema Changes

### 1.1 User Model (`backend/src/models/User.js`)
- **Remove**: `followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]`
- **Remove**: `following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]`
- **Add**: `friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]`
  - Bidirectional array; both users store each other's ObjectId

### 1.2 New Model (`backend/src/models/FriendRequest.js`)
```js
{
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```
- Index: `{ sender: 1, recipient: 1 }` unique, plus `{ recipient: 1, status: 1 }`

### 1.3 Notification Model
- Add enum values: `friend_request`, `friend_accepted`
- Deprecate old `follow` / `follow_back` types (do not delete yet; leave for 1 release cycle)

## 2. Backend API Changes

### 2.1 New Friend Request Routes (`backend/src/routes/friends.js`)
| Method | Endpoint | Body / Params | Description |
|--------|----------|---------------|-------------|
| POST | `/api/friends/request` | `{ recipientId }` | Send friend request; creates `FriendRequest(status: 'pending')`. 400 if request already exists or users are already friends. |
| POST | `/api/friends/:id/accept` | — | Accept pending request. Sets `status: 'accepted'`, adds both to `User.friends`. Notifies sender. |
| POST | `/api/friends/:id/reject` | — | Reject pending request. Sets `status: 'rejected'`. |
| DELETE | `/api/friends/:id/remove` | — | Remove existing friend. Removes both from `User.friends`. |
| GET | `/api/friends/:id/list` | — | Get friends list of user `:id`. Returns formatted users. |
| GET | `/api/friends/requests` | query: `status=pending` | Get pending friend requests received by current user. |

### 2.2 Update Profile Routes (`backend/src/routes/profile.js`)
- `GET /api/profile/:id` response shape changes:
  - Replace `followers`/`following` with `friends` count
  - Add `friendStatus` for viewer: `'friends' | 'pending_sent' | 'pending_received' | 'none'`
- `GET /api/profile/:id/followers` → **Remove** (replace with `/api/friends/:id/list`)
- `GET /api/profile/:id/following` → **Remove**
- `PATCH /api/profile/me` — no schema change needed; `computeCompleteness` still uses `socialLinks`
- Privacy gate in `GET /api/profile/:id`:
  - `friends` visibility now checks `user.friends` array instead of `user.followers`

### 2.3 Update Network Route (`backend/src/routes/network.js`)
- `GET /api/network/college`
  - Remove `followers`/`following` select
  - Add `friends` select
  - Output: `friends`, `friendStatus`, `mutualCount` (intersection with viewer's `friends`)
  - Remove `isFollowing`/`followsMe`; replace with `friendStatus`

### 2.4 Update Profile Search Route (`backend/src/routes/profile.js:search`)
- Same as above: output `friendStatus`, `mutualCount`, `friends` count

### 2.5 Update Forum Routes (`backend/src/routes/forum.js`)
- Remove `isFollowing`/`followsMe` from author populates
- Add `friendStatus` relative to current viewer

### 2.6 Suggested Users Endpoint (`backend/src/routes/profile.js`)
- New or update existing `/api/profile/suggested`
- Algorithm: active users not yet friends with viewer, ordered by descending mutual friend count, capped at 20

### 2.7 Mount New Router
- In `backend/server.js`: `app.use('/api/friends', require('./src/routes/friends'))`

## 3. Migration Script (`backend/migrations/001-follows-to-friends.js`)

Run once before server starts (or as a one-off script):
```js
// 1. Add FriendRequest schema (ensure model file exists)
// 2. Iterate all users:
//    - For each pair where A.following contains B AND B.following contains A:
//      → Add B to A.friends, add A to B.friends
//    - For each pair where A.following contains B but NOT mutual:
//      → Create FriendRequest { sender: A, recipient: B, status: 'pending' }
// 3. Remove followers and following fields from all users
```

Run command: `node backend/migrations/001-follows-to-friends.js` then `npm start`

## 4. Frontend Changes

### 4.1 Replace `FollowButton` with `FriendActionButton`
**New component**: `frontend/src/components/FriendActionButton.jsx`

States (based on `friendStatus` prop):
| `friendStatus` | Button text | Action |
|----------------|-------------|--------|
| `friends` | "Friends" (outlined) | Click → open confirm → remove friend |
| `pending_sent` | "Requested" (disabled-ish) | Click → cancel request |
| `pending_received` | "Accept" (primary) | Click → accept request |
| `none` | "Add Friend" (primary) | Click → send request |

Remove `FollowButton.jsx`. Update all imports.

### 4.2 Update `ProfileHeader.jsx`
- Replace `mutualCount` calculation: intersect `currentUser.friends` with `profile.friends`
- Replace `connectionLabel`:
  - `friends` → `"Friends"`
  - `pending_sent` → `"Requested"`
  - `pending_received` → `"Wants to connect"`
  - otherwise show mutual count (e.g., `"3 mutual friends"`)
- Replace stats: `Friends` (was `followers`) and keep only one count, or keep `Following` as "People you've added"
- Replace FollowButton with FriendActionButton

### 4.3 Update `Profile.jsx`
- Replace `stats.followers`/`stats.following` with `stats.friends`
- Add `friendStatus` in profile state (from API)
- Update Network Stats sidebar: show Friends count + Mutual Friends list (clickable)
- Update "Similar Profiles" sidebar: show mutual friend count per suggestion

### 4.4 Update `Network.jsx`
- Replace `PeerCard` friend button logic
- Update `localFollow` → `localFriendStatus`
- `handleFollow` → `handleFriendAction` calling appropriate API

### 4.5 Update `Search.jsx`
- Replace all `FollowButton` instances with `FriendActionButton`
- Update `isFollowing`/`followsMe` state → `friendStatus`

### 4.6 Update `GlobalSearch.jsx` and `BatchMateCard.jsx`
- Replace `FollowButton` imports and usage

### 4.7 Update `UserPopover.jsx`
- Replace "Followers" / "Following" with "Friends" count

### 4.8 API Wrapper (`frontend/src/api/profile.js`)
- Remove: `toggleFollow`, `getFollowers`, `getFollowing`
- Add:
  - `sendFriendRequest(recipientId)`
  - `acceptFriendRequest(requestId)`
  - `rejectFriendRequest(requestId)`
  - `removeFriend(userId)`
  - `getFriendList(userId)`
  - `getFriendRequests(status = 'pending')`
- Update `getPublicProfile`, `getCollegeNetwork`, `searchUsers` response handling to use `friendStatus`

### 4.9 New API wrapper file (`frontend/src/api/friends.js`)
```js
export const sendFriendRequest = (recipientId) => api.post('/friends/request', { recipientId })
export const acceptFriendRequest = (requestId) => api.post(`/friends/${requestId}/accept`)
export const rejectFriendRequest = (requestId) => api.post(`/friends/${requestId}/reject`)
export const removeFriend = (userId) => api.delete(`/friends/${userId}/remove`)
export const getFriendList = (userId) => api.get(`/friends/${userId}/list`)
export const getFriendRequests = (status = 'pending') => api.get(`/friends/requests?status=${status}`)
```

### 4.10 Notifications Page
- Add friend request notification cards with Accept / Reject actions
- New notification types render as inline actions

## 5. Data Shape Changes (Breaking)

| Old API field | New API field |
|---------------|---------------|
| `followers` | `friends` |
| `following` | *(removed)* |
| `isFollowing` | `friendStatus` (`friends` \| `pending_sent` \| `pending_received` \| `none`) |
| `followsMe` | *(merged into friendStatus)* |
| `mutualCount` | New, derived from `friends` intersection |

Frontend must be updated in lockstep with backend to avoid runtime errors.

## 6. Notifications

- `friend_request`: title `"X sent you a friend request"`, link `/profile/X`
- `friend_accepted`: title `"X accepted your friend request"`, link `/profile/X`
- Socket.io event: `friend_request_received`, `friend_request_accepted`

## 7. Edge Cases

- **Self-request**: return 400
- **Duplicate request**: return 400 with message
- **Already friends**: return 400
- **Removing friend**: if pending request exists, cascade delete/reject it
- **Privacy gate**: viewer must be in `profile.friends` array for `friends` visibility
- **Empty friends array**: behaves same as no followers today

## 8. Rollout Order

1. Add `FriendRequest` model + migration script; stop server, run migration, restart
2. Add `friends.js` backend routes (without removing old routes yet)
3. Update frontend API wrappers and components to call new routes
4. Remove old follow routes and `followers`/`following` from model
5. Remove old FollowButton and update all pages
6. Delete unused `getFollowers`/`getFollowing` endpoints
7. Verify: profile view, network page, search page, notifications, peer cards, user popovers

## 9. Validation Checklist

- [ ] `GET /api/profile/:id` returns `friends`, `friendStatus`, no `followers`/`following`
- [ ] `POST /api/friends/request` creates a `pending` request
- [ ] `POST /api/friends/:id/accept` adds both to `friends` and returns correct counts
- [ ] `DELETE /api/friends/:id/remove` removes from both sides
- [ ] `GET /api/friends/requests` returns only current user's pending requests
- [ ] Migration script converts mutual follows to friends, one-way to requests
- [ ] Profile page shows "X mutual friends" correctly
- [ ] Network page Add Friend button cycles through correct states
- [ ] Search page button reflects `friendStatus`
- [ ] Notifications render friend requests with action buttons
- [ ] `friends` privacy still gates private profile data
