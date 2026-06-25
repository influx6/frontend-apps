"use client";

import { useTodoFetcher } from "../hooks/todo_fetcher";
import { TodoResult } from "../models/todo";
import { createTodo, loadCounts, loadTodos, toggleTodo } from "../server/actions";
import Dashboard from "../server/dashboard";
import TabSheet from "./tabsheet";
import { useState, useRef } from "react";

interface TodoAppProps {
  initialCursor: TodoResult;
  initialCount: { pending: number; completed: number; newToday: number };
}

export default function TodoApp({ initialCursor, initialCount }: TodoAppProps) {
  const [todos, previousTodoList, nextTodoList, resetTodoList] = useTodoFetcher(
    {
      prevCursor: initialCursor.prevCursor,
      nextCursor: initialCursor.nextCursor,
      batchSize: initialCursor.batchSize,
    },
    initialCursor.items,
  );

  const loadingRef = useRef(false);
  const [counts, setCounts] = useState(initialCount);
  const [newTodoText, setNewTodoText] = useState("");
  const [filterTab, setFilteredTab] = useState("pending" as "pending" | "completed" | "new");

  // Reload the first window for a given tab and reset the sliding window.
  const reload = async (tab: "pending" | "completed" | "new") => {
    const result = await loadTodos(0, tab);
    resetTodoList(
      { prevCursor: result.prevCursor, nextCursor: result.nextCursor, batchSize: result.batchSize },
      result.items,
    );
  };

  const handleFilter = (tab: "pending" | "completed" | "new") => {
    setFilteredTab(tab);
    reload(tab);
  };

  const handleAddTodo = async () => {
    if (!newTodoText.trim()) return;
    await createTodo(newTodoText);

    // reload the current tab from the top so the new todo shows if it matches
    await reload(filterTab);
    loadCounts().then(setCounts);

    setNewTodoText("");
  };

  const handleToggle = async (id: string, completed: boolean) => {
    await toggleTodo(id, completed);

    // The toggled item no longer matches the current tab — reload it from the
    // top so it disappears, and refresh the counts.
    await reload(filterTab);
    const counts = await loadCounts();
    setCounts(counts);
  };

  const loadNext = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    console.log("Loading next for tab: ", filterTab);
    await nextTodoList(filterTab);
    loadingRef.current = false;
  };

  const loadPrevious = async () => {
    if (loadingRef.current) return;
    console.log("Loading previous for tab: ", filterTab);
    loadingRef.current = true;
    await previousTodoList(filterTab);
    loadingRef.current = false;
  };

  return (
    <main className="flex flex-1 w-full max-w-3xl flex-col gap-8 pt-12 pb-8">
      <Dashboard
        pendingCount={counts.pending}
        completedCount={counts.completed}
        createdTodayCount={counts.newToday}
      />
      <div className="flex gap-2 w-full">
        <input
          type="text"
          className="flex-1 border border-border rounded-lg px-4 py-2 text-foreground bg-surface placeholder:text-muted"
          placeholder="Add a new todo..."
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
        />
        <button
          className="bg-accent text-accent-foreground rounded-lg px-4 py-2 font-bold hover:opacity-90 transition-opacity"
          onClick={handleAddTodo}
        >
          +
        </button>
      </div>
      <TabSheet
        todos={todos}
        on_toggle={(d) => handleToggle(d.id, d.completed)}
        on_filter={handleFilter}
        load_next={loadNext}
        load_previous={loadPrevious}
      />
    </main>
  );
}
