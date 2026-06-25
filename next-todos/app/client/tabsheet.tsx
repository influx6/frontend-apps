"use client";

import { ReactNode, useState } from "react";
import TodoData from "../models/todo";
import useDebounce from "../hooks/debounce";
import { VirtualTodoList } from "./todo_list";

interface TabContentProps {
  children: ReactNode | Array<ReactNode>;
}

function TabContent({ children }: TabContentProps) {
  return <div className="flex flex-col p-4 overflow-hidden">{children}</div>;
}

type TabFunc = () => void;

interface TabProps {
  title: string;
  selected: boolean;
  on_click: TabFunc;
}

function Tab({ title, selected, on_click }: TabProps) {
  return (
    <button
      className={`px-8 py-4 text-lg font-bold rounded-t-lg transition-colors
      ${selected ? "text-foreground bg-surface border-b-2 border-accent" : "bg-transparent text-muted hover:text-foreground"}
 `}
      onClick={on_click}
    >
      {title}
    </button>
  );
}

interface TabSheetState {
  todos: TodoData[];
  on_toggle: (todo: TodoData) => void;
  load_next?: () => Promise<void>;
  load_previous?: () => Promise<void>;
  on_filter?: (tab: "pending" | "completed" | "new") => void;
}

export default function TabSheet({ todos, on_toggle, on_filter, load_next, load_previous }: TabSheetState) {
  const [selected, setSelected] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearch = useDebounce(searchQuery, 300);

  const today = new Date();

  const tabFiltered = todos.filter((t) => {
    if (selected === 1) return !t.completed;
    if (selected === 2) return t.completed;
    return (
      t.created.getFullYear() === today.getFullYear() &&
      t.created.getMonth() === today.getMonth() &&
      t.created.getDate() === today.getDate()
    );
  });

  const filteredItems = debouncedSearch.trim()
    ? tabFiltered.filter((item) => item.detail.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : tabFiltered;

  const setTab = (selection: number) => {
    setSelected(selection);
    if (on_filter) {
      on_filter(selection === 1 ? "pending" : selection === 2 ? "completed" : "new");
    }
  };

  return (
    <div className="bg-surface rounded-b-lg  flex flex-col ">
      <div className="flex">
        <Tab title="Pending" selected={selected === 1} on_click={() => setTab(1)}></Tab>
        <Tab title="Completed" selected={selected === 2} on_click={() => setTab(2)}></Tab>
        <Tab title="New" selected={selected === 3} on_click={() => setTab(3)}></Tab>
      </div>
      {/*Search bar*/}
      <div className="py-5 px-4 pb-3">
        <input
          type="text"
          className="w-full border border-border rounded-lg px-3 py-2 text-sm  text-foreground bg-surface placeholder:text-muted"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      {/*Todo List*/}
      <div className="tab_content min-h-48 border border-t-0 bg-surface rounded-b-lg overflow-hidden">
        <TabContent>
          <VirtualTodoList
            key="virtual-todo-list"
            container_height={600}
            tasks={filteredItems}
            on_change={on_toggle}
            load_next={load_next}
            load_previous={load_previous}
          />
        </TabContent>
      </div>
    </div>
  );
}
