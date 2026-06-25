"use server";

import { getTodos, getTodoCounts, addTodo, updateTodo, searchTodos } from "./store";

export async function loadTodos(cursor?: number, tab?: "pending" | "completed" | "new") {
  return getTodos(cursor ?? 0, tab);
}

export async function loadCounts() {
  return getTodoCounts();
}

export async function createTodo(detail: string) {
  return addTodo(detail);
}

export async function toggleTodo(id: string, completed: boolean) {
  return updateTodo(id, { completed });
}

export async function searchTodosAction(query: string, tab: "pending" | "completed" | "new") {
  return searchTodos(query, tab);
}
