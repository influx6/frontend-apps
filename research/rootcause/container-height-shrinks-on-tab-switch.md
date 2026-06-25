# Scroll container height shrinks when switching tabs

## Root cause (intro)

Switching tabs (e.g. **New → Pending**) made the scrollable list **collapse to a
short height** instead of staying a full-size viewport.

> This one was spotted by the author from direct observation while using the app —
> noticing the container shrink on tab change — who also reasoned out the correct
> fix: that tracking the height in `useState` was unnecessary since the height is
> already known, and that the container should use a fixed height so it always
> stays a full viewport. The investigation below confirms that diagnosis.

Two things combined to cause it:

1. **The viewport height was *measured* from the DOM and stored in state.** The
   number of rows to virtualize is computed from the viewport's pixel height:

   ```ts
   const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT) + BUFFER * 2;
   ```

   `containerHeight` came from reading `containerRef.current.clientHeight` in a
   post-mount `useEffect` and storing it via `useState` — starting at `0` and
   only becoming correct on the *second* render.

2. **The container was sized with `maxHeight`, not `height`.** With
   `overflow-y-auto` + `maxHeight`, the container's actual height is
   `min(content height, maxHeight)` — so it shrinks to fit whatever is rendered.

The list is keyed per tab (`key={virtual-todo-list-${selected}}`), so changing
tabs **remounts** the component. On remount:

- `containerHeight` resets to `0` → `visibleCount = 0 + BUFFER*2 = 6` for the
  first frame → only ~6 rows render,
- and because the height is driven by `maxHeight`, the container collapses to fit
  those few rows (and stays collapsed for any tab whose loaded window is short,
  like *New*).

So the height "reduces" on every tab switch, with a measure-then-re-render flash
even when it recovers.

The deeper point: **measuring `clientHeight` was unnecessary work.** The viewport
height is already known at render time — it's the `container_height` prop. The
container can never be taller than that, so `visibleCount` can be derived straight
from the prop. The `useState` only existed to trigger a second render after the
measurement; removing the measurement removes the need for the state entirely.

---

## Why `useState` was there (and why it's the wrong tool here)

`visibleCount` needs the viewport's pixel height, and the height of a DOM element
genuinely isn't knowable at render time *in the general case* — you have to mount
it and read `clientHeight`. The measure → `setState` → re-render pattern is the
standard way to feed a measured dimension back into render.

It's the right tool when the size is **driven by layout** (flex/grid/responsive
parents) and you can't know it in advance. It's the wrong tool **here**, because
the size is **driven by a prop we control** (`container_height`). Measuring a value
you already passed in just adds a render cycle, a reset-to-zero on every remount,
and a layout flash.

Rule of thumb: only measure what layout decides for you. If *you* set the
dimension, compute from that value.

---

## How it was observed

Driving the app with Playwright and reading the scroll container's `clientHeight`
across tab switches.

### Before

- Pending: ~600px
- New (few items): collapses to the height of the loaded rows
- back → Pending: briefly ~6 rows tall, then re-measures back up — a visible jump

### After the fix

```
Pending      : 600 px, 19 rows
New          : 600 px,  3 rows   (stays full height, no shrink)
back→Pending : 600 px, 19 rows
Completed    : 600 px, 19 rows
```

Stable 600px viewport on every tab.

---

## Relevant code (`app/client/todo_list.tsx`)

Before:

```tsx
const [containerHeight, setContainerHeight] = useState(0);

useEffect(() => {
  if (containerRef.current) {
    setContainerHeight(containerRef.current.clientHeight);
  }
}, []);

const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT) + BUFFER * 2;
// ...
<div style={{ maxHeight: `${container_height}px`, overflowAnchor: "auto" }} />
```

After:

```tsx
// No measurement, no state — the viewport height is the prop.
const visibleCount = Math.ceil(container_height / ITEM_HEIGHT) + BUFFER * 2;
// ...
// Fixed height (not maxHeight): a stable viewport that doesn't shrink to fit
// short lists or jump when switching tabs.
<div style={{ height: `${container_height}px`, overflowAnchor: "auto" }} />
```

---

## The fix

This is exactly the solution the author proposed on observing the bug — remove the
redundant measurement/state and pin the viewport to a fixed height:

1. **Drop `containerHeight` state and the measuring `useEffect`.** Derive
   `visibleCount` from the `container_height` prop. Over-counting on short lists
   is harmless because `endIndex` is clamped to `tasks.length`.
2. **Use a fixed `height` instead of `maxHeight`.** A virtualized list wants a
   *stable* scroll viewport that content scrolls *within*; short lists simply
   leave empty space below.

### Note: don't use `min-height` instead

A tempting alternative is "give it a large `min-height` so it always stretches."
That breaks virtualization: with `min-height` and no cap, `overflow-y-auto` lets
the container grow to fit the **entire** list, so there's no internal scroll, no
windowing benefit, and the IntersectionObserver root no longer scrolls. A fixed
viewport height is what you want.

If the viewport ever needs to be **responsive** to available space (rather than a
hardcoded 600px), that *is* a real measurement case — but it should use a
`ResizeObserver` on the parent, not the self-measuring `clientHeight`-on-mount
pattern that was removed.

---

## Status

Fixed and verified.
