import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/components/data-table";
import { formatDate } from "@/lib/utils";
import { Clock, GripVertical } from "lucide-react";

interface KanbanCardProps {
    task: Task;
}

export function KanbanCard({ task }: KanbanCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: {
            type: "Task",
            task,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-30 bg-background border-2 border-primary/20 rounded-lg h-[150px]"
            />
        );
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card className="group cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-md transition-all duration-200">
                <CardHeader className="p-4 pb-2 space-y-0 relative">
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                    </div>
                    <div className="flex items-start justify-between gap-2 pr-4">
                        <CardTitle className="text-sm font-medium leading-tight line-clamp-2">
                            {task.title}
                        </CardTitle>
                    </div>
                    <div className="pt-2 flex gap-2">
                        {task.priority === "high" && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 rounded-sm font-normal">
                                High
                            </Badge>
                        )}
                        {task.priority === "medium" && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-sm font-normal bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">
                                Medium
                            </Badge>
                        )}
                        {task.priority === "low" && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-sm font-normal bg-green-500/10 text-green-600 hover:bg-green-500/20">
                                Low
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-3">
                    {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {task.tags.map((tag) => (
                                <Badge
                                    key={tag.id}
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 h-5 font-normal text-muted-foreground"
                                >
                                    {tag.name}
                                </Badge>
                            ))}
                        </div>
                    )}
                    {task.deadline && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 w-fit px-2 py-1 rounded-md">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(task.deadline)}</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
