import TodoApp from "./client/todo_app";

export default function Home() {
  const todos = [
    {
      id: crypto.randomUUID(),
      detail: "Create frontend project (github repository and artefacts)",
      completed: true,
      created: new Date(2026, 1, 5),
    },
    {
      id: crypto.randomUUID(),
      detail: "Create nextjs app",
      completed: false,
      created: new Date(2026, 2, 11),
    },
    {
      id: crypto.randomUUID(),
      detail: "Create svelte app",
      completed: false,
      created: new Date(2026, 1, 11),
    },
    {
      id: crypto.randomUUID(),
      detail: "Create angularjs app",
      completed: false,
      created: new Date(2026, 5, 21),
    },
    {
      id: crypto.randomUUID(),
      detail: "Lets create a new escape mechanism for the wonderful laughs of life within super duper devs",
      completed: false,
      created: new Date(),
    },
  ];

  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans bg-background">
      <TodoApp tasks={todos} />
    </div>
  );
}
