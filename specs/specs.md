# Big-Dilly Project Specifications

## Executive Summary

Big-Dilly is a personal productivity web application combining two core features: a **Todo List** with template-based daily reset functionality, and a **TimeSince Tracker** for habit monitoring. The application supports multiple users with email/password authentication, cloud-synced data via SQLite, and a responsive design with three theme options (Light, Dark, Cyber-Neon).

The guiding principle is **simplicity**: minimal frameworks, straightforward user flows, and no unnecessary confirmation dialogs.

---

## Project Goals and Success Criteria

### Goals
1. Provide a fast, distraction-free todo management experience
2. Enable users to track elapsed time since important events/habits
3. Support daily workflow reset via a single-template system
4. Deliver a responsive experience across desktop and mobile devices

### Success Criteria
- Users can create, edit, delete, reorder, and complete todos
- Users can save their todo list as a template and reset to it with one click
- Users can create TimeSince trackers and reset them to track habits
- Authentication works reliably with email/password
- Application loads quickly and feels snappy
- All three themes render correctly across supported browsers

---

## User Personas and Use Cases

### Primary Persona: Daily Routine Optimizer
- **Who**: Someone who follows a consistent daily routine
- **Need**: Start each day with a pre-defined task list, check items off, reset the next day
- **Behavior**: Uses the template feature to maintain their standard daily checklist

### Secondary Persona: Habit Tracker
- **Who**: Someone building or maintaining habits
- **Need**: Visual reminder of how long since they last did something
- **Behavior**: Creates TimeSince trackers for habits, resets them when completed

### Use Case Examples
1. **Morning Reset**: User opens app, clicks "Reset to Template," sees their standard 10 daily tasks ready to go
2. **Habit Check**: User sees "Last Workout: 2 days, 14 hours" and is motivated to exercise
3. **Task Completion**: User drags completed tasks to reorder, checks them off throughout the day
4. **Template Update**: User adds a new recurring task to their list, saves current list as template

---

## Functional Requirements

### FR-1: User Authentication

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | Users can register with email and password | P1 |
| FR-1.2 | Users can log in with email and password | P1 |
| FR-1.3 | Users can log out | P1 |
| FR-1.4 | Users can reset forgotten password via email | P1 |
| FR-1.5 | Sessions persist across browser sessions until explicit logout | P1 |

### FR-2: Todo Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | Users can create a new todo item (text input) | P1 |
| FR-2.2 | Users can edit an existing todo item's text | P1 |
| FR-2.3 | Users can delete a todo item | P1 |
| FR-2.4 | Users can mark a todo item as complete/incomplete (toggle) | P1 |
| FR-2.5 | Users can reorder todo items via drag-and-drop | P1 |
| FR-2.6 | Completed todos are visually distinguished (strikethrough, dimmed) | P1 |
| FR-2.7 | Maximum of 20 todos per user enforced | P1 |
| FR-2.8 | Todo order persists across sessions | P1 |

### FR-3: Template System

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | Users can save current todo list as their template | P1 |
| FR-3.2 | Users can reset todos to template (replaces all current todos) | P1 |
| FR-3.3 | Each user has exactly one template | P1 |
| FR-3.4 | Template saves todo text and order only (not completion state) | P1 |
| FR-3.5 | No confirmation dialog on reset or save | P1 |
| FR-3.6 | Visual feedback confirms template save/reset completed | P1 |

### FR-4: TimeSince Trackers

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | Users can create a new tracker with name and icon | P1 |
| FR-4.2 | Users can edit a tracker's name and icon | P1 |
| FR-4.3 | Users can delete a tracker | P1 |
| FR-4.4 | Users can reset a tracker to "now" (current timestamp) | P1 |
| FR-4.5 | Trackers display elapsed time in "X days, Y hours" format | P1 |
| FR-4.6 | Elapsed time updates in real-time (or near real-time) | P1 |
| FR-4.7 | Maximum of 20 trackers per user enforced | P1 |
| FR-4.8 | Icon selection from predefined icon set | P1 |

### FR-5: Theming

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | Users can select from three themes: Light, Dark, Cyber-Neon | P1 |
| FR-5.2 | Theme preference persists across sessions | P1 |
| FR-5.3 | Theme applies immediately upon selection | P1 |

---

## Non-Functional Requirements

### NFR-1: Performance

| ID | Requirement |
|----|-------------|
| NFR-1.1 | Initial page load under 2 seconds on broadband connection |
| NFR-1.2 | Todo/tracker operations complete in under 200ms |
| NFR-1.3 | Drag-and-drop reordering feels instantaneous (optimistic UI) |

### NFR-2: Security

| ID | Requirement |
|----|-------------|
| NFR-2.1 | Passwords hashed using bcrypt or Argon2 |
| NFR-2.2 | Session tokens are cryptographically secure |
| NFR-2.3 | Users can only access their own data |
| NFR-2.4 | HTTPS required in production |
| NFR-2.5 | Password reset tokens expire after 1 hour |

### NFR-3: Reliability

| ID | Requirement |
|----|-------------|
| NFR-3.1 | Data persists reliably (no silent data loss) |
| NFR-3.2 | Graceful error handling with user-friendly messages |
| NFR-3.3 | Application recovers gracefully from network interruptions |

### NFR-4: Compatibility

| ID | Requirement |
|----|-------------|
| NFR-4.1 | Works on Chrome, Firefox, Safari, Edge (latest 2 versions) |
| NFR-4.2 | Responsive design supports screens from 320px to 2560px width |
| NFR-4.3 | Touch-friendly for mobile devices |

---

## Technical Architecture

### Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | **Svelte** | Minimal framework overhead, compiles to vanilla JS, simple reactivity |
| Backend | **Node.js + Express** | Simple, widely understood, matches JS frontend |
| Database | **SQLite** | Single-file database, no separate server, simple deployment |
| Auth | **Session-based** with secure cookies | Simpler than JWT for this use case |
| Styling | **CSS Variables** | Native theming support, no CSS framework needed |

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                             │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Svelte Application                  │    │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────┐  │    │
│  │  │   Todo   │ │ TimeSince│ │    Settings    │  │    │
│  │  │  Module  │ │  Module  │ │    Module      │  │    │
│  │  └──────────┘ └──────────┘ └────────────────┘  │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Node.js + Express                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │   Auth   │ │   Todo   │ │ TimeSince│ │ Template │   │
│  │  Routes  │ │  Routes  │ │  Routes  │ │  Routes  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                           │                              │
│                    ┌──────┴──────┐                      │
│                    │   SQLite    │                      │
│                    │  Database   │                      │
│                    └─────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'cyber-neon')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Password reset tokens
CREATE TABLE password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Todos table
CREATE TABLE todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    sort_order INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Templates table (stores todo items for template)
CREATE TABLE template_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- TimeSince trackers table
CREATE TABLE trackers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    last_reset DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_template_items_user_id ON template_items(user_id);
CREATE INDEX idx_trackers_user_id ON trackers(user_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
```

### API Endpoints

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Log in, create session |
| POST | `/api/auth/logout` | Destroy session |
| POST | `/api/auth/forgot-password` | Request password reset email |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/auth/me` | Get current user info |

#### Todos
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/todos` | Get all todos for current user |
| POST | `/api/todos` | Create new todo |
| PUT | `/api/todos/:id` | Update todo (text, completed) |
| DELETE | `/api/todos/:id` | Delete todo |
| PUT | `/api/todos/reorder` | Update sort order for all todos |

#### Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/template` | Get user's template |
| POST | `/api/template/save` | Save current todos as template |
| POST | `/api/template/reset` | Replace todos with template |

#### Trackers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trackers` | Get all trackers for current user |
| POST | `/api/trackers` | Create new tracker |
| PUT | `/api/trackers/:id` | Update tracker (name, icon) |
| DELETE | `/api/trackers/:id` | Delete tracker |
| POST | `/api/trackers/:id/reset` | Reset tracker to now |

#### User Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/user/theme` | Update theme preference |

---

## UI/UX Requirements

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Logo                              Theme │ User │ Logout │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   ┌─────────────────────┐   ┌─────────────────────┐     │
│   │       TODOS         │   │      TIMESINCE      │     │
│   │                     │   │                     │     │
│   │  [+] Add todo       │   │  [+] Add tracker    │     │
│   │                     │   │                     │     │
│   │  ☐ Todo item 1      │   │  🏃 Last Workout    │     │
│   │  ☐ Todo item 2      │   │     2 days, 4 hours │     │
│   │  ☑ Todo item 3      │   │              [Reset]│     │
│   │  ☐ Todo item 4      │   │                     │     │
│   │                     │   │  📚 Last Read       │     │
│   │                     │   │     14 hours        │     │
│   │                     │   │              [Reset]│     │
│   │                     │   │                     │     │
│   ├─────────────────────┤   └─────────────────────┘     │
│   │ [Save Template]     │                               │
│   │ [Reset to Template] │                               │
│   └─────────────────────┘                               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| < 768px (Mobile) | Single column, Todos above TimeSince |
| >= 768px (Tablet/Desktop) | Two columns side by side |

### Interaction Specifications

#### Todo Item Interactions
- **Click checkbox**: Toggle complete/incomplete
- **Click text**: Enter edit mode (inline)
- **Drag handle**: Reorder via drag-and-drop
- **Delete button**: Remove todo (appears on hover/focus)

#### Tracker Interactions
- **Click name/icon**: Enter edit mode
- **Reset button**: Set last_reset to current time
- **Delete button**: Remove tracker (appears on hover/focus)

#### Drag-and-Drop Behavior
- Visual indicator shows drop position
- Optimistic update (UI updates immediately)
- Smooth animation during drag
- Touch-friendly drag handles for mobile

### Theme Specifications

#### Light Theme
```css
--bg-primary: #ffffff;
--bg-secondary: #f5f5f5;
--text-primary: #1a1a1a;
--text-secondary: #666666;
--accent: #3b82f6;
--accent-hover: #2563eb;
--border: #e0e0e0;
--success: #22c55e;
--danger: #ef4444;
```

#### Dark Theme
```css
--bg-primary: #1a1a1a;
--bg-secondary: #2d2d2d;
--text-primary: #f5f5f5;
--text-secondary: #a0a0a0;
--accent: #60a5fa;
--accent-hover: #3b82f6;
--border: #404040;
--success: #4ade80;
--danger: #f87171;
```

#### Cyber-Neon Theme
```css
--bg-primary: #0a0a0f;
--bg-secondary: #12121a;
--text-primary: #e0e0ff;
--text-secondary: #8080a0;
--accent: #00ffff;
--accent-hover: #00cccc;
--border: #2a2a3a;
--success: #00ff88;
--danger: #ff0066;
--glow: 0 0 10px currentColor;
```

### Icon Set for Trackers

Provide a curated set of ~20 icons covering common habits:
- Fitness: running, dumbbell, yoga, cycling
- Health: water, medicine, sleep, meditation
- Productivity: book, code, write, study
- Self-care: shower, haircut, dentist
- Social: call, meetup, date
- Misc: laundry, clean, plant, pet

Use simple SVG icons or a lightweight icon font.

---

## Authentication Flow

### Registration Flow
1. User enters email and password
2. Validate email format and password strength (min 8 characters)
3. Check email not already registered
4. Hash password with bcrypt (cost factor 12)
5. Create user record
6. Create session
7. Redirect to main application

### Login Flow
1. User enters email and password
2. Look up user by email
3. Verify password against hash
4. Create session (secure, httpOnly cookie)
5. Redirect to main application

### Password Reset Flow
1. User enters email on forgot password page
2. Generate secure random token
3. Store token with 1-hour expiration
4. Send email with reset link
5. User clicks link, enters new password
6. Validate token not expired/used
7. Update password hash
8. Mark token as used
9. Redirect to login

### Session Management
- Sessions stored in database
- Session cookie: httpOnly, secure (in production), sameSite: strict
- Session expiration: 30 days
- Session extended on activity

---

## Constraints and Assumptions

### Constraints
- Maximum 20 todos per user
- Maximum 20 trackers per user
- Single template per user
- SQLite database (single file)
- No real-time collaboration features

### Assumptions
- Users have modern browsers (ES6+ support)
- Users have reliable internet connectivity
- Single-server deployment (SQLite limitation)
- Low to moderate user volume (SQLite suitable)

### Technical Constraints
- No WebSocket requirement (polling acceptable for tracker updates)
- No file uploads
- No third-party integrations

---

## Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| SQLite write contention under load | Performance degradation | Acceptable for expected user volume; migrate to PostgreSQL if needed |
| Drag-and-drop complexity on mobile | Poor UX | Use well-tested library (e.g., SortableJS) |
| Password reset email deliverability | Users locked out | Use reputable email service; provide support contact |
| Data loss from SQLite file corruption | User data lost | Regular automated backups |

---

## Future Considerations (Out of Scope for P1)

These features are explicitly NOT in scope but may be considered for future versions:

- **P2**: TimeSince goals ("do this twice a week")
- **P2**: Multiple templates per user
- **P2**: Todo categories/tags
- **P2**: Due dates and reminders
- **P2**: Data export (JSON/CSV)
- **P3**: Recurring todos
- **P3**: Sharing/collaboration
- **P3**: Mobile native apps
- **P3**: Offline mode with sync

---

## Development Phases

### Phase 1: Foundation
- Project setup (Svelte + Node.js + Express)
- Database schema and migrations
- Authentication system (register, login, logout, password reset)
- Basic UI shell with theming

### Phase 2: Todo Feature
- Todo CRUD operations
- Drag-and-drop reordering
- Template save and reset

### Phase 3: TimeSince Feature
- Tracker CRUD operations
- Real-time elapsed time display
- Reset functionality
- Icon selection

### Phase 4: Polish
- Responsive design refinement
- All three themes implemented
- Error handling and edge cases
- Performance optimization
- Testing

---

## Acceptance Criteria Summary

The project is complete when:

1. [ ] Users can register, log in, log out, and reset passwords
2. [ ] Users can create, edit, delete, complete, and reorder todos
3. [ ] Users can save todos as template and reset to template
4. [ ] Maximum 20 todos enforced
5. [ ] Users can create, edit, delete, and reset TimeSince trackers
6. [ ] Trackers display elapsed time in "X days, Y hours" format
7. [ ] Maximum 20 trackers enforced
8. [ ] All three themes work correctly
9. [ ] Application is responsive on mobile and desktop
10. [ ] All data persists correctly across sessions
