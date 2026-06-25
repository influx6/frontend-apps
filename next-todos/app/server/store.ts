import { TodoData, TodoJSON, TodoResult } from "../models/todo";
import todosJson from "./todos.json";
import crypto from "crypto";

const store = {
  sorted: (todosJson as TodoJSON[]).map((t) => ({
    ...t,
    created: new Date(t.created as unknown as string),
  })),
  idToIndex: new Map((todosJson as TodoJSON[]).map((t, i) => [t.id, i])),
};

const BATCH_SIZE = 20;

type Tab = "pending" | "completed" | "new";

function matchesTab(t: TodoData, tab?: Tab): boolean {
  if (!tab) return true;
  if (tab === "pending") return !t.completed;
  if (tab === "completed") return t.completed;
  const today = new Date();
  return (
    t.created.getFullYear() === today.getFullYear() &&
    t.created.getMonth() === today.getMonth() &&
    t.created.getDate() === today.getDate()
  );
}

export function updateTodo(id: string, updates: Partial<TodoData>): TodoData | null {
  const idx = store.idToIndex.get(id);
  if (idx === undefined) return null;
  const updated = { ...store.sorted[idx], ...updates };
  store.sorted[idx] = updated;
  return updated;
}

export function searchTodos(query: string, tab: Tab): TodoData[] {
  const q = query.toLowerCase();
  return store.sorted.filter((t) => matchesTab(t, tab) && t.detail.toLowerCase().includes(q));
}

export function getTodoCounts(): { pending: number; completed: number; newToday: number } {
  return {
    pending: store.sorted.filter((t) => matchesTab(t, "pending")).length,
    completed: store.sorted.filter((t) => matchesTab(t, "completed")).length,
    newToday: store.sorted.filter((t) => matchesTab(t, "new")).length,
  };
}

export function getTodos(cursor: number = 0, tab?: Tab): TodoResult {
  // Paginate over the tab-filtered view so the cursor/window stays aligned with
  // what the client renders.
  const filtered = tab ? store.sorted.filter((t) => matchesTab(t, tab)) : store.sorted;
  const items = filtered.slice(cursor, cursor + BATCH_SIZE);

  const nextCursor = cursor + BATCH_SIZE < filtered.length ? cursor + BATCH_SIZE : null;
  const prevCursor = cursor - BATCH_SIZE >= 0 ? cursor - BATCH_SIZE : null;
  return { items, batchSize: BATCH_SIZE, nextCursor, prevCursor };
}

export function addTodo(detail: string): TodoResult {
  const todo: TodoData = {
    id: crypto.randomUUID(),
    detail,
    completed: false,
    created: new Date(),
  };
  store.sorted.unshift(todo);
  store.idToIndex.forEach((v, k) => store.idToIndex.set(k, v + 1));
  store.idToIndex.set(todo.id, 0);

  return getTodos(0);
}
