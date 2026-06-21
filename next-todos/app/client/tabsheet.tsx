"use client";

import { ReactNode, useEffect, useState } from "react";

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
  pending_items: ReactNode;
  completed_items: ReactNode;
  new_items: ReactNode;
}

export default function TabSheet({ pending_items, completed_items, new_items }: TabSheetState) {
  const [selected, setSelected] = useState(1);

  return (
    <div className="bg-surface rounded-b-lg  flex flex-col ">
      <div className="flex">
        <Tab title="Pending" selected={selected === 1} on_click={() => setSelected(1)}></Tab>
        <Tab title="Completed" selected={selected === 2} on_click={() => setSelected(2)}></Tab>
        <Tab title="New" selected={selected === 3} on_click={() => setSelected(3)}></Tab>
      </div>
      <div className="tab_content min-h-48 border border-t-0 bg-surface rounded-b-lg">
        {selected === 1 && <TabContent>{pending_items}</TabContent>}
        {selected === 2 && <TabContent>{completed_items}</TabContent>}
        {selected === 3 && <TabContent>{new_items}</TabContent>}
      </div>
    </div>
  );
}
