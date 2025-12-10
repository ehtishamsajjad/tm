import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { useTasksQuery } from "@/hooks/use-tasks-query";
import { useUpdateTaskMutation } from "@/hooks/use-update-task-mutation";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { useState, useMemo } from "react";
import { Task } from "./data-table";
import { createPortal } from "react-dom";

export function KanbanBoard() {
    const { data: tasksData } = useTasksQuery();
    const updateMutation = useUpdateTaskMutation();
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    const tasks = tasksData?.tasks || [];

    const columns = useMemo(() => {
        return {
            todo: tasks.filter((task) => task.status === "todo"),
            in_progress: tasks.filter((task) => task.status === "in_progress"),
            completed: tasks.filter((task) => task.status === "completed"),
        };
    }, [tasks]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const onDragStart = (event: DragStartEvent) => {
        if (event.active.data.current?.type === "Task") {
            setActiveTask(event.active.data.current.task);
        }
    };

    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeTask = tasks.find((t) => t.id === activeId);
        if (!activeTask) return;

        // Determine the new status based on the drop target
        // The drop target could be a column (e.g. "todo") or another task in that column
        let newStatus: Task["status"] | undefined;

        if (["todo", "in_progress", "completed"].includes(overId)) {
            newStatus = overId as Task["status"];
        } else {
            // Dropped over another task, find that task's status
            const overTask = tasks.find((t) => t.id === overId);
            if (overTask) {
                newStatus = overTask.status;
            }
        }

        if (newStatus && newStatus !== activeTask.status) {
            updateMutation.mutate({
                id: activeId,
                status: newStatus,
            });
        }

        setActiveTask(null);
    };

    return (
        <DndContext
            sensors={sensors}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto pb-4">
                <KanbanColumn
                    id="todo"
                    title="To Do"
                    tasks={columns.todo}
                />
                <KanbanColumn
                    id="in_progress"
                    title="In Progress"
                    tasks={columns.in_progress}
                />
                <KanbanColumn
                    id="completed"
                    title="Completed"
                    tasks={columns.completed}
                />
            </div>

            {createPortal(
                <DragOverlay>
                    {activeTask && <KanbanCard task={activeTask} />}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}
