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
    <section key={id} className="flex flex-row">
      <div className="completed left-0">
        <input
          type="checkbox"
          checked={completed}
          onChange={(e) => on_change({ ...data, completed: e.target.checked })}
        />
      </div>
      <div className="details right-0">
        <div className="message">
          <p>{detail}</p>
        </div>
        <div className="created_at">
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
