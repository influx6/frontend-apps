import TodoData, { TodoResult } from "../models/todo";
import todosJson from "./todos.json";
import crypto from "crypto";

const store = {
  sorted: (todosJson as TodoData[]).map((t) => ({
    ...t,
    created: new Date(t.created as unknown as string),
  })),
  idToIndex: new Map((todosJson as TodoData[]).map((t, i) => [t.id, i])),
};

const BATCH_SIZE = 20;

export function updateTodo(id: string, updates: Partial<TodoData>): TodoData | null {
  const idx = store.idToIndex.get(id);
  if (idx === undefined) return null;
  const updated = { ...store.sorted[idx], ...updates };
  store.sorted[idx] = updated;
  return updated;
}

export function searchTodos(query: string, tab: "pending" | "completed" | "new"): TodoData[] {
  const today = new Date();
  return store.sorted.filter((t) => {
    const matchesTab =
      tab === "pending"
        ? !t.completed
        : tab === "completed"
          ? t.completed
          : t.created.getFullYear() === today.getFullYear() &&
            t.created.getMonth() === today.getMonth() &&
            t.created.getDate() === today.getDate();
    return matchesTab && t.detail.toLowerCase().includes(query.toLowerCase());
  });
}

export function getTodoCounts(): { pending: number; completed: number; newToday: number } {
  const today = new Date();
  return {
    pending: store.sorted.filter((t) => !t.completed).length,
    completed: store.sorted.filter((t) => t.completed).length,
    newToday: store.sorted.filter(
      (t) =>
        t.created.getFullYear() === today.getFullYear() &&
        t.created.getMonth() === today.getMonth() &&
        t.created.getDate() === today.getDate(),
    ).length,
  };
}

export function getTodos(cursor: number = 0, tab?: "pending" | "completed" | "new"): TodoResult {
  const items = store.sorted.slice(cursor, cursor + BATCH_SIZE);

  const today = new Date();
  items.filter((t) => {
    if (tab === undefined || tab === null) return true;
    const matchesTab =
      tab === "pending"
        ? !t.completed
        : tab === "completed"
          ? t.completed
          : t.created.getFullYear() === today.getFullYear() &&
            t.created.getMonth() === today.getMonth() &&
            t.created.getDate() === today.getDate();
    return matchesTab;
  });

  const nextCursor = cursor + BATCH_SIZE < store.sorted.length ? cursor + BATCH_SIZE : null;
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
