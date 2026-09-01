# Plan: Instagram-like Batch Mates UI in Students.jsx

## Objective
Transform the "Batch Mates" section into an Instagram-style, visually engaging, searchable social grid.

## Current State
- `Students.jsx` shows a plain bento grid of batch mates
- Each card has avatar, name, roll number, CR badge, Follow button
- No search/filter capability
- No social links visible on cards
- Static hover effect (`hover:bg-soft-stone/50`)

## Target State
- Instagram-style card grid with larger avatars, cleaner typography
- Search bar to filter batch mates by name/roll number in real-time
- Show social link icons on hover (GitHub, LinkedIn, Instagram, etc.)
- Smooth animations on card hover (scale, shadow)
- "Following" state with visual feedback
- Empty state with illustration when no results

## Approach

### 1. Add Search Input
- Add a search bar above the batch mates grid
- Filter `batchMates` array by `name` or `rollNumber` in real-time
- Debounce search for performance (300ms)

### 2. Redesign Batch Mate Cards
- Larger circular avatar (64px)
- Name + roll number stacked cleanly
- Social icons row (GitHub, LinkedIn, Instagram, etc.) shown on hover with slide-up animation
- Follow button with better styling
- Card hover: subtle lift + shadow + border color change

### 3. Add Empty State
- When search returns no results, show "No batch mates found" with illustration

### 4. Keep Mobile Responsive
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3-4 columns

## Files to Modify
1. `frontend/src/pages/Students.jsx` — main redesign

## No Backend Changes Needed
- Social links are already in `user.profile.socialLinks`
- Search is client-side only

## Validation
- Search filters batch mates in real-time
- Cards show social icons on hover
- Layout is responsive at 375px, 768px, 1024px
- Build passes
