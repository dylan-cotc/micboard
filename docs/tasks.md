# Micboard Frontend - Implementation Tasks

**Status Legend:**
- ✅ Completed
- 🟡 In Progress
- ⬜ Not Started

---

## Phase 1: Setup & Configuration

### 1.1 Dependencies
- ⬜ Install Tailwind CSS (`tailwindcss`, `postcss`, `autoprefixer`)
- ⬜ Install drag-drop library (`react-beautiful-dnd` or `@dnd-kit/core`)
- ⬜ Install icons library (`lucide-react`)
- ⬜ Install date utilities (`date-fns` - optional)
- ⬜ Verify React Router and Axios already installed

### 1.2 Configuration Files
- ⬜ Create `tailwind.config.js` with custom theme
- ⬜ Create `postcss.config.js`
- ⬜ Create `client/.env` with `VITE_API_URL=http://localhost:3001/api`
- ⬜ Update `client/src/index.css` with Tailwind directives
- ⬜ Update `vite.config.ts` if proxy needed

---

## Phase 2: Core Application Structure

### 2.1 Type Definitions
- ⬜ Update `types/index.ts` with enhanced types:
  - ⬜ Add `ItemType` enum (`song`, `header`, `item`, `media`, `note`)
  - ⬜ Add `length` and `description` to `SetlistItem`
  - ⬜ Add drag-drop types if needed

### 2.2 Main Application Files
- ⬜ Update `main.tsx`:
  - ⬜ Wrap `<App />` with `<AuthProvider>`
  - ⬜ Import Tailwind CSS

- ⬜ Create `App.tsx`:
  - ⬜ Set up React Router with `<BrowserRouter>`
  - ⬜ Define routes:
    - ⬜ `/` - Display page
    - ⬜ `/login` - Login page
    - ⬜ `/admin` - Admin dashboard (protected)
    - ⬜ `/admin/settings` - Settings page (protected)
    - ⬜ `/admin/locations` - Locations page (protected)
    - ⬜ `/admin/positions` - Positions page (protected)
    - ⬜ `/admin/people` - People page (protected)
    - ⬜ `/admin/microphones` - Microphones page (protected)

---

## Phase 3: Reusable Components

### 3.1 Routing Components
- ⬜ Create `components/ProtectedRoute.tsx`:
  - ⬜ Check authentication with `useAuth()`
  - ⬜ Redirect to `/login` if not authenticated
  - ⬜ Render children if authenticated

### 3.2 Layout Components
- ⬜ Create `components/AdminLayout.tsx`:
  - ⬜ Side navigation with links (Dashboard, Settings, Locations, Positions, People, Microphones)
  - ⬜ Logout button
  - ⬜ Current user display
  - ⬜ Main content area with `<Outlet />`
  - ⬜ Responsive design

### 3.3 Display Components
- ⬜ Create `components/PersonCard.tsx`:
  - ⬜ Photo display with fallback to initials
  - ⬜ Name and position
  - ⬜ Responsive card design
  - ⬜ Prop: `person` object

- ⬜ Create `components/SetlistItem.tsx`:
  - ⬜ Different styling based on `type` (song/header/media/item)
  - ⬜ Icons for songs and media
  - ⬜ Bold, larger text for headers
  - ⬜ Props: `item` object

### 3.4 Admin Components
- ⬜ Create `components/DragDropMicAssignment.tsx`:
  - ⬜ Available people list (left)
  - ⬜ Microphone cards as drop zones (right)
  - ⬜ Drag-and-drop functionality
  - ⬜ Visual feedback (hover, dragging states)
  - ⬜ API calls on drop to assign/unassign

- ⬜ Create `components/PhotoUpload.tsx`:
  - ⬜ File input with drag-drop support
  - ⬜ Image preview
  - ⬜ Progress indicator
  - ⬜ Error handling
  - ⬜ File validation (type, size)

---

## Phase 4: Pages - Public

### 4.1 Display Page
- ⬜ Update `pages/Display.tsx`:
  - ⬜ Add Tailwind styling
  - ⬜ Header bar layout (church name left, date right)
  - ⬜ Auto-flow column layout for people cards
  - ⬜ Bottom section for setlist
  - ⬜ Use `SetlistItem` component for each item
  - ⬜ Responsive design
  - ⬜ Loading and error states
  - ⬜ Auto-refresh every 30 seconds

### 4.2 Login Page
- ⬜ Update `pages/Login.tsx`:
  - ⬜ Add Tailwind styling
  - ⬜ Centered card design
  - ⬜ Form validation
  - ⬜ Error display
  - ⬜ Loading state during login
  - ⬜ Redirect to `/admin` on success

---

## Phase 5: Pages - Admin

### 5.1 Dashboard Page
- ⬜ Create `pages/admin/Dashboard.tsx`:
  - ⬜ Welcome message
  - ⬜ Quick stats (# people, # positions, # microphones)
  - ⬜ Recent activity or status cards
  - ⬜ Links to main admin sections
  - ⬜ Optional: Preview of display view

### 5.2 Settings Page
- ⬜ Create `pages/admin/Settings.tsx`:
  - ⬜ Form for church name
  - ⬜ Form for Planning Center App ID
  - ⬜ Form for Planning Center Secret (password field)
  - ⬜ Save button with loading state
  - ⬜ Success/error messaging
  - ⬜ Load current settings on mount
  - ⬜ API integration with `adminAPI.getSettings()` and `updateSettings()`

### 5.3 Locations Page
- ⬜ Create `pages/admin/Locations.tsx`:
  - ⬜ "Sync Locations from Planning Center" button at top
  - ⬜ Hierarchical display grouped by Planning Center folders (campuses)
  - ⬜ Table view of locations with columns:
    - ⬜ Service Type Name (e.g., "Sunday Morning")
    - ⬜ Campus Folder (e.g., "Corinth Campus", "Booneville Campus")
    - ⬜ Service Type dropdown (assign which PC service type to sync)
    - ⬜ Sync Enabled toggle
  - ⬜ Campus folder grouping UI:
    - ⬜ Collapsible/expandable campus folder sections
    - ⬜ Campus name as section header (e.g., "Corinth Campus")
    - ⬜ All service types grouped under parent campus folder
  - ⬜ Service type assignment:
    - ⬜ Dropdown populated from Planning Center service types
    - ⬜ API call to update assignment
    - ⬜ Visual confirmation of assignment
  - ⬜ Toggle switches to enable/disable sync per location
  - ⬜ Loading state during sync
  - ⬜ Success message with count synced
  - ⬜ Error handling for API failures
  - ⬜ API integration with `adminAPI.getLocations()`, `syncLocations()`, `updateLocationServiceType()`, `toggleLocationSync()`, `getServiceTypes()`

### 5.4 Positions Page
- ⬜ Create `pages/admin/Positions.tsx`:
  - ⬜ "Sync Positions" button at top
  - ⬜ Table/grid of positions
  - ⬜ Columns: Position Name, Sync Enabled (toggle), Last Updated
  - ⬜ Toggle switches to enable/disable sync
  - ⬜ Loading state during sync
  - ⬜ Success message with count synced
  - ⬜ API integration with `adminAPI.getPositions()`, `syncPositions()`, `updatePosition()`

### 5.4 People Page
- ⬜ Create `pages/admin/People.tsx`:
  - ⬜ "Sync People" button at top
  - ⬜ Search/filter input
  - ⬜ Grid layout of people cards
  - ⬜ Each card shows: Photo, Name, Position, Upload/Delete buttons
  - ⬜ Click photo to upload new one
  - ⬜ Photo upload modal/inline
  - ⬜ Delete confirmation dialog
  - ⬜ Loading states
  - ⬜ Success message with count of people synced
  - ⬜ API integration with `adminAPI.getPeople()`, `syncPeople()`, `uploadPhoto()`, `deletePerson()`

### 5.5 Microphones Page
- ⬜ Create `pages/admin/Microphones.tsx`:
  - ⬜ "Add Microphone" button
  - ⬜ Add/Edit microphone modal with form (name, description)
  - ⬜ Microphone cards showing assigned people
  - ⬜ Drag-drop area using `DragDropMicAssignment` component
  - ⬜ Delete microphone button with confirmation
  - ⬜ Loading states
  - ⬜ API integration with `adminAPI.getMicrophones()`, `createMicrophone()`, `updateMicrophone()`, `deleteMicrophone()`, `assignMicrophone()`, `unassignMicrophone()`

---

## Phase 6: Styling & Polish

### 6.1 Global Styles
- ⬜ Configure Tailwind theme colors (primary blue, success green, error red)
- ⬜ Set up custom fonts (Inter or system)
- ⬜ Define spacing utilities
- ⬜ Add global CSS for smooth transitions

### 6.2 Component-Specific Styles
- ⬜ Style all buttons consistently (primary, secondary, danger)
- ⬜ Style all form inputs consistently
- ⬜ Add hover/active/focus states
- ⬜ Add loading spinners/skeletons
- ⬜ Add icons from lucide-react
- ⬜ Ensure responsive design (mobile, tablet, desktop)

### 6.3 Display View Styling
- ⬜ Optimize for 1920x1080 display
- ⬜ Large, readable fonts
- ⬜ High contrast colors
- ⬜ Professional appearance
- ⬜ Smooth animations on data updates

---

## Phase 7: Testing & Bug Fixes

### 7.1 Manual Testing
- ⬜ Test display view auto-refresh
- ⬜ Test display view with no data
- ⬜ Test display view with setlist and without
- ⬜ Test login flow (success and error cases)
- ⬜ Test all admin CRUD operations
- ⬜ Test position sync
- ⬜ Test people sync
- ⬜ Test photo upload (various file sizes and types)
- ⬜ Test drag-drop microphone assignment
- ⬜ Test protected routes (redirect when not logged in)
- ⬜ Test logout functionality

### 7.2 Cross-Browser Testing
- ⬜ Test in Chrome
- ⬜ Test in Firefox
- ⬜ Test in Safari
- ⬜ Test in Edge

### 7.3 Responsive Testing
- ⬜ Test on desktop (1920x1080)
- ⬜ Test on laptop (1366x768)
- ⬜ Test on tablet (768px width)
- ⬜ Test on mobile (375px width) - admin panel

### 7.4 Error Handling
- ⬜ Test with backend offline
- ⬜ Test with invalid credentials
- ⬜ Test with expired JWT token
- ⬜ Test with Planning Center unavailable
- ⬜ Test with file upload failures
- ⬜ Test with network timeouts

---

## Phase 8: Documentation & Deployment Prep

### 8.1 Code Documentation
- ⬜ Add JSDoc comments to complex functions
- ⬜ Add README section on running the frontend
- ⬜ Document environment variables needed

### 8.2 Build & Deploy
- ⬜ Test production build (`npm run build`)
- ⬜ Verify build output works correctly
- ⬜ Update `.gitignore` for build artifacts
- ⬜ Document deployment steps

---

## Checklist Summary

### Quick Task Count
- **Setup:** 9 tasks
- **Core Structure:** 10 tasks
- **Components:** 11 tasks
- **Public Pages:** 12 tasks
- **Admin Pages:** 40 tasks (added Locations page with folder hierarchy)
- **Styling:** 11 tasks
- **Testing:** 18 tasks
- **Documentation:** 4 tasks

**Total:** ~115 tasks

---

## Priority Order

### P0 - Critical (Must Have for V1)
1. Setup & Configuration (all)
2. Core application structure (all)
3. ProtectedRoute component
4. AdminLayout component
5. All admin pages (Settings, Locations, Positions, People, Microphones)
6. Display page with full functionality
7. Login page

### P1 - High (Should Have for V1)
1. PersonCard and SetlistItem components
2. DragDropMicAssignment component
3. PhotoUpload component
4. Dashboard page
5. All styling and polish

### P2 - Medium (Nice to Have for V1)
1. Advanced search/filter on People page
2. Additional visual feedback and animations
3. Comprehensive error handling

---

## Notes

- Focus on completing P0 tasks first before moving to P1
- Test each page as you build it
- Use Tailwind utility classes for faster development
- Reference the PRD.md for detailed requirements
- Backend API is already complete and tested
- Server runs on http://localhost:3001

---

## Getting Started

1. Install dependencies: `cd client && npm install`
2. Start backend server: `cd server && npm run dev` (port 3001)
3. Start frontend dev server: `cd client && npm run dev` (port 5173)
4. Open http://localhost:5173 to view the app
5. Backend API docs in `docs/PRD.md` section 9

---

**Last Updated:** November 2025
**Status:** Ready for Implementation
