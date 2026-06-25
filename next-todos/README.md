# next-todos

> A "simple" todo app that quietly solves the hard parts of rendering a large,
> server-owned list in the browser: cursor pagination, bidirectional infinite
> scroll, DOM virtualization, and a bounded in-memory working set — all behind an
> interface that feels like an ordinary checklist.

**Live demo:** https://next-todos-influx6-influx6s-projects.vercel.app

Built with **Next.js 16 (App Router)**, **React 19**, **Server Actions**,
**TypeScript**, and **Tailwind CSS v4**.

---

## What it does

- Renders a todo list backed by a 1,000-item dataset that lives entirely on the
  server.
- **Pending / Completed / New** tabs, each independently paginated.
- Add a todo, complete a todo, and search — with the dashboard counts staying in
  sync.
- Scroll up and down forever: the list pages in seamlessly in both directions and
  you can travel all the way to the start or the end.

The point of the project isn't the todo feature set — it's that a list of this
size is handled correctly. The browser never receives, holds, or renders the
whole thing.

---

## Why it's more than a todo app

A naive todo list ships every item to the client and renders every row. That
falls over as the list grows: huge payloads, thousands of DOM nodes, and
eventually out-of-memory. This project treats the list the way a real product
has to, and hides that machinery behind a clean component API.

Three problems, three deliberate solutions:

### 1. Infinite scroll via IntersectionObserver

The first attempt drove loading from the scroll wheel — measuring `scrollTop`,
`scrollHeight`, and `clientHeight` to decide when to fetch. That math is
notoriously brittle: it misbehaves near the top and bottom edges, fights browser
zoom and high-DPI rounding, and is easy to get subtly wrong.

The current implementation replaces all of that with two **sentinel** elements at
the top and bottom of the loaded window, watched by an `IntersectionObserver`
(`app/hooks/useIntersectionObserver.ts`). When a sentinel enters the viewport
(with a prefetch `rootMargin`), the corresponding `load_previous` / `load_next`
fires. No pixel arithmetic to decide *whether* to load — the browser tells us.

Because prepending or evicting a batch shifts the content above the viewport, a
small `useLayoutEffect` keeps the viewport visually anchored by diffing the task
list and adjusting `scrollTop` by exactly the number of fixed-height rows that
moved — so loading more never makes the page jump under your cursor.

### 2. Server-rendered todos that update efficiently

The list is owned by the server (`app/server/store.ts`) and exposed through
**Server Actions** (`app/server/actions.ts`) — no REST layer, no client data
store to keep coherent.

- The **first page is server-rendered** in `app/page.tsx` (`loadTodos(0,
  "pending")` + counts), so first paint is real content, not a spinner.
- Pagination is **cursor-based over the tab-filtered view**: `getTodos(cursor,
  tab)` filters first, then slices, returning `prevCursor` / `nextCursor`. The
  cursor is an index into the filtered list, so the window always lines up with
  what the client renders.
- **Mutations are surgical.** Adding (`createTodo`) and completing
  (`toggleTodo`) go straight to the server; the client then reloads just the
  active tab's first window and refreshes the counts. A completed item correctly
  drops out of *Pending* and reappears under *Completed*, and the dashboard
  numbers follow — without re-fetching the entire list.

### 3. Bounded memory via a 3-batch sliding window

This is the core of the design (`app/hooks/todo_fetcher.ts`). The client holds **at
most 3 batches of 20 items (60 todos)** in memory at any time, no matter how large
the underlying list:

```
Initial      →  [b0]                items 0..19
next ×2      →  [b0, b1, b2]        items 0..59
next         →  evict b0, load b3   items 20..79   (still only 60 in memory)
previous     →  load b's prevCursor, evict the newest   items 0..59
```

- **Scrolling down** appends the next batch and evicts the oldest from the front.
- **Scrolling up** prepends the previous batch and evicts the newest from the
  back.
- `windows[0].prevCursor` always points at the batch *before* the current window
  — even after it's been evicted — so you can walk back to the very start without
  extra bookkeeping, and `nextCursor` lets you run to the very end.

On top of the bounded working set, the list is **virtualized**
(`app/client/todo_list.tsx`): with fixed-height rows it renders only the visible
slice plus a small buffer, using padding spacers to preserve scroll geometry. So
the *DOM* node count stays tiny too — the combination is what keeps the app from
ever growing unbounded in either memory or render cost.

---

## Architecture at a glance

```
app/
├─ page.tsx                     Server component — SSR first window + counts
├─ server/
│  ├─ store.ts                  In-memory dataset; tab-filtered cursor pagination
│  ├─ actions.ts                Server Actions: load / counts / create / toggle / search
│  └─ dashboard.tsx             Pending / Completed / New count cards
├─ hooks/
│  ├─ todo_fetcher.ts           useTodoFetcher: 3-batch sliding window over server pagination
│  ├─ useIntersectionObserver.ts  Reusable sentinel observer hook
│  ├─ debounce.ts               Debounced search input
│  └─ async_guard.ts            Serializes in-flight requests
└─ client/
   ├─ todo_app.tsx              Orchestrates fetch + counts + add/toggle/filter
   ├─ tabsheet.tsx              Tabs + debounced search (loads paused while searching)
   ├─ todo_list.tsx            Virtualized list + IntersectionObserver triggers
   └─ todo.tsx                  Single row
```

**Data flow:** server SSRs the first window → `useTodoFetcher` manages the sliding
window via Server Actions → `VirtualTodoList` renders the visible slice and fires
sentinel-driven loads → mutations reload the active tab and refresh counts.

---

## Senior-level engineering on display

- **Choosing the right primitive.** Recognizing that scroll-math infinite scroll
  is a dead end and migrating to an observer-based approach — then handling the
  follow-on details (scroll anchoring, prefetch margins, edge cases) rather than
  declaring victory at the happy path.
- **Designing for constraints, not demos.** A bounded 3-batch window plus DOM
  virtualization means the app's memory and render cost are *independent of list
  size*. It behaves the same at 60 items or 60,000.
- **A clean server/client contract.** Cursor pagination over a filtered view,
  Server Actions instead of bespoke endpoints, and SSR for first paint — each
  hides complexity behind a small, well-named surface.
- **Composable, testable seams.** The observer, the fetcher, the debounce, and the
  request guard are isolated hooks with single responsibilities, so the UI
  components stay declarative.
- **Verified, not assumed.** Behaviors (scroll loading, eviction, toggle removal)
  were validated by driving the real app with Playwright.

---

## Getting started

```bash
pnpm install
pnpm dev
# open http://localhost:3000
```

Production build:

```bash
pnpm build
pnpm start
```

> The dataset is an in-memory store seeded from `app/server/todos.json`, so
> mutations reset on server restart — the focus here is the rendering and data-flow
> architecture, not persistence.
