interface DashboardProps {
  pendingCount: number;
  completedCount: number;
  createdTodayCount: number;
}

export default function Dashboard({ pendingCount, completedCount, createdTodayCount }: DashboardProps) {
  return (
    <div className="flex gap-4 w-full">
      <div className="flex-1 bg-surface rounded-lg shadow-sm p-4 text-center">
        <p className="text-muted text-sm">Uncompleted</p>
        <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
      </div>
      <div className="flex-1 bg-surface rounded-lg shadow-sm p-4 text-center">
        <p className="text-muted text-sm">Completed</p>
        <p className="text-2xl font-bold text-foreground">{completedCount}</p>
      </div>
      <div className="flex-1 bg-surface rounded-lg shadow-sm p-4 text-center">
        <p className="text-muted text-sm">New</p>
        <p className="text-2xl font-bold text-foreground">{createdTodayCount}</p>
      </div>
    </div>
  );
}
