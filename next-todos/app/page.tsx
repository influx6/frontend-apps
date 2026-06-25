import TodoApp from "./client/todo_app";
import { loadTodos, loadCounts } from "./server/actions";

export default async function Home() {
  const [todosResult, counts] = await Promise.all([loadTodos(0, "pending"), loadCounts()]);

  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans bg-background">
      <TodoApp initialCursor={todosResult} initialCount={counts} />
    </div>
  );
}
