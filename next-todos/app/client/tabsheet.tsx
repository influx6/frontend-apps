"use client";

import { ReactNode, useEffect, useState } from "react";
import TodoData from "../models/todo";
import { TodoList } from "./todo";

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
  pending_items: TodoData[];
  completed_items: TodoData[];
  new_items: TodoData[];
  on_change: (todo: TodoData) => void;
}

export default function TabSheet({ on_change, pending_items, completed_items, new_items }: TabSheetState) {
  const [selected, setSelected] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const activeItems = selected === 1 ? pending_items : selected === 2 ? completed_items : new_items;
  const filteredItems = searchQuery.trim()
    ? activeItems.filter((item) => item.detail.toLowerCase().includes(searchQuery.toLowerCase()))
    : activeItems;

  return (
    <div className="bg-surface rounded-b-lg  flex flex-col ">
      <div className="flex">
        <Tab title="Pending" selected={selected === 1} on_click={() => setSelected(1)}></Tab>
        <Tab title="Completed" selected={selected === 2} on_click={() => setSelected(2)}></Tab>
        <Tab title="New" selected={selected === 3} on_click={() => setSelected(3)}></Tab>
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
      <div className="tab_content min-h-48 border border-t-0 bg-surface rounded-b-lg">
        <TabContent>
          <TodoList tasks={filteredItems} on_change={on_change}></TodoList>
        </TabContent>
      </div>
    </div>
  );
}
