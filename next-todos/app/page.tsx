import TodoData from "./models/todo";
import TodoApp from "./todo_app";

export default function Home() {
  const todos = [
    {
      id: 1,
      detail: "Create frontend project (github repository and artefacts)",
      completed: false,
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
      created: new Date(2026, 3, 11),
    },
  ];

  const update_todo = (updated: TodoData) => {
    console.log("Updating todo:", updated);
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans bg-background">
      <TodoApp tasks={todos} on_change={update_todo} />
    </div>
  );
}
