# big-dilly Development Plan

## Project Overview
Web app with Todo and TimeSince functionality. Multi-user with email/password auth, cloud-synced via SQLite, responsive design with Light/Dark/Cyber-Neon themes.

## Tech Stack
- **Frontend:** Svelte
- **Backend:** Node.js + Express
- **Database:** SQLite
- **Auth:** Session-based with secure cookies
- **Styling:** CSS Variables

---

## Phase 1: Foundation [COMPLETE]

### 1.1 Project Setup
- [x] Initialize Node.js project with package.json
- [x] Set up Express server with basic routing
- [x] Configure Svelte frontend with build pipeline
- [x] Set up project structure (src/client, src/server, src/db)
- [x] Configure development scripts (dev, build, start)

### 1.2 Database Setup
- [x] Create SQLite database initialization script
- [x] Implement schema migrations (users, sessions, password_resets, todos, template_items, trackers)
- [x] Create database indexes for performance
- [x] Build database utility functions (query, run, get)

### 1.3 Authentication System
- [x] POST `/api/auth/register` - Create new account with email/password
- [x] POST `/api/auth/login` - Log in, create session cookie
- [x] POST `/api/auth/logout` - Destroy session
- [x] POST `/api/auth/forgot-password` - Request password reset email
- [x] POST `/api/auth/reset-password` - Reset password with token
- [x] GET `/api/auth/me` - Get current user info
- [x] Auth middleware for protected routes
- [x] Password hashing with bcrypt (cost 12)
- [x] Secure session cookie configuration

### 1.4 Basic UI Shell
- [x] Create Svelte app entry point
- [x] Build login/register pages
- [x] Build forgot password / reset password pages
- [x] Create main app layout (header with logo, theme toggle, user, logout)
- [x] Implement basic routing (auth pages vs main app)
- [x] Set up CSS variables for theming foundation

---

## Phase 2: Todo Feature [COMPLETE]

### 2.1 Todo API
- [x] GET `/api/todos` - Get all todos for current user
- [x] POST `/api/todos` - Create new todo (enforce max 20)
- [x] PUT `/api/todos/:id` - Update todo (text, completed)
- [x] DELETE `/api/todos/:id` - Delete todo
- [x] PUT `/api/todos/reorder` - Update sort order for all todos
- [x] Input validation and error handling

### 2.2 Todo UI Components
- [x] TodoList component (container)
- [x] TodoItem component (checkbox, text, edit mode, delete button)
- [x] Add todo input field
- [x] Inline editing on text click
- [x] Completed state styling (strikethrough, dimmed)
- [x] Count display (X/20 todos)

### 2.3 Drag-and-Drop
- [x] Integrate SortableJS or similar lightweight library
- [x] Visual drop indicator
- [x] Optimistic UI updates
- [x] Smooth drag animations
- [x] Touch-friendly drag handles for mobile
- [x] Persist new order to backend

### 2.4 Template System
- [x] GET `/api/template` - Get user's template items
- [x] POST `/api/template/save` - Save current todos as template
- [x] POST `/api/template/reset` - Replace all todos with template items
- [x] Save Template button with visual feedback
- [x] Reset to Template button with visual feedback

---

## Phase 3: TimeSince Feature [COMPLETE]

### 3.1 Tracker API
- [x] GET `/api/trackers` - Get all trackers for current user
- [x] POST `/api/trackers` - Create new tracker (enforce max 20)
- [x] PUT `/api/trackers/:id` - Update tracker (name, icon)
- [x] DELETE `/api/trackers/:id` - Delete tracker
- [x] POST `/api/trackers/:id/reset` - Reset last_reset to now

### 3.2 Tracker UI Components
- [x] TrackerList component (container)
- [x] TrackerItem component (icon, name, elapsed time, reset button, edit, delete)
- [x] Add tracker form with icon picker
- [x] Icon selection grid (~20 icons for common habits)
- [x] Inline editing for name/icon
- [x] Count display (X/20 trackers)

### 3.3 Elapsed Time Display
- [x] Calculate elapsed time from last_reset
- [x] Format as "X days, Y hours" (handle edge cases: <1 hour, >1 year)
- [x] Real-time updates (setInterval every minute or reactive)
- [x] Clean up intervals on component destroy

---

## Phase 4: Polish

### 4.1 Theme Implementation
- [x] Light theme CSS variables
- [x] Dark theme CSS variables
- [x] Cyber-Neon theme CSS variables (with glow effects)
- [x] PUT `/api/user/theme` - Update theme preference
- [x] Theme toggle UI in header
- [x] Persist theme choice to database
- [x] Apply theme on page load

### 4.2 Responsive Design
- [x] Mobile layout (< 768px): single column, todos above trackers
- [x] Desktop layout (>= 768px): two columns side by side
- [x] Touch-friendly tap targets (min 44px)
- [ ] Test on various screen sizes

### 4.3 Error Handling & UX
- [x] API error responses (consistent format)
- [x] Client-side error display (toast/inline messages)
- [x] Loading states for async operations
- [x] Network error recovery
- [x] Form validation feedback

### 4.4 Performance & Testing
- [x] Optimize bundle size (JS: 107.15KB -> 105.32KB, gzip: 34.02KB -> 32.19KB, 5.4% reduction)
- [ ] Lazy load non-critical components if needed
- [ ] Test all user flows manually
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile device testing

---

## Acceptance Criteria

- [x] Users can register, log in, log out, and reset passwords
- [x] Users can create, edit, delete, complete, and reorder todos
- [x] Users can save todos as template and reset to template
- [x] Maximum 20 todos enforced
- [x] Users can create, edit, delete, and reset TimeSince trackers
- [x] Trackers display elapsed time in "X days, Y hours" format
- [x] Maximum 20 trackers enforced
- [ ] All three themes work correctly (theme toggle not functional - see 5.1)
- [x] Application is responsive on mobile and desktop
- [ ] All data persists correctly across sessions

---

## Phase 5: Bug Fixes

### 5.1 Theme Selection Not Functional
- [ ] Fix theme toggle dropdown/selector not applying theme changes
- [ ] Verify ThemeToggle component is properly calling PUT `/api/user/theme`
- [ ] Ensure theme CSS class is being applied to document root
- [ ] Confirm theme preference loads correctly on page refresh
- [ ] Test all three themes (Light, Dark, Cyber-Neon) switch correctly

### 5.2 Icon Selector Modal Width
- [ ] Fix icon picker modal/dropdown being too narrow
- [ ] Last icon in each row is cut off - needs wider container
- [ ] Ensure icon grid displays all icons fully visible
- [ ] Verify fix works on both TrackerList (add form) and TrackerItem (edit mode)

---

## Notes

- No confirmation dialogs - assume user competence
- Keep it simple - minimal frameworks, straightforward flows
- SQLite single-file database for simple deployment
- Session-based auth (simpler than JWT for this use case)
