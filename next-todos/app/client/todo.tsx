"use client";

import TodoData from "../models/todo";

type TodoChange = (todo: TodoData) => void;

interface TodoProp {
  data: TodoData;
  on_change: TodoChange;
}

export function Todo({ data, on_change }: TodoProp) {
  const { id, detail, completed, created } = data;
  return (
    <section key={id} className="todo-item flex flex-row items-center gap-3 py-3 border-b border-border">
      <input
        type="checkbox"
        className="appearance-none w-5 h-5 border-2 border-border rounded-md checked:bg-accent checked:border-accent cursor-pointer transition-colors"
        checked={completed}
        onChange={(e) => on_change({ ...data, completed: e.target.checked })}
      />
      <div className="flex flex-1 min-w-0 items-center justify-between details">
        <div className="message overflow-hidden">
          <p className="todo-text text-lg overflow-hidden whitespace-nowrap text-ellipsis">{detail}</p>
        </div>
        <div className="text-muted text-base whitespace-nowrap">
          <p>{created.toDateString()}</p>
        </div>
      </div>
    </section>
  );
}

interface TodoList {
  tasks: Array<TodoData>;
  on_change: (task: TodoData) => void;
}

export function TodoList({ tasks, on_change }: TodoList) {
  return (
    <section id="todo-app">
      {tasks.map((task) => (
        <Todo key={task.id} data={task} on_change={on_change} />
      ))}
    </section>
  );
}
