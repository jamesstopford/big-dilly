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

## Phase 2: Todo Feature

### 2.1 Todo API
- [ ] GET `/api/todos` - Get all todos for current user
- [ ] POST `/api/todos` - Create new todo (enforce max 20)
- [ ] PUT `/api/todos/:id` - Update todo (text, completed)
- [ ] DELETE `/api/todos/:id` - Delete todo
- [ ] PUT `/api/todos/reorder` - Update sort order for all todos
- [ ] Input validation and error handling

### 2.2 Todo UI Components
- [ ] TodoList component (container)
- [ ] TodoItem component (checkbox, text, edit mode, delete button)
- [ ] Add todo input field
- [ ] Inline editing on text click
- [ ] Completed state styling (strikethrough, dimmed)
- [ ] Count display (X/20 todos)

### 2.3 Drag-and-Drop
- [ ] Integrate SortableJS or similar lightweight library
- [ ] Visual drop indicator
- [ ] Optimistic UI updates
- [ ] Smooth drag animations
- [ ] Touch-friendly drag handles for mobile
- [ ] Persist new order to backend

### 2.4 Template System
- [ ] GET `/api/template` - Get user's template items
- [ ] POST `/api/template/save` - Save current todos as template
- [ ] POST `/api/template/reset` - Replace all todos with template items
- [ ] Save Template button with visual feedback
- [ ] Reset to Template button with visual feedback

---

## Phase 3: TimeSince Feature

### 3.1 Tracker API
- [ ] GET `/api/trackers` - Get all trackers for current user
- [ ] POST `/api/trackers` - Create new tracker (enforce max 20)
- [ ] PUT `/api/trackers/:id` - Update tracker (name, icon)
- [ ] DELETE `/api/trackers/:id` - Delete tracker
- [ ] POST `/api/trackers/:id/reset` - Reset last_reset to now

### 3.2 Tracker UI Components
- [ ] TrackerList component (container)
- [ ] TrackerItem component (icon, name, elapsed time, reset button, edit, delete)
- [ ] Add tracker form with icon picker
- [ ] Icon selection grid (~20 icons for common habits)
- [ ] Inline editing for name/icon
- [ ] Count display (X/20 trackers)

### 3.3 Elapsed Time Display
- [ ] Calculate elapsed time from last_reset
- [ ] Format as "X days, Y hours" (handle edge cases: <1 hour, >1 year)
- [ ] Real-time updates (setInterval every minute or reactive)
- [ ] Clean up intervals on component destroy

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
- [ ] Touch-friendly tap targets (min 44px)
- [ ] Test on various screen sizes

### 4.3 Error Handling & UX
- [x] API error responses (consistent format)
- [x] Client-side error display (toast/inline messages)
- [x] Loading states for async operations
- [ ] Network error recovery
- [x] Form validation feedback

### 4.4 Performance & Testing
- [ ] Optimize bundle size
- [ ] Lazy load non-critical components if needed
- [ ] Test all user flows manually
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile device testing

---

## Acceptance Criteria

- [ ] Users can register, log in, log out, and reset passwords
- [ ] Users can create, edit, delete, complete, and reorder todos
- [ ] Users can save todos as template and reset to template
- [ ] Maximum 20 todos enforced
- [ ] Users can create, edit, delete, and reset TimeSince trackers
- [ ] Trackers display elapsed time in "X days, Y hours" format
- [ ] Maximum 20 trackers enforced
- [ ] All three themes work correctly
- [ ] Application is responsive on mobile and desktop
- [ ] All data persists correctly across sessions

---

## Notes

- No confirmation dialogs - assume user competence
- Keep it simple - minimal frameworks, straightforward flows
- SQLite single-file database for simple deployment
- Session-based auth (simpler than JWT for this use case)
