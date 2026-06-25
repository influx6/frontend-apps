Yes, IntersectionObserver works perfectly in React and Next.js. It is highly recommended over calculation methods because it runs asynchronously outside the main thread, preventing lag.
The cleanest way to implement this in React is by creating a dedicated "sentinel" element (a hidden trigger div) placed right below your list. When that element comes into view, it triggers your fetch function. [1] 
Here is a complete, production-ready React component example:

import { useEffect, useRef, useState } from "react";
export default function InfiniteScrollList() {
  const [items, setItems] = useState([1, 2, 3, 4, 5]);
  const [hasMore, setMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement | null>(null);

  // 1. Simulate fetching data
  const loadMoreItems = () => {
    if (items.length >= 20) {
      setMore(false); // Stop when we hit a threshold
      return;
    }
    setItems((prev) => [...prev, prev.length + 1, prev.length + 2]);
  };

  // 2. Setup the Intersection Observer
  useEffect(() => {
    const target = observerTarget.current;
    if (!target || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreItems();
        }
      },
      { threshold: 0.1 } // Triggers when 10% of the sentinel is visible
    );

    observer.observe(target);

    // 3. Clean up the observer when component unmounts or state changes
    return () => {
      observer.unobserve(target);
    };
  }, [items, hasMore]); // Re-run when list changes to re-evaluate the sentinel

  return (
    <div style={{ height: "400px", overflowY: "scroll", border: "1px solid" }}>
      {items.map((item) => (
        <div key={item} style={{ padding: "50px", borderBottom: "1px dashed" }}>
          Item {item}
        </div>
      ))}

      {/* 4. The Sentinel Element */}
      {hasMore && (
        <div ref={observerTarget} style={{ height: "20px", background: "transparent" }}>
          Loading more items...
        </div>
      )}
    </div>
  );
}

## Why this is less finiky than scroll math:

* No Pixel Counting: It relies on visibility percentages, completely ignoring layout math anomalies.
* Zoom Agnostic: Browser zoom levels or high-DPI (Retina) screens often mess up scrollTop calculations, but they do not impact visibility intersections. [2] 
* Automatic Disconnect: When hasMore becomes false, the conditional rendering completely removes the sentinel div from the DOM, guaranteeing no extra fetch requests are ever fired.

If you prefer, I can show you how to:

* Extract this into a custom reusable hook (e.g., useIntersectionObserver)
* Integrate it with popular libraries like TanStack Query (React Query)
* Adjust it specifically for Next.js Server Actions

Let me know which path fits your current architectural setup.

[1] [https://dev.to](https://dev.to/easyvipin/reactjs-tutorial-infinite-scrolling-with-intersection-observer-kp3)
[2] [https://github.com](https://github.com/bvaughn/react-virtualized/issues/357)

---

Yes, you can absolutely use IntersectionObserver for bidirectional scrolling (loading both previous and next items). This is a common pattern for chat applications, log viewers, or infinite feeds. [1] 
To prevent the top "previous" sentinel from triggering immediately when the page loads, you can use the rootMargin option of the observer. This creates a virtual buffer zone, allowing you to control exactly when the fetch triggers. [2] 
## The Strategy

   1. Top Sentinel: Placed above the first item. It uses a negative top rootMargin (e.g., -100px) so it won't trigger unless the user scrolls up past a certain point.
   2. Bottom Sentinel: Placed below the last item. It can use a positive bottom rootMargin to pre-fetch items before the user even hits the bottom. [3] 

## Complete React/Next.js Implementation

import { useEffect, useRef, useState } from "react";
export default function BidirectionalScroll() {
  const [items, setItems] = useState([10, 11, 12, 13, 14]);
  const [hasMoreTop, setHasMoreTop] = useState(true);
  const [hasMoreBottom, setHasMoreBottom] = useState(true);

  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 1. Fetching Logic
  const loadPrevious = () => {
    const firstItem = items[0];
    if (firstItem <= 1) {
      setHasMoreTop(false);
      return;
    }
    // Prepend older items
    setItems((prev) => [firstItem - 2, firstItem - 1, ...prev]);
  };

  const loadNext = () => {
    const lastItem = items[items.length - 1];
    if (lastItem >= 30) {
      setHasMoreBottom(false);
      return;
    }
    // Append newer items
    setItems((prev) => [...prev, lastItem + 1, lastItem + 2]);
  };

  // 2. Setup Observers
  useEffect(() => {
    const container = containerRef.current;
    const topTarget = topSentinelRef.current;
    const bottomTarget = bottomSentinelRef.current;

    if (!container) return;

    // Observer for Top (Previous Items)
    // rootMargin: "-50px 0px 0px 0px" means the element must scroll 
    // 50px deep into the top container view before it triggers.
    const topObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMoreTop) {
          loadPrevious();
        }
      },
      { root: container, rootMargin: "-50px 0px 0px 0px" }
    );

    // Observer for Bottom (Next Items)
    // rootMargin: "0px 0px 200px 0px" pre-fetches items 200px 
    // before the user even reaches the absolute bottom.
    const bottomObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMoreBottom) {
          loadNext();
        }
      },
      { root: container, rootMargin: "0px 0px 200px 0px" }
    );

    if (topTarget && hasMoreTop) topObserver.observe(topTarget);
    if (bottomTarget && hasMoreBottom) bottomObserver.observe(bottomTarget);

    return () => {
      if (topTarget) topObserver.unobserve(topTarget);
      if (bottomTarget) bottomObserver.unobserve(bottomTarget);
    };
  }, [items, hasMoreTop, hasMoreBottom]);

  return (
    <div 
      ref={containerRef} 
      style={{ height: "400px", overflowY: "scroll", border: "1px solid #ccc", position: "relative" }}
    >
      {/* TOP SENTINEL (Load Previous) */}
      {hasMoreTop && (
        <div ref={topSentinelRef} style={{ height: "20px", background: "#FFEEE6", textAlign: "center" }}>
          Loading previous items...
        </div>
      )}

      {/* ITEMS LIST */}
      {items.map((item) => (
        <div key={item} style={{ padding: "40px", borderBottom: "1px solid #eee" }}>
          Item {item}
        </div>
      ))}

      {/* BOTTOM SENTINEL (Load Next) */}
      {hasMoreBottom && (
        <div ref={bottomSentinelRef} style={{ height: "20px", background: "#EAF2F8", textAlign: "center" }}>
          Loading next items...
        </div>
      )}
    </div>
  );
}

## The "Scroll Jump" Gotcha when loading previous items
When you prepend items to the top of a scroll list, the browser's default behavior is to keep the scrollbar position the same. This causes the screen to abruptly "jump" because new content pushed the old content down. [4, 5] 
To fix this layout shift in modern browsers, add this single CSS property to your scrollable container:

.scrollable-container {
  overflow-y: scroll;
  overflow-anchor: auto; /* Browser automatically locks scroll position to visible items */
}

If you want, let me know:

* If you are experiencing scroll jumps when loading previous items
* If you need a manual JavaScript scroll adjustment fallback for older browsers

I can share the exact DOM adjustment logic to keep the user's viewport perfectly still.

[1] [https://www.smashingmagazine.com](https://www.smashingmagazine.com/2018/01/deferring-lazy-loading-intersection-observer-api/)
[2] [https://dev.to](https://dev.to/khalisspasha/mastering-intersection-observer-enhance-your-web-experiences-5b0)
[3] [https://github.com](https://github.com/orizens/ngx-infinite-scroll/issues/128)
[4] [https://www.framer.community](https://www.framer.community/c/support/preserve-scroll-position-across-pages)
[5] [https://www.framer.community](https://www.framer.community/c/support/preserve-scroll-position-across-pages)


When loading previous items at the top of a scroll container, overflow-anchor: auto works in most modern browsers. However, it can fail if elements change size dynamically or contain images.
To guarantee a completely smooth experience without visual jumps, you must manually adjust the scroll position using JavaScript immediately after the DOM updates.
## The Logic Breakdown

   1. Measure the total scrollHeight of the container before prepending new items.
   2. Update the state to insert the new items.
   3. Measure the new scrollHeight after the DOM renders the new items.
   4. Calculate the difference: newScrollHeight - oldScrollHeight.
   5. Adjust the container's scrollTop by adding that difference. This pushes the scrollbar down by the exact pixel height of the newly added items, making it look perfectly stationary to the user.

## Production Fallback Implementation
Here is how to integrate this logic using a React useLayoutEffect (which fires synchronously before the browser repaints the screen):

import { useLayoutEffect, useRef, useState } from "react";
export default function SmoothBidirectionalScroll() {
  const [items, setItems] = useState([10, 11, 12, 13, 14]);
  const [hasMoreTop, setHasMoreTop] = useState(true);
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  const snapshotRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);

  // 1. Triggered when top sentinel intersects
  const loadPrevious = () => {
    const container = containerRef.current;
    if (!container) return;

    // Capture the exact layout dimensions right before the state updates
    snapshotRef.current = {
      scrollHeight: container.scrollHeight,
      scrollTop: container.scrollTop,
    };

    const firstItem = items[0];
    if (firstItem <= 1) {
      setHasMoreTop(false);
      return;
    }

    // Prepend 3 new items
    setItems((prev) => [firstItem - 3, firstItem - 2, firstItem - 1, ...prev]);
  };

  // 2. Adjust the scrollbar synchronously before the user sees a jump
  useLayoutEffect(() => {
    const container = containerRef.current;
    const snapshot = snapshotRef.current;

    if (container && snapshot) {
      // Calculate how many pixels of height were added to the top
      const heightDifference = container.scrollHeight - snapshot.scrollHeight;
      
      // Instantly adjust the scroll position down by that exact difference
      container.scrollTop = snapshot.scrollTop + heightDifference;
      
      // Clear the snapshot until the next fetch
      snapshotRef.current = null;
    }
  }, [items]); // Fires every time the items array changes

  return (
    <div 
      ref={containerRef} 
      style={{ 
        height: "400px", 
        overflowY: "scroll", 
        border: "1px solid #000",
        // Combine CSS anchoring with our JS fallback for absolute bulletproof behavior
        overflowAnchor: "auto" 
      }}
    >
      {/* Top Sentinel Trigger */}
      {hasMoreTop && (
        <div style={{ height: "1px", background: "transparent" }} ref={(el) => {
          if (!el || !hasMoreTop) return;
          const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
              loadPrevious();
            }
          }, { root: containerRef.current, rootMargin: "-20px 0px 0px 0px" });
          observer.observe(el);
          return () => observer.disconnect();
        }} />
      )}

      {items.map((item) => (
        <div key={item} style={{ height: "80px", padding: "20px", borderBottom: "1px solid #ccc" }}>
          Item {item}
        </div>
      ))}
    </div>
  );
}

## Critical Implementation Tips

* Why useLayoutEffect? Standard useEffect runs asynchronously after the browser draws the frame. This causes a split-second visual flicker or jump. useLayoutEffect blocks the paint until your math adjustment is done, hiding the shift entirely.
* Inline Observers: In complex apps, extracting the IntersectionObserver logic into a custom React hook (like useIntersectionObserver) will keep your component file clean and readable.

If you want, let me know:

* If you need help converting this layout adjustment into a custom reusable hook
* If your items have dynamic/variable heights (like text messages of different lengths)

I can help adapt the calculations to match your specific layout constraints.

----

You are completely right, the native scrollend event is standard across all modern browsers and handles the exact moment a gesture or programmatic scroll finishes.
However, scrollend does not natively check where you scrolled. It fires whether you stop scrolling in the absolute middle, top, or bottom of your page. To use it for infinite loading, you would still be forced to write that exact "finiky" pixel calculation inside the event handler to confirm if the user stopped at the bottom boundary.
## ⚠️ The Risks of Using scrollend for Infinite Scroll

   1. You lose "Pre-fetching": scrollend fires only when the scrolling completely halts. With an infinite feed, you usually want to load content 200px before the user hits the bottom so they never see a loading spinner. With scrollend, the user must grind to a complete stop at a dead end before the fetch begins.
   2. Missing fast scrolls: If a user flings their trackpad or mouse wheel aggressively, they might hit the bottom and rebound or keep triggering micro-scroll gestures, causing the math logic to mismatch when scrollend finally evaluates.

## 💡 When scrollend is actually perfect for Lists
Where scrollend absolutely shines is combining it with Intersection Observer to clean up application state or trigger tracking events.
For example, you can use it to determine exactly when a user stops interacting with the list to track analytical impressions or pause heavy background animations:

import { useEffect, useRef } from "react";
export default function SmartFeed() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScrollEnd = () => {
      console.log("User stopped moving entirely. Safe to freeze animations or log analytics.");
    };

    container.addEventListener("scrollend", handleScrollEnd);
    return () => container.removeEventListener("scrollend", handleScrollEnd);
  }, []);

  return <div ref={containerRef} style={{ overflowY: "scroll", height: "400px" }}>...</div>;
}

## The Verdict
Stick with the IntersectionObserver + Sentinel approach we implemented for data loading. It is completely independent of pixel math and zoom anomalies, and handles pre-fetching perfectly. You can layer the scrollend event on top if you need to detect resting states or pause features when the user is idle.
If you're interested, let me know:

* If you want to see how to build a loading spinner animation that activates while the observer waits for the API
* If you want to manage virtualization (hiding off-screen DOM nodes to save memory on long feeds)

I can supply the code to optimize your application's performance.

