interface DashboardProps {
  pendingCount: number;
  completedCount: number;
  createdTodayCount: number;
}

export default function Dashboard({ pendingCount, completedCount, createdTodayCount }: DashboardProps) {
  return (
    <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left bg-surface rounded-lg shadow-sm p-6 w-full">
      Dashboard Section
    </div>
  );
}
