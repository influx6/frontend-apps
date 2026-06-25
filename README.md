# Frontend Apps

This repository is a showcase of my capabilities to work with various frontend framework tools and stacks in building out frontend applications in the js space.

This will help massively for the need to get hired and to have something to show recruiters, and potential job seekers my capabilities with these stacks.

As well as a good showcase of capabilities.

## Projects

### [next-todos](./next-todos) — Server-paginated infinite-scroll todo app

A deceptively simple todo app (Next.js App Router + React 19 + Server Actions)
that hides a lot of real engineering. The full todo set lives on the server and
is streamed to the client in small cursor-based batches. The client keeps a
**3-batch sliding window** in memory (never more), **virtualizes** the DOM so
only the visible rows render, and uses an **IntersectionObserver** to trigger
loading as you scroll — in either direction — so you can reach both the start and
the end of a large list without ever holding it all in memory.

See [next-todos/README.md](./next-todos/README.md) for the full write-up.
