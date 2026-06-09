# Perpetual Task Companion (PTC) — Flutter Windows App Specification

> A complete, AI-ready build document describing the current web prototype so it can be re-implemented as a native Flutter Windows desktop application. This document is stack-agnostic at the conceptual level and Flutter-specific at the implementation level.

---

## 1. Product Overview

**Perpetual Task Companion (PTC)** is a lightweight productivity companion for Windows that helps people stay on top of their commitments across four time horizons — **Daily, Weekly, Quarterly, Yearly**. It is built around two surfaces:

1. **Main Window** — a full dashboard for planning, reviewing, and configuring.
2. **Always-on-top Pill Overlay** — a tiny, glanceable, semi-transparent capsule that floats in a corner of the screen on top of every other window, showing how many tasks remain today and expanding into a compact task panel on hover/click.

The core promise: *you never lose sight of what you committed to today, this week, this quarter, this year — without having to switch context.*

### Primary user
Knowledge workers, students, founders — anyone who lives inside other apps (IDE, browser, design tools) and forgets their plan.

### Core value props
- Always-visible micro-UI so plans stay top-of-mind.
- Single app, four horizons (no separate weekly/yearly tools).
- Built-in streaks + completion analytics for motivation.
- Instant capture via global hotkey.
- Celebration animation on task completion for positive reinforcement.

---

## 2. Tech Stack (Target)

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Flutter 3.x (Windows desktop)** | Single codebase, native window |
| Always-on-top + window mgmt | `window_manager` | `setAlwaysOnTop`, `setSize`, `setPosition`, frameless windows |
| Multi-window (overlay separate from main) | `desktop_multi_window` or a second `window_manager` instance | Overlay should be its own OS window so it can be always-on-top while the main window is not |
| Global hotkeys | `hotkey_manager` | `Win+T` toggle overlay, `Ctrl+Shift+T` quick add |
| System tray | `tray_manager` | Show/hide, quick add, quit |
| Local storage | `shared_preferences` (settings) + `sqflite_common_ffi` or `hive` (tasks/history) | Single-user local app |
| Charts | `fl_chart` | Bar chart for completion history |
| State | `riverpod` (recommended) or `provider` | App-wide reactive store |
| Confetti | `confetti` package | Celebration on task complete |
| Notifications | `local_notifier` (optional) | End-of-day nudge |
| Routing | `go_router` | Sidebar-driven navigation |

No backend. All data lives on disk in the user's profile.

---

## 3. Application Architecture

### 3.1 Two windows

```
┌─────────────────────────────────────────────────────────────┐
│  WINDOWS DESKTOP                                            │
│                                                             │
│  ┌──────────────────────────────────────┐    ╭──────────╮  │
│  │  MAIN WINDOW (normal, resizable)     │    │ 3 todos ⬤│  │ ← Pill overlay
│  │  - Dashboard / Daily / Weekly /      │    ╰──────────╯  │   (always on top,
│  │    Quarterly / Yearly / Settings     │                  │    semi-transparent,
│  │                                      │                  │    frameless, top-right
│  └──────────────────────────────────────┘                  │    by default)
│                                                             │
│                                       [taskbar]   ⏱ 14:32  │
└─────────────────────────────────────────────────────────────┘
```

Both windows read from and write to the **same task store**. Changes in either reflect instantly in the other (reactive state).

### 3.2 Data model

```dart
enum Period { daily, weekly, quarterly, yearly }

class Task {
  String id;             // uuid
  String title;
  Period period;
  bool completed;
  DateTime? completedAt;
  DateTime createdAt;
  String? dueTime;       // "HH:mm" string, optional
  String? notes;
  bool recurring;        // default false
}

class DailyHistory {
  String date;           // YYYY-MM-DD
  int total;
  int completed;
}

class PtcSettings {
  OverlayCorner overlayCorner;     // tl | tr | bl | br  (default tr)
  double collapsedOpacity;         // 0.20 – 0.90  (default 0.60)
  double expandedOpacity;          // default 0.95
  int hoverDelayMs;                // 0 – 2000     (default 1200)
  bool showStreak;                 // default true
  bool launchOnStartup;            // default true (Flutter: launch_at_startup)
  bool keepOnTop;                  // default true
}
```

Persistence keys: `ptc.tasks.v1`, `ptc.history.v1`, `ptc.settings.v1`.

### 3.3 Derived state

- `countByPeriod(p) → {total, completed}`
- `streak` — consecutive past days where `completed >= total && total > 0` (today included).
- `bestStreak` — `max(streak, 6)` as a seed for the demo; replace with persistent record in production.

### 3.4 Seed data (first launch)

10 demo tasks across all four periods (e.g. "Review morning emails", "Ship v2 of landing page", "Hire 2 engineers", "Read 24 books") plus 6 days of synthetic completion history so the dashboard is non-empty on first launch.

---

## 4. Design System

### 4.1 Brand & mood
Clean, calm, productive. Apple-meets-Linear. Soft warm background, single vivid blue accent, lots of whitespace, generous radii, restrained shadows.

### 4.2 Color tokens (HSL → Flutter `Color`)

Define these as a `ThemeExtension<PtcColors>` so every widget reads tokens, not raw colors.

| Token | Light HSL | Hex (approx) | Use |
|---|---|---|---|
| background | `38 50% 98%` | `#FBF9F4` | App background |
| foreground | `217 33% 17%` | `#1E2A3B` | Primary text |
| card | `0 0% 100%` | `#FFFFFF` | Card surfaces |
| primary | `217 91% 60%` | `#3B82F6` | Buttons, accents, chart bars |
| primary-glow | `217 91% 72%` | `#7AAEF9` | Gradient pair |
| secondary | `215 25% 96%` | `#F1F4F7` | Subtle surfaces, pill tab bg |
| muted | `215 25% 95%` | `#EEF1F4` | Inactive surfaces |
| muted-foreground | `215 16% 47%` | `#6B7785` | Secondary text |
| accent | `217 91% 96%` | `#ECF2FE` | Hover surfaces, nav active |
| accent-foreground | `217 91% 40%` | `#1D4FCB` | Text on accent |
| success | `160 84% 39%` | `#10B77F` | Completed checkbox, "online" dot |
| warning | `38 92% 50%` | `#F59E0B` | Streak flame, overdue dot |
| destructive | `0 84% 60%` | `#EF4444` | Delete, close hover |
| border | `215 25% 90%` | `#DDE3EA` | All hairlines |

Gradients:
- `gradient-primary`: `linear-gradient(135°, primary → primary-glow)` — used on the app icon tile only.

Shadows (use `BoxShadow` lists):
- `shadow-overlay`: `0 8px 32px -4px rgba(30,42,59,0.18), 0 2px 8px -2px rgba(30,42,59,0.08)` — pill overlay
- `shadow-window`: `0 24px 64px -12px rgba(30,42,59,0.35), 0 8px 24px -8px rgba(30,42,59,0.20)` — main window
- `shadow-card`: `0 1px 3px rgba(30,42,59,0.06), 0 1px 2px rgba(30,42,59,0.04)` — cards inside main window

### 4.3 Typography
- Family: **Inter** (bundle as asset; fall back to Segoe UI).
- Scale:
  - H1 page title — 24 px / w600
  - H2 section — 14 px / w600
  - Body — 14 px / w400
  - Small / labels — 12 px / w400 (`muted-foreground`)
  - Pill text — 13 px / w500
  - Tab labels — 12 px / w500
  - kbd / tabular — `JetBrains Mono` or `tabular-nums` numeric Inter
- Line height: 1.4–1.5.
- Antialiased.

### 4.4 Geometry
- Default radius: **12 px** (`--radius`). Cards 12, pill **9999 (fully rounded)**, buttons 8, inputs 8, dialogs 16.
- Spacing scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48.
- Borders: 1 px, color `border`.

### 4.5 Glass / blur (overlay only)
The pill overlay uses a frosted look:
- background: `Colors.white.withOpacity(0.78)` (collapsed) / `0.92` (expanded)
- backdrop: 20 px Gaussian blur with 1.8× saturation
- 1 px border at `Colors.white.withOpacity(0.6)`
- In Flutter, use `BackdropFilter(filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20))` inside a `ClipRRect`.

### 4.6 Motion
- Hover transition: 150 ms ease.
- Window/overlay open: 200 ms scale-from-95% + fade.
- Pill expand: 220 ms cubic `(0.4,0,0.2,1)`, scale 0.96→1, opacity 0→1.
- Confetti burst: ~1.2 s; non-blocking.

---

## 5. The Two Surfaces — Detailed Spec

### 5.1 PILL OVERLAY (always-on-top)

The pill is the **secondary surface** of the app. It is the user's persistent companion when the main window is not on screen — minimized, hidden, or closed-to-tray. It is intentionally tiny, glanceable, and slightly transparent so it never gets in the way, but it can blossom into a fully usable task panel in two deliberate steps.

#### 5.1.1 Visibility rules (when the pill appears)

The pill is **not** always rendered on screen. Its presence follows the main window state:

| Main window state | Pill visible? |
| --- | --- |
| Open and focused | **No** — pill is hidden. The user is already working in the full UI. |
| Open but unfocused (another app on top) | **No** — pill stays hidden; the main window itself is what the user sees when they alt-tab back. |
| Minimized (to taskbar) | **Yes** — pill fades in at the configured corner. |
| Closed via the window's `X` button (close-to-tray) | **Yes** — pill fades in; this is the canonical "background mode". |
| Quit via tray → Quit | No — app exits entirely. |

Transitions: when the pill appears, fade + 4 px slide-in from the corner over 180 ms. When the main window is restored/opened, fade the pill out over 140 ms and stop catching pointer events immediately so the user can click freely on the desktop.

Implementation note (Flutter / `window_manager`): listen to the main window's `onWindowMinimize`, `onWindowRestore`, `onWindowClose` (intercepted), `onWindowFocus`, and `onWindowBlur` events. Mirror that state into a `Riverpod` provider that the overlay window subscribes to via IPC (`desktop_multi_window` channel) to call `windowManager.show()` / `windowManager.hide()` on the overlay window.

#### 5.1.2 Window properties (overlay OS window)
- Frameless, transparent background, no taskbar entry, no shadow from the OS (we draw our own).
- Always-on-top: `true` while shown.
- Resizable: false. Movable: yes (drag anywhere on the body).
- Click-through: **off** — the pill must catch hover, click, and drag.
- Three distinct content sizes (the OS window animates between them):
  - **Collapsed (resting):** 132 × 32 px
  - **Peek (hover-revealed with close button):** ~168 × 32 px (collapsed width + ~36 px for the close affordance)
  - **Expanded (full panel):** 340 × 560 px (max; capped at 80 % of screen height)
- Initial position: 16 px inset from the corner stored in `settings.overlayCorner` (default top-right) on the primary monitor's work area.

#### 5.1.3 Three interaction states

The pill has **three** progressive states, not two. The user must dwell or click to advance — this is intentional so the pill never expands accidentally as the cursor crosses the corner.

```
   [ • 3 todos  🔥4 ]              ← Collapsed (resting)
              │ hover ≥ hoverDelay (default 1200 ms)
              ▼
   [ • 3 todos  🔥4 ] [ × ]         ← Peek: same pill, now interactive,
                                      with a close button revealed to the right
              │ click on the body of the pill
              ▼
   ┌─────────────────────────┐
   │ ● PTC · Always on top  ⌄│
   │ ─────────────────────── │
   │ Daily | Weekly | Q | Y  │
   │ ☐ Finish proposal       │
   │ ☑ Review emails         │     ← Expanded (full panel)
   │ ☐ Deep work block       │
   │ ─────────────────────── │
   │ [Add a daily task…] [+] │
   │ ▓▓▓▓░░░░  1/4   🔥4    │
   └─────────────────────────┘
```

##### State A — Collapsed (resting)

- Fully rounded capsule, height **32 px**, padding `14 × 6 px`, width hugs content (~132 px typical).
- Glass background (see §4.5), `shadow-overlay`.
- Opacity = `settings.collapsedOpacity` (default **0.60**). The translucency is the cue that it is "passive".
- Cursor: **default** (not a pointer) — the pill is *not* clickable in this state.
- Contents left → right:
  1. **Status dot** (6 px). `success` green when no overdue tasks; `warning` amber when any daily task is overdue.
  2. **Label** (13 px / w500):
     - `"3 todos"` when daily-incomplete > 0 (singular `"1 todo"`).
     - `"All done 🎉"` when zero incomplete daily tasks.
  3. **Streak chip** (only if `settings.showStreak && streak > 0`): flame icon + number, 11 px, `warning` color.
- Hovering it starts the dwell timer (see next state). Moving the cursor away cancels.

##### State B — Peek (hover-revealed close affordance)

This is the new intermediate state. Its only purpose is to (a) confirm to the user that the pill is now ready to be interacted with, and (b) surface the close-the-overlay action without forcing a full expansion.

- Trigger: cursor enters the collapsed pill AND remains over it for `settings.hoverDelay` ms (default **1200**).
- Animation: the OS window grows horizontally only, from collapsed width to peek width (~168 px), over **180 ms** with cubic `(0.4, 0, 0.2, 1)`. Height stays at 32 px — the pill is still a pill, just slightly longer.
- Visual changes vs collapsed:
  - Opacity ramps to **0.95**.
  - Subtle scale `1.00 → 1.02` on the entire pill.
  - Cursor becomes a **pointer** over the label/body area.
  - A **close button** (`×`, 20 px target, 14 px icon, `muted-foreground` → `destructive` on hover) appears at the right edge with a 140 ms fade + 4 px slide-in. There is a 1 px hairline divider (`border` color, 50 % opacity) between the body and the close button so the two hit areas are visually distinct.
- Hit zones in peek state:
  - **Pill body** (everything left of the divider) → on click, advance to **Expanded** state.
  - **Close button** (`×`) → on click, **hide the overlay** and **restore the main window** (`windowManager.restore()` + `windowManager.focus()` on the main window; overlay window calls `windowManager.hide()` on itself). This is the only way to dismiss the overlay back to the main app from the pill.
- Exit from peek state:
  - Cursor leaves the entire pill area → reverse the animation (collapse width back to 132 px, fade close button out, opacity back to `collapsedOpacity`, cursor back to default) over 160 ms. A 200 ms grace period prevents flicker when the cursor briefly grazes the divider.
  - Clicking the body → advance to Expanded (see below).
  - Clicking `×` → overlay hides, main window restores.

##### State C — Expanded (full panel)

- Trigger: click anywhere on the pill body while in Peek state. (Also reachable via the `Win + T` global hotkey from any state.)
- Animation: the OS window resizes from peek (~168 × 32) to expanded (340 × 560) over **220 ms** cubic `(0.4, 0, 0.2, 1)`, anchored to the corner the pill is docked at, with the panel content fading + scaling from 0.96 → 1.0. The original pill row morphs into the expanded panel's **header strip** — the status dot stays in place; the label is replaced by `"PTC · Always on top"`; the close `×` is replaced by a chevron-down (`⌄`).
- Background: glass-strong (§4.5), `shadow-overlay`, **16 px** corner radius. Opacity = `settings.expandedOpacity` (default 0.95).
- Sections (top → bottom):
  1. **Header strip** (32 px):
     - Left: green status dot + caption `"PTC · Always on top"` (12 px, `muted-foreground`).
     - Right: chevron-down button → **collapses back to State A (resting)**, skipping Peek. (We do *not* go back to Peek because the cursor is by definition over the panel here, which would immediately re-trigger Peek and feel jittery.)
  2. **Period tabs** (4 equal columns in a `secondary`-tinted rounded bar, 8 px top margin, 12 px side margin):
     - `Daily | Weekly | Quarterly | Yearly`.
     - Each tab shows the remaining count in parens at 10 px, e.g. `Daily (3)`.
     - Active tab: white background + small shadow.
  3. **Task list** (scrollable, flexes to fill):
     - Dense rows (28 px), smaller than the main window's 36 px rows.
     - Row: round checkbox (20 px) + title (14 px) + optional due time (12 px tabular, `muted-foreground`) + delete (`×`, shown only on row hover).
     - Completed tasks: strike-through, `muted-foreground`, sorted to the bottom.
     - Empty state: centered 48 px accent circle with check icon + hint `"No {period} tasks. Add one below!"`.
  4. **Inline add form** (above footer):
     - 32 px text input + square `+` button.
     - Placeholder per tab: `"Add a daily task…"`, etc.
     - `Enter` submits and clears.
  5. **Footer strip**:
     - 6 px progress bar = `completed / total` of active tab.
     - `1/4` tabular count.
     - If `showStreak && streak > 0`: flame + number in `warning`.
- Dismissal back to **State A (Collapsed)**:
  - Press `Esc`.
  - Click the chevron-down in the header.
  - Click outside the panel (the overlay window's hit-test extends a few px outside the body to detect "outside" clicks; on outside click, collapse).
- **There is no `×` close button in the expanded panel.** Closing the overlay (and restoring the main window) is exclusively a Peek-state action — this keeps the expanded panel focused on task work.

#### 5.1.4 Drag / move

The pill can be dragged in any of its three states. Hold left mouse on the body (not on the `×` or chevron) and drag. On release, the OS window snaps to the nearest of the four corners and the chosen corner is persisted to `settings.overlayCorner`. While dragging, opacity bumps to 0.95 and the dwell timer is suspended.

#### 5.1.5 Keyboard

- `Win + T` (global hotkey, `hotkey_manager`) — toggle directly between **Collapsed** and **Expanded**, skipping Peek. If the overlay is currently hidden because the main window is open, this hotkey first hides the main window to tray, then shows the overlay in Expanded state.
- `Esc` — collapse Expanded → Collapsed. No effect in Peek (cursor-driven).

#### 5.1.6 State machine summary

```
                ┌──────────────────────────────────────────┐
                │                                          │
   [hidden] ──main minimized/closed──▶ Collapsed           │
       ▲                                  │                │
       │                       hover ≥ hoverDelay          │
       │                                  ▼                │
   main restored ◀── click × ──        Peek                │
       ▲                                  │                │
       │                          click body / Win+T       │
       │                                  ▼                │
       └────── main window opens ──── Expanded ────Esc/⌄/outside─┘
```

#### 5.1.7 Acceptance criteria specific to the pill

1. Pill is hidden whenever the main window is visible; appears within 200 ms of the main window minimizing or closing-to-tray.
2. Resting pill never advances to Peek without a continuous hover of at least `hoverDelay` ms.
3. From Peek, clicking `×` hides the overlay and brings the main window back to the foreground in a single action.
4. From Peek, clicking the body expands to the full panel without the `×` causing a stray hit.
5. Expanded panel does **not** contain an `×` close button; only chevron / `Esc` / outside-click collapse it.
6. Width transitions (Collapsed ↔ Peek) animate horizontally only — height stays 32 px.
7. Dragging works in all three states and persists corner on release.



### 5.2 MAIN WINDOW

#### Window properties
- Standard Windows chrome OR a custom title bar (recommended for brand consistency — current prototype uses a custom title bar with minimize/maximize/close).
- Default size **1180 × 760**, min size **900 × 600**.
- Resizable, maximizable, minimizable.
- Always-on-top: **false** (only the overlay floats).
- Closing the main window should **not** quit the app; the pill overlay + tray icon keep running. "Quit" is explicit via tray menu.

#### Layout (3 zones)

```
┌─────────────────────────────────────────────────────────────┐
│  ✓  Perpetual Task Companion                  ─  □  ✕      │ ← Title bar (36 px)
├──────────┬──────────────────────────────────────────────────┤
│ Sidebar  │  Content area (scrollable)                       │
│ (208 px) │                                                  │
│          │                                                  │
│  Dash    │                                                  │
│  Daily   │                                                  │
│  Weekly  │                                                  │
│  Quart.  │                                                  │
│  Yearly  │                                                  │
│  Settgs  │                                                  │
│          │                                                  │
│  ──────  │                                                  │
│  🔥 6 d. │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

##### Title bar (36 px tall)
- Background `secondary/70`, 1 px bottom border.
- Left: blue check icon + `"Perpetual Task Companion"` in 12 px muted text.
- Right: three 44 × 36 px buttons — minimize, maximize, close.
  - Minimize hover → `accent` background.
  - Maximize hover → `accent` background.
  - Close hover → `destructive` background, white icon.
- Make the empty space draggable (`window_manager.startDragging()` on pan).

##### Sidebar (208 px wide)
- Background `background`, 1 px right border.
- Six nav items, each 36 px tall, 8 px gap, 12 px horizontal padding, 6 px radius:
  - **Dashboard** (LayoutDashboard icon)
  - **Daily** (CalendarDays)
  - **Weekly** (CalendarRange)
  - **Quarterly** (Target)
  - **Yearly** (Globe)
  - **Settings** (Settings gear)
- Active: `accent` background, `accent-foreground` text, w500.
- Inactive: `muted-foreground`, hover → `secondary` background.
- Bottom (pushed to base with spacer + 1 px top border + 12 px padding):
  - 🔥 flame (warning) + `"Streak: 6 days"` (number is `foreground` w500).

##### Content area (per view)

###### A. Dashboard
- Header: `"Good to see you 👋"` (24/w600) + subtitle `"Here's how your follow-through looks today."` (14, muted).
- **Period summary cards** — 4-up grid, each card:
  - 16 px padding, 12 px radius, `card` bg, `shadow-card`, 1 px border.
  - Hover: border tints to `primary/40`.
  - Icon + period name (12 px muted).
  - Big number `completed` (24/w600 tabular) + `/ total` (14 muted).
  - 6 px progress bar at the bottom.
  - Clicking the card navigates to that period view.
- **Completion chart card** — full-width:
  - Header row: title `"Completion · {label}"` with TrendingUp icon + subtitle `"Average {avg}% — keep the momentum."`
  - Period switcher (pill tabs): `Daily | Weekly | Quarterly | Yearly` in a `secondary` rounded container. Selected pill has white background + small shadow.
  - Chart: `fl_chart BarChart`, height ~224 px, X axis = labels (`Mon, Tue…` / `Wk 1…Wk 7` / `Q1…Q4` / `2021…2025`), Y axis = 0–100, dashed reference line at average using primary color, bars 6-px-rounded top corners, color = primary.
  - Tooltip on hover shows `"75% (3/4)"`.
  - **Data sources** for non-daily periods: the prototype synthesises plausible mock data; in production these should be aggregated from `DailyHistory` (weekly = ISO week sums; quarterly = calendar-quarter sums; yearly = calendar-year sums).
- **Stat cards** — 2-up:
  - Current streak (warning-tinted icon tile + "Complete all daily tasks to extend.")
  - Best streak (primary-tinted + "Your record. Beat it!")

###### B. Daily / Weekly / Quarterly / Yearly views
Identical layout, parameterised by `period`:
- Header row: page title `"{Period} Tasks"` (24/w600) + subtitle `"{completed} of {total} completed"`.
- Right side: **Add task** button (primary) with `+` icon → opens **AddTaskDialog** with `period` locked to the current view.
- Below: a 12-px-radius card containing the **TaskList** (non-dense rows, 44 px tall):
  - Round checkbox (20 px). Unchecked = 2 px `muted-foreground/40` border, hover → `primary` border. Checked = filled `success` with white check, animation 150 ms.
  - Task title 14 px. Strike-through + muted when completed.
  - Optional due time at right (12 px tabular).
  - Trash icon button appears on row hover.
  - Completed items sort to bottom.
- Empty state: same centered illustration tile as overlay; hint `"No {period} tasks yet. Click \"Add task\" to create one."`

###### C. Settings
Three cards stacked, max width 768:

1. **Overlay**
   - Screen position — Select with options Top-left / Top-right / Bottom-left / Bottom-right.
   - Collapsed opacity — Slider 20–90 %, step 5, live label `%`.
   - Hover activation delay — Slider 0–2000 ms, step 100, live label `ms`.
   - Show streak — Switch ("Display 🔥 in the collapsed widget.").
2. **Hotkeys** — read-only chips, 2-column grid:
   - Toggle overlay → `⊞ + T`
   - Quick add task → `Ctrl + Shift + T`
3. **Reset demo data** — outline button to restore seed tasks/history.

(Recommended additions for the Flutter build: "Launch on startup" toggle, "Keep on top" toggle, theme mode.)

### 5.3 ADD-TASK DIALOG (modal in main window)

- Centered modal, 448 px wide, `card` background, 16 px radius, scrim behind.
- Title: `"New task"` + description `"Add a task to your {period} list."`
- Field 1: **Task title** — Input, autofocus, placeholder `"What needs to get done?"`.
- Field 2 (only when not period-locked): **Period** — Select (Daily/Weekly/Quarterly/Yearly).
- Footer: outline `Cancel` + primary `Add task` (disabled until title not empty).
- On submit: add to store, toast `"Added to {Period}"`, close.
- `Esc` cancels; `Enter` submits.

### 5.4 QUICK ADD (global, lightweight)

A spotlight-style command surface anchored ~18 vh from the top of the active monitor, summoned from anywhere by `Ctrl + Shift + T`. In Flutter, implement as a small frameless second window (or an overlay on the main window if the user prefers single-window).

- 440 px wide, 16 px radius, glass-strong background, soft scrim behind.
- Single input, 44 px tall, no border, large placeholder `"Add a task… (suffix +d / +w / +q / +y)"`.
- Suffix parsing: the trailing token `d|w|q|y` chooses period; the rest becomes the title.
  - `"Pay invoice w"` → title=`"Pay invoice"`, period=weekly.
- Below input: tiny period pill row (Daily/Weekly/Quarterly/Yearly) reflecting current parse; clicking overrides.
- Hint right: `"Enter to save · Esc to cancel"`.
- On submit: addTask + toast + close.

### 5.5 CELEBRATION

Whenever any task transitions from incomplete → complete:
- Fire a full-screen confetti burst (centered, ~120 particles, 90° spread) plus 1.2 s of alternating bottom-left and bottom-right side bursts.
- Palette: `#3B82F6, #22C55E, #F59E0B, #EC4899, #A855F7`.
- Must render **above** the overlay (highest Z) and not block clicks.
- In Flutter: use the `confetti` package with two `ConfettiController`s, or stack `ConfettiWidget`s in an `Overlay`.
- No celebration when un-completing.

### 5.6 SYSTEM TRAY

Single tray icon. Right-click menu:
- Show main window
- Quick add… (triggers QuickAdd)
- Keep on top ✓ (toggles overlay always-on-top)
- ─
- Quit PTC

Left-click: show main window.

### 5.7 STARTUP

- App launches → restore tasks, history, settings from disk.
- Spawn overlay window first (it's the persistent surface).
- If `launchOnStartup` is true, register with Windows via `launch_at_startup`.
- Main window opens on first run; on subsequent runs only if the user previously left it visible.

---

## 6. Interaction Specs (Hotkeys & Behaviors)

| Action | Trigger |
|---|---|
| Toggle pill expand/collapse | `Win + T` (global) |
| Quick add | `Ctrl + Shift + T` (global) |
| Close any modal/overlay | `Esc` |
| Submit forms | `Enter` |
| Drag overlay | Mouse drag the pill; snaps to nearest corner |
| Complete task | Click checkbox → fires celebration |
| Delete task | Hover row → trash icon → click |
| Navigate sections | Sidebar click |

---

## 7. Visual References from the Prototype

When in doubt, the running web prototype is the source of truth for visuals. Key files that map 1:1 to Flutter widgets:

| Prototype file | Flutter equivalent |
|---|---|
| `Overlay.tsx` | `OverlayWindow` — frameless second window with `PillWidget` + `ExpandedPanelWidget` |
| `AppWindow.tsx` | `MainWindowScaffold` with `Sidebar` + `Dashboard` / `PeriodView` / `SettingsView` |
| `DesktopFrame.tsx` | *Not needed* — real Windows desktop replaces this simulation |
| `TaskList.tsx` | `TaskListView` widget |
| `AddTaskDialog.tsx` | `showDialog(...)` with `AddTaskDialog` widget |
| `QuickAdd.tsx` | `QuickAddWindow` (separate frameless window or overlay) |
| `celebrate.ts` | `CelebrationController` wrapping `confetti` package |
| `ptc-store.tsx` | `PtcRepository` + Riverpod providers (`tasksProvider`, `settingsProvider`, `streakProvider`) |
| `ptc-types.ts` | `lib/models/task.dart`, `period.dart`, `settings.dart` |
| `index.css` tokens | `lib/theme/ptc_theme.dart` + `PtcColors` ThemeExtension |

---

## 8. Acceptance Criteria

The Flutter build is "done" when:

1. **Two windows** coexist: main app + pill overlay; closing main does not kill overlay.
2. Pill **stays above every other window** on Windows when "Keep on top" is on.
3. Pill **expands on hover-after-delay** and on click; collapses on Esc/outside.
4. All four **tabs/views** show correctly filtered tasks; counts and progress bars update reactively.
5. **Add Task dialog** and **Quick Add** both create tasks and update both surfaces instantly.
6. **Completing a task** triggers full-screen confetti and updates streak/charts.
7. **Streak** counts consecutive days where all daily tasks were finished.
8. **Settings** persist across restarts: corner, opacity, hover delay, show-streak.
9. **Hotkeys** `Win+T` and `Ctrl+Shift+T` work globally even when the app is unfocused.
10. **Theme** matches the token table; no hard-coded colors in widgets.
11. **Performance**: overlay renders <16 ms/frame at idle; CPU <1% when idle.
12. **Persistence**: tasks/history survive app and OS restart.

---

## 9. Out of Scope (for v1)

- Sync / cloud / multi-device.
- Sharing or collaboration.
- Mobile / macOS / Linux builds.
- Calendar integration.
- AI suggestions.
- Themes beyond light mode (dark mode is a stretch goal; tokens are already structured to support it).

---

**End of Specification.** Hand this document to your Flutter coding assistant along with screenshots of the web prototype for pixel-level reference.
