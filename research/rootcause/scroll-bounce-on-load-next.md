# Scroll "bounce" when loading the next batch

## Root cause (intro)

When you scroll to the bottom of the virtualized list and a new batch loads, the
scroll position **snaps backward by exactly one batch (≈960px) for a single frame**
before settling — the visible "bounce".

It is caused by two things that compound at the load boundary:

1. **The virtualization renders from a lagged copy of the scroll position.** The
   visible slice (`startIndex` / `paddingTop`) is derived from the `scrollTop`
   React *state*, but that state is only updated by the **async `onScroll` event**.
   So the rendered window permanently trails the real DOM `scrollTop` by ~1 frame
   (one wheel tick, ~120px). During normal scrolling this is invisible because
   `BUFFER = 3` (144px) absorbs it.

2. **The load-anchor yanks `scrollTop` by a whole batch in one commit.** When
   `loadNext` evicts the oldest batch, a `useLayoutEffect` does
   `container.scrollTop -= evictedItems * ITEM_HEIGHT` (= 20 × 48 = **960px**) to
   keep the content anchored — but it does **not** update the `scrollTop` state in
   that same commit. So for one frame the DOM is at the new position while the
   virtualization is still rendering for the old one. The gap (960px) is ~6.6×
   larger than the buffer, so the viewport paints the wrong slice, then the next
   `onScroll` corrects it. That correction is the bounce.

Separately, even with the flash removed, the **scrollbar thumb still jumps back a
batch on every load**, because the scrollable height only ever represents the 3
loaded batches (`tasks.length * ITEM_HEIGHT`), not the full list. Position can never
progress past the bottom third; it keeps resetting. That backward snap mid-wheel is
the "fighting you" feel.

This is why it is **intermittent**: it only happens when a load crosses the
3-batch capacity/eviction boundary. Earlier scrolls just append (no eviction → no
`scrollTop` correction → no bounce).

---

## How it was reproduced

The deployed preview URL is behind Vercel authentication (redirects to a Vercel
login), so it was reproduced on a local production build — `next build &&
next start` — which is the same code path and matches what is seen locally.

A Playwright probe drove the mouse wheel down the **Completed** tab (307 completed
items → easily reaches capacity) and logged, every animation frame, the real DOM
`scrollTop` against the `paddingTop` the virtualization was rendering.

### Evidence

```
frame  scrollTop  delta   paddingTop  expected   note
#68    2040       +120    1776        1872       lag 96px  (normal, within buffer)
#72    2160       +120    1872        2016       lag 144px (normal, within buffer)
#73    1200       -960    2016        1056       960px MISMATCH  ← the bounce
#76    1320       +120    1056        1152       back to normal lag
```

- Frames #8–#72: a **constant ~120px lag** between the rendered `paddingTop` and the
  value expected from the live `scrollTop` — confirms cause (1), the async-state lag.
- Frame #73: `scrollTop` is slammed from 2160 → 1200 (−960, exactly one batch) by
  the anchor effect, while `paddingTop` is still 2016 — a **960px** one-frame
  mismatch. Confirms cause (2).
- A second probe showed the same `scrollTop` (1200) rendering two **different** top
  rows on consecutive frames (`"Automate integration tests…"` then
  `"Refactor REST API…"`) — the visible content flash.
- The pattern repeats identically at every capacity-crossing load (#73, #105, #137…).

---

## Relevant code

`app/client/todo_list.tsx`

- Virtualization reads lagged state:
  ```tsx
  onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
  const paddingTop = startIndex * ITEM_HEIGHT;
  ```
- Anchor effect mutates the DOM scroll without syncing the state:
  ```tsx
  const evicted = prev.findIndex((t) => t.id === tasks[0].id);
  if (evicted > 0) container.scrollTop -= evicted * ITEM_HEIGHT; // no setScrollTop
  ```
- Scroll area only spans the loaded window:
  ```tsx
  const totalHeight = tasks.length * ITEM_HEIGHT; // 3 batches, not the full list
  ```

---

## Fixes (smallest → most correct)

1. **Remove the one-frame flash.** In the anchor `useLayoutEffect`, after setting
   `container.scrollTop`, also call `setScrollTop(container.scrollTop)` so the
   virtualization window and the DOM scroll stay in lockstep within the same commit
   (before paint). Cheap; eliminates the flash. The scrollbar still snaps back a
   batch.

2. **Drive virtualization from the live DOM, not lagged state.** Read
   `containerRef.current.scrollTop` via `requestAnimationFrame` /
   `useSyncExternalStore` instead of the `onScroll`-set state, removing the
   structural 1-frame lag entirely.

3. **Eliminate the snap (proper fix).** Use absolute positioning: set
   `totalHeight = totalCount * ITEM_HEIGHT` (the full list — counts are already
   available) and offset the loaded window with
   `paddingTop = windowStartIndex * ITEM_HEIGHT`. Then the scrollbar reflects the
   true list length, content fills in at real positions, and **no `scrollTop`
   correction is needed at all** — no jump, no flash. This makes the
   `prev/next`-diff anchoring in `useLayoutEffect` unnecessary.

---

## Status

Identified and documented. Fix not yet applied (pending choice of approach above).
