# Fix Body Scroll Lock for Overlays

## Problem
When overlays are open (hamburger menu, notification dropdown, global search, profile dropdown), the background page can still be scrolled on desktop.

## Solution
Ensure all overlay components lock body scroll when open.

## Files to Modify

### 1. `frontend/src/components/GlobalSearch.jsx`
Add body scroll lock effect at the top of the component:
```javascript
useEffect(() => {
  const scrollY = window.scrollY
  document.documentElement.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'
  document.body.style.position = 'fixed'
  document.body.style.top = '-' + scrollY + 'px'
  document.body.style.width = '100%'

  return () => {
    const savedScrollY = parseInt(document.body.style.top || '0', 10)
    document.documentElement.style.overflow = ''
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
    window.scrollTo(0, savedScrollY)
  }
}, [])
```

### 2. `frontend/src/components/Navbar.jsx`
Add body scroll lock for profile dropdown and mega dropdowns. When any dropdown opens, lock body scroll. When all close, unlock.

Add state to track if any dropdown is open:
```javascript
const [anyDropdownOpen, setAnyDropdownOpen] = useState(false)
```

Update dropdown open/close handlers to set this state.

Add useEffect:
```javascript
useEffect(() => {
  if (anyDropdownOpen) {
    const scrollY = window.scrollY
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = '-' + scrollY + 'px'
    document.body.style.width = '100%'
  } else {
    const savedScrollY = parseInt(document.body.style.top || '0', 10)
    document.documentElement.style.overflow = ''
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
    window.scrollTo(0, savedScrollY)
  }
}, [anyDropdownOpen])
```

### 3. `frontend/src/components/NotificationDropdown.jsx`
Ensure the notification dropdown has `no-scrollbar` class (already done) and that body scroll is locked when open (already done in NotificationBell.jsx).

## Manual Steps
Since tool permissions are restricted, please apply these changes manually to the files listed above.

## Validation
- Open hamburger menu on desktop → background cannot scroll
- Open notification dropdown on desktop → background cannot scroll
- Open global search → background cannot scroll
- Open profile dropdown → background cannot scroll
- Close any overlay → background scroll restored to previous position
