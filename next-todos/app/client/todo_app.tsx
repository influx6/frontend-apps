"use client";

import TodoData from "../models/todo";
import Dashboard from "../server/dashboard";
import TabSheet from "./tabsheet";
import { TodoList } from "./todo";
import { useMemo, useState } from "react";

interface TodoState {
  tasks: Array<TodoData>;
}

export default function TodoApp({ tasks }: TodoState) {
  const [all_todos, set_all_todos] = useState(tasks as Array<TodoData>);

  const pending_todos = useMemo(() => {
    return all_todos.filter((item) => !item.completed);
  }, [all_todos]);

  const completed_todos = useMemo(() => {
    return all_todos.filter((item) => item.completed);
  }, [all_todos]);

  const new_todos = useMemo(() => {
    const today = new Date();
    return all_todos.filter(
      (item) =>
        item.created.getFullYear() == today.getFullYear() &&
        item.created.getMonth() == today.getMonth() &&
        item.created.getDate() == today.getDate(),
    );
  }, [all_todos]);

  const on_change = (updated: TodoData) => {
    console.log("changing todo");
    set_all_todos(all_todos.map((item) => (item.id === updated.id ? updated : item)));
  };

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
