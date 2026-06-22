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

  const [newTodoText, setNewTodoText] = useState("");

  const on_change = (updated: TodoData) => {
    console.log("changing todo");
    set_all_todos(all_todos.map((item) => (item.id === updated.id ? updated : item)));
  };

  const addTodo = () => {
    if (!newTodoText.trim()) return;
    const newTodo: TodoData = {
      id: crypto.randomUUID(),
      detail: newTodoText,
      completed: false,
      created: new Date(),
    };
    set_all_todos([...all_todos, newTodo]);
    setNewTodoText("");
  };

  const pending_count = pending_todos.length;
  const completed_count = completed_todos.length;
  const new_count = new_todos.length;

  return (
    <main className="flex flex-1 w-full max-w-3xl flex-col gap-8 pt-12 pb-8">
      <Dashboard
        pendingCount={pending_count}
        completedCount={completed_count}
        createdTodayCount={new_count}
      ></Dashboard>
      <div className="flex gap-2 w-full">
        <input
          type="text"
          className="flex-1 border border-border rounded-lg px-4 py-2 text-foreground bg-surface placeholder:text-muted"
          placeholder="Add a new todo..."
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
        />
        <button
          className="bg-accent text-accent-foreground rounded-lg px-4 py-2 font-bold hover:opacity-90 transition-opacity"
          onClick={addTodo}
        >
          +
        </button>
      </div>
      <TabSheet
        pending_items={pending_todos}
        new_items={new_todos}
        completed_items={completed_todos}
      ></TabSheet>
    </main>
  );
}
