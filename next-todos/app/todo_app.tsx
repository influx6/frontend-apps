"use client";

import TodoData from "./models/todo";
import Dashboard from "./server/dashboard";
import TabSheet from "./client/tabsheet";
import { TodoList } from "./client/todo";
import { useMemo } from "react";

interface TodoState {
  tasks: Array<TodoData>;
  on_change: (task: TodoData) => void;
}

export default function TodoApp({ tasks, on_change }: TodoState) {
  const pending_todos = useMemo(() => {
    return tasks.filter((item) => !item.completed);
  }, [tasks]);

  const completed_todos = useMemo(() => {
    return tasks.filter((item) => item.completed);
  }, [tasks]);

  const new_todos = useMemo(() => {
    const today = new Date();
    return tasks.filter((item) => item.created == today);
  }, [tasks]);

  const pending_child = <TodoList tasks={pending_todos} on_change={on_change} />;
  const completed_child = <TodoList tasks={completed_todos} on_change={on_change} />;
  const new_todos_child = <TodoList tasks={new_todos} on_change={on_change} />;

  return (
    <main className="flex flex-1 w-full max-w-3xl flex-col gap-8 pt-12 pb-8">
      <Dashboard></Dashboard>
      <TabSheet
        pending_items={pending_child}
        new_items={new_todos_child}
        completed_items={completed_child}
      ></TabSheet>
    </main>
  );
}
