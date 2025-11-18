# Micboard - Product Requirements Document (PRD)

**Version:** 1.0
**Date:** November 2025
**Product:** Micboard Church Display Application

---

## 1. Executive Summary

### 1.1 Product Overview
Micboard is a church display application that shows next Sunday's vocalists and pastors synced from Planning Center. The application features photo management, microphone assignments, and real-time setlist display on a full-screen public display.

### 1.2 Target Users
- **Primary:** Church tech teams and worship coordinators
- **Secondary:** Church staff managing Planning Center
- **Viewers:** Church congregation viewing the display

### 1.3 Key Value Propositions
- Automated sync with Planning Center reduces manual updates
- Visual display helps congregation know who's serving
- Microphone assignment tracking prevents confusion
- Real-time setlist keeps everyone informed

---

## 2. Product Goals

### 2.1 Business Goals
- Streamline church service preparation workflows
- Reduce manual data entry and errors
- Improve communication with congregation
- Provide professional visual presentation

### 2.2 User Goals
- **Admins:** Quick setup, easy synchronization, minimal maintenance
- **Tech Teams:** Clear microphone assignments, easy updates
- **Congregation:** See who's leading worship and service order

### 2.3 Success Metrics
- Time saved per week on manual updates (target: 30+ minutes)
- Reduction in microphone assignment errors (target: 90%+)
- User satisfaction with display clarity (target: 4.5/5)
- Successful Planning Center syncs (target: 99%+)

---

## 3. User Personas

### 3.1 Sarah - Worship Coordinator
- **Age:** 32
- **Tech Savvy:** Medium
- **Goals:** Ensure correct people are scheduled, upload photos, assign microphones
- **Pain Points:** Manual tracking, forgetting to update displays, microphone confusion
- **Needs:** One-click sync, visual confirmation, drag-drop assignment

### 3.2 Mike - Tech Director
- **Age:** 45
- **Tech Savvy:** High
- **Goals:** Set up integrations, manage settings, ensure system reliability
- **Pain Points:** Complex APIs, poor documentation, system downtime
- **Needs:** Clear setup process, reliable syncing, error handling

### 3.3 Jane - Congregation Member
- **Age:** 28
- **Tech Savvy:** Low
- **Goals:** Know who's leading worship, follow along with service
- **Pain Points:** Can't see display from distance, unclear information
- **Needs:** Large, clear photos, readable text, simple layout

---

## 4. Functional Requirements

### 4.1 Public Display View

#### 4.1.1 Display Layout
- **Header Bar:**
  - Left: Church name (text only, configurable in settings)
  - Right: Next Sunday's date (formatted: "Sunday, November 17, 2025")
  - Fixed height, professional styling

- **Photo Display:**
  - Auto-flow responsive columns (adjusts to screen width)
  - Vertical photo cards with person name and position
  - Photos maintain aspect ratio
  - Fallback initials for missing photos
  - Minimum card size for readability

- **Setlist Section (Bottom):**
  - Fixed bottom section, full width
  - Horizontal layout with items displayed left-to-right
  - Visual differentiation by item type:
    - **Header:** Bold, larger text, divider styling
    - **Song:** Music note icon, standard styling
    - **Media:** Video/play icon
    - **Item:** Standard text
  - Service title displayed prominently
  - No scrolling required (items sized to fit)

#### 4.1.2 Display Behavior
- Auto-refresh data every 30 seconds
- Smooth transitions when data updates
- Responsive to different screen sizes/resolutions
- Optimized for TV/projector display
- No user interaction required

### 4.2 Admin Panel

#### 4.2.1 Authentication
- **Login Page:**
  - Username and password fields
  - JWT token-based authentication
  - Error messaging for failed login
  - Redirect to admin dashboard on success
  - Persistent sessions via localStorage

- **Protected Routes:**
  - All admin routes require authentication
  - Automatic redirect to login if not authenticated
  - Token expiration handling (7 days default)

#### 4.2.2 Settings Page
- **Church Configuration:**
  - Church name (text input)
  - Save button with success/error feedback

- **Planning Center Integration:**
  - Application ID field
  - Secret key field (password masked)
  - Save credentials button
  - Connection status indicator
  - Link to Planning Center app registration

#### 4.2.3 Locations Page
- **Location (Service Type) Management:**
  - Hierarchical display grouped by Planning Center folders (campuses)
  - Root folders represent campuses (e.g., "Corinth Campus", "Booneville Campus")
  - Each campus folder contains service types (e.g., "Sunday Morning", "Wednesday Night")
  - Table/grid view with columns: Service Type Name, Campus Folder, Assigned Service Type, Sync Status
  - Dropdown to select which service type to sync for each location
  - Toggle switches to enable/disable sync per location
  - Visual grouping by campus folder for clarity

- **Sync Actions:**
  - "Sync Locations from Planning Center" button
  - Fetches all service types and their parent folders (campuses)
  - Progress indicator during sync
  - Success/error messages
  - Count of locations synced/updated

- **Folder Display:**
  - Collapsible/expandable campus folder sections
  - Shows campus name as section header (e.g., "Corinth Campus", "Booneville Campus")
  - Groups all service types under their parent campus folder
  - Maintains Planning Center hierarchy structure
  - Example structure:
    - **Corinth Campus** (folder)
      - Sunday Morning (service type)
      - Wednesday Night (service type)
    - **Booneville Campus** (folder)
      - Sunday Morning (service type)

#### 4.2.4 Positions Page
- **Position List:**
  - Table view with columns: Position Name, Sync Status, Actions
  - Toggle switches to enable/disable sync per position
  - Last sync timestamp

- **Sync Actions:**
  - "Sync Positions from Planning Center" button
  - Progress indicator during sync
  - Success/error messages
  - Count of positions synced

#### 4.2.5 People Page
- **People List:**
  - Grid or table view of synced people
  - Display: Photo thumbnail, Name, Position
  - Sort by: Name, Position, Date synced
  - Search/filter by name or position

- **Photo Management:**
  - Click person card to upload photo
  - Drag-drop or file picker
  - Image preview before upload
  - Progress indicator
  - Automatic crop/resize if needed (max 5MB)

- **Sync Actions:**
  - "Sync People from Planning Center" button
  - Only syncs new people (checks PC person ID)
  - Only syncs enabled positions
  - Shows count of people added
  - Error handling for API failures

- **Delete Action:**
  - Delete button per person
  - Confirmation dialog
  - Removes person and deletes photo file

#### 4.2.6 Microphones Page
- **Microphone List:**
  - Cards showing microphone name, description
  - List of assigned people per microphone
  - Visual grouping

- **Microphone Management:**
  - "Add Microphone" button
  - Form: Name (required), Description (optional)
  - Edit existing microphones inline or in modal
  - Delete with confirmation

- **Drag-and-Drop Assignment:**
  - Left panel: Available people (not assigned)
  - Right panel: Microphone cards (droppable zones)
  - Drag person cards onto microphones
  - Drag from microphone back to available pool
  - Visual feedback during drag (hover states)
  - Instant save on drop

#### 4.2.7 Navigation
- **Admin Layout:**
  - Side navigation bar with links:
    - Dashboard (overview/home)
    - Settings
    - Locations (Service Types with folder hierarchy)
    - Positions
    - People
    - Microphones
    - Setlist
  - Logout button
  - Current user indicator
  - Breadcrumbs for context

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Display page load time: < 2 seconds
- Admin page load time: < 3 seconds
- Photo upload: < 5 seconds for 5MB file
- API response time: < 1 second for all endpoints
- Smooth drag-drop with no lag

### 5.2 Usability
- Intuitive navigation (< 3 clicks to any feature)
- Clear error messages with actionable guidance
- Responsive design for desktop (1920x1080 primary target)
- Accessibility: ARIA labels, keyboard navigation
- Consistent visual design language

### 5.3 Reliability
- 99% uptime for display view
- Auto-retry failed API calls (3 attempts)
- Graceful degradation if Planning Center unavailable
- Data persistence in database
- Error logging for debugging

### 5.4 Security
- JWT tokens with expiration
- HTTPS required in production
- Password hashing with bcrypt (10 rounds)
- CORS properly configured
- Input validation and sanitization
- File upload restrictions (images only, max 5MB)

### 5.5 Browser Support
- Chrome 90+ (primary)
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 6. Technical Architecture

### 6.1 Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite (build tool)
- React Router v6 (routing)
- Axios (HTTP client)
- Tailwind CSS (styling)
- react-beautiful-dnd (drag-drop)
- lucide-react (icons)

**Backend:**
- Node.js with Express
- TypeScript
- PostgreSQL (database)
- JWT (authentication)
- Multer (file uploads)
- Planning Center API (via axios)

**Infrastructure:**
- Docker (PostgreSQL container)
- Local file storage for photos

### 6.2 Data Flow

**Display Page:**
1. GET `/api/display/data` every 30s
2. Receives: church name, date, people array, setlist object
3. Renders UI with photos from `/uploads/photos/{filename}`

**Admin Sync Flow:**
1. Admin clicks "Sync People"
2. POST `/api/admin/people/sync` with JWT token
3. Backend fetches next Planning Center plan
4. Backend gets team members for enabled positions
5. Backend checks each person's PC ID against database
6. Backend creates new person records (skips existing)
7. Frontend receives count and refreshes people list

**Photo Upload Flow:**
1. Admin selects photo file
2. POST `/api/admin/people/{id}/photo` with multipart/form-data
3. Backend validates file (type, size)
4. Backend saves to `uploads/photos/` with unique filename
5. Backend updates person record with photo_path
6. Backend deletes old photo file if exists
7. Frontend shows new photo immediately

---

## 7. User Stories

### 7.1 Display View
- **US-001:** As a congregation member, I want to see large, clear photos of vocalists so I know who's leading worship.
- **US-002:** As a congregation member, I want to see the service order (setlist) so I can follow along.
- **US-003:** As a tech person, I want the display to auto-update so I don't have to manually refresh it.

### 7.2 Admin - Setup
- **US-004:** As a worship coordinator, I want to connect to Planning Center so I can sync data automatically.
- **US-005:** As a worship coordinator, I want to select which positions to sync so I only track relevant people.

### 7.3 Admin - People Management
- **US-006:** As a worship coordinator, I want to sync people with one click so I don't have to enter data manually.
- **US-007:** As a worship coordinator, I want to upload photos for each person so they appear on the display.
- **US-008:** As a worship coordinator, I want to delete people who no longer serve so the list stays current.

### 7.4 Admin - Microphone Assignment
- **US-009:** As a tech director, I want to create microphone records (Mic 1, Mic 2, etc.) so I can track assignments.
- **US-010:** As a tech director, I want to drag-and-drop people onto microphones so assignment is quick and visual.
- **US-011:** As a tech director, I want to see which people are assigned to which mics so I can set up sound correctly.

---

## 8. UI/UX Design Specifications

### 8.1 Color Palette
- **Primary:** Blue (#3B82F6) - Actions, links, primary buttons
- **Secondary:** Gray (#6B7280) - Secondary text, borders
- **Success:** Green (#10B981) - Success states
- **Error:** Red (#EF4444) - Errors, delete actions
- **Background:** White (#FFFFFF) - Main background
- **Surface:** Light Gray (#F3F4F6) - Cards, sections
- **Text:** Dark Gray (#1F2937) - Primary text

### 8.2 Typography
- **Headings:** Inter or system font, 600-700 weight
- **Body:** Inter or system font, 400 weight
- **Display (names):** Large, clear, high contrast
- **Minimum font size (display):** 24px for readability from distance

### 8.3 Spacing
- Consistent 4px grid (Tailwind default)
- Generous spacing on display view for clarity
- Compact, efficient spacing in admin panel

### 8.4 Components
- **Buttons:** Rounded corners, clear hover/active states
- **Cards:** Subtle shadows, white background
- **Forms:** Clear labels, validation feedback
- **Modals:** Centered, overlay background
- **Drag-drop:** Clear visual feedback (border changes, shadows)

---

## 9. API Integration

### 9.1 Planning Center Endpoints Used

**Base URL:** `https://api.planningcenteronline.com/services/v2`

**Authentication:** HTTP Basic Auth (App ID as username, Secret as password)

**Endpoints:**
1. `GET /service_types` - Get service types
2. `GET /service_types/{id}/plans?filter=future&order=sort_date&per_page=1` - Get next plan
3. `GET /plans/{id}/team_members?include=person&per_page=100` - Get team members
4. `GET /plans/{id}/items?order=sequence&per_page=100` - Get setlist items
5. `GET /people/v2/people/{id}` - Get person details
6. `GET /service_types/{id}/team_positions?per_page=100` - Get positions

### 9.2 Rate Limiting
- Planning Center: 100 requests/20 seconds per app
- Implement caching for frequently accessed data
- Batch requests where possible

---

## 10. Edge Cases & Error Handling

### 10.1 Planning Center Unavailable
- **Scenario:** API is down or credentials are invalid
- **Handling:**
  - Show last successfully synced data
  - Display error message in admin panel
  - Log error details
  - Allow manual retry

### 10.2 No Upcoming Plan
- **Scenario:** No future plans exist in Planning Center
- **Handling:**
  - Display message: "No upcoming service scheduled"
  - Show empty state with guidance
  - Still show previously synced people

### 10.3 Photo Upload Failures
- **Scenario:** File too large, wrong type, or upload error
- **Handling:**
  - Clear error message with specific reason
  - Size/type requirements shown upfront
  - Allow retry without page reload

### 10.4 Duplicate Person Sync
- **Scenario:** Person already exists (same PC ID)
- **Handling:**
  - Skip duplicate silently
  - Only create new records
  - Report count of new people added (not skipped)

### 10.5 Network Issues on Display
- **Scenario:** Display loses internet connection
- **Handling:**
  - Show last loaded data (don't crash)
  - Retry connection automatically
  - Optional: Show small "offline" indicator

---

## 11. Future Enhancements (Out of Scope for V1)

### 11.1 Phase 2 Features
- Logo upload (image file instead of text)
- Multiple service times/plans
- Historical view of past services
- Bulk photo upload via zip file
- Person profile pages with contact info

### 11.2 Phase 3 Features
- Mobile responsive admin panel
- Real-time updates via WebSockets
- Custom theming/branding per church
- Multi-church support (SaaS model)
- Analytics and reporting

### 11.3 Nice-to-Have
- Print view for service sheets
- Email notifications for assignments
- Calendar integration
- Song lyrics display integration

---

## 12. Risks & Mitigations

### 12.1 Risk: Planning Center API Changes
- **Impact:** High - Could break integration
- **Mitigation:** Monitor PC changelog, use versioned API endpoints, have fallback manual entry

### 12.2 Risk: Photo Storage Growth
- **Impact:** Medium - Disk space could fill up
- **Mitigation:** Implement max photo size, periodic cleanup of unused photos, consider cloud storage in future

### 12.3 Risk: Security Vulnerabilities
- **Impact:** High - Unauthorized access or data breach
- **Mitigation:** Regular security audits, keep dependencies updated, use HTTPS, implement rate limiting

### 12.4 Risk: Display Performance on Old Hardware
- **Impact:** Medium - Laggy display on older computers
- **Mitigation:** Optimize image sizes, minimize re-renders, test on various hardware, provide performance mode

---

## 13. Success Criteria

### 13.1 Launch Criteria (V1)
- ✅ All core features implemented and tested
- ✅ Planning Center sync working reliably
- ✅ Display view renders correctly on 1920x1080
- ✅ Admin panel fully functional
- ✅ Photo upload working
- ✅ Microphone drag-drop assignment working
- ✅ Error handling in place
- ✅ Documentation complete

### 13.2 Post-Launch Metrics (30 days)
- Successful syncs: > 95%
- User satisfaction: > 4/5
- Critical bugs: 0
- Average admin session time: < 10 minutes
- Display uptime: > 99%

---

## 14. Glossary

- **Planning Center (PC):** Cloud-based church management software with service planning features
- **Setlist:** Ordered list of songs and items in a church service
- **Position:** Role in Planning Center (e.g., "Vocalist", "Pastor")
- **Team Member:** Person assigned to a position in a specific plan
- **Sync:** Process of fetching data from Planning Center and storing it locally
- **PC Person ID:** Unique identifier for a person in Planning Center (prevents duplicates)
- **JWT:** JSON Web Token - used for stateless authentication

---

## 15. Appendices

### 15.1 Reference Documents
- Planning Center Services API: https://developer.planning.center/docs/#/apps/services
- React Router Documentation: https://reactrouter.com/
- Tailwind CSS Documentation: https://tailwindcss.com/

### 15.2 Revision History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Nov 2025 | Development Team | Initial PRD |

---

**Document Status:** ✅ Approved for Implementation
