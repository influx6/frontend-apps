const crypto = require("crypto");

const templates = [
  "Create frontend project (github repository and artefacts)",
  "Create nextjs app",
  "Create svelte app",
  "Create angularjs app",
  "Lets create a new escape mechanism for the wonderful laughs of life within super duper devs",
];

const prefixes = [
  "Build",
  "Create",
  "Implement",
  "Design",
  "Refactor",
  "Optimize",
  "Debug",
  "Test",
  "Deploy",
  "Document",
  "Review",
  "Setup",
  "Migrate",
  "Integrate",
  "Automate",
];

const subjects = [
  "frontend project",
  "nextjs app",
  "svelte app",
  "angularjs app",
  "REST API",
  "GraphQL endpoint",
  "database schema",
  "authentication flow",
  "payment system",
  "notification service",
  "search functionality",
  "user dashboard",
  "admin panel",
  "CI/CD pipeline",
  "unit tests",
  "integration tests",
  "landing page",
  "mobile app",
  "microservice",
  "websocket server",
  "file upload system",
  "email template",
  "analytics dashboard",
  "error tracking",
  "logging system",
  "cache layer",
  "rate limiter",
  "load balancer config",
  "docker container",
  "kubernetes cluster",
];

const details = [
  "with TypeScript and Tailwind CSS",
  "using React Server Components",
  "with real-time sync",
  "for the production environment",
  "before the sprint review",
  "with proper error handling",
  "and write unit tests",
  "with full documentation",
  "across all browsers",
  "with accessibility support",
  "using the new design system",
  "for mobile responsiveness",
  "with dark mode support",
  "and add integration tests",
  "using server-side rendering",
  "with optimistic updates",
  "for the beta release",
  "with performance monitoring",
  "and add proper logging",
  "using the existing API",
];

const todos = [];
const now = new Date();

for (let i = 0; i < 1000; i++) {
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const subject = subjects[Math.floor(Math.random() * subjects.length)];
  const detail = details[Math.floor(Math.random() * details.length)];

  // Spread dates over the past year
  const daysAgo = Math.floor(Math.random() * 365);
  const created = new Date(now);
  created.setDate(created.getDate() - daysAgo);

  todos.push({
    id: crypto.randomUUID(),
    detail: `${prefix} ${subject} ${detail}`,
    completed: Math.random() < 0.3, // ~30% completed
    created: created.toISOString(),
  });
}

// Sort descending by date (newest first) — server never needs to sort
todos.sort((a, b) => new Date(b.created) - new Date(a.created));

require("fs").writeFileSync(
  "/home/darkvoid/Boxxed/@dev/frontend-apps/next-todos/app/server/todos.json",
  JSON.stringify(todos, null, 2),
);

console.log(`Generated ${todos.length} todos`);
console.log(`Completed: ${todos.filter((t) => t.completed).length}`);
console.log(`Pending: ${todos.filter((t) => !t.completed).length}`);
console.log(
  `Today: ${
    todos.filter((t) => {
      const d = new Date(t.created);
      return d.getFullYear() === 2026 && d.getMonth() === 5 && d.getDate() === 22;
    }).length
  }`,
);
