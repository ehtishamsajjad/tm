
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Task } from "@/components/data-table";
import { KanbanCard } from "./kanban-card";
import { cn } from "@/lib/utils";
import { CircleCheck, CircleDashed, Loader2 } from "lucide-react";

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  className?: string;
}

export function KanbanColumn({ id, title, tasks, className }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  const getIcon = (id: string) => {
    switch (id) {
      case "todo":
        return <CircleDashed className="h-4 w-4 text-muted-foreground" />;
      case "in_progress":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "completed":
        return <CircleCheck className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn("flex flex-col gap-4 min-w-[300px] flex-1", className)}>
      <div className="flex items-center justify-between px-2 py-1">
        <div className="flex items-center gap-2">
          {getIcon(id)}
          <h3 className="font-semibold text-sm text-foreground uppercase tracking-wide">
            {title}
          </h3>
        </div>
        <span className="text-xs text-muted-foreground font-medium bg-muted px-2.5 py-0.5 rounded-full border">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className="flex flex-col gap-3 bg-muted/40 p-3 rounded-xl min-h-[500px] border-2 border-dashed border-transparent hover:border-muted-foreground/20 transition-colors"
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

