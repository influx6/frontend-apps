import TodoApp from "./client/todo_app";

export default function Home() {
  const todos = [
    {
      id: 1,
      detail: "Create frontend project (github repository and artefacts)",
      completed: true,
      created: new Date(2026, 1, 5),
    },
    {
      id: 2,
      detail: "Create nextjs app",
      completed: false,
      created: new Date(2026, 2, 11),
    },
    {
      id: 3,
      detail: "Create svelte app",
      completed: false,
      created: new Date(2026, 1, 11),
    },
    {
      id: 4,
      detail: "Create angularjs app",
      completed: false,
      created: new Date(2026, 5, 21),
    },
    {
      id: 5,
      detail: "Lets create a new escape mechanism for the wonderful laughs of life within super duper devs",
      completed: false,
      created: new Date(2026, 4, 21),
    },
  ];

  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans bg-background">
      <TodoApp tasks={todos} />
    </div>
  );
}
