import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/date-picker";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import {
  createTaskSchema,
  useCreateTaskMutation,
  type CreateTaskForm,
} from "@/hooks/use-create-task-mutation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState } from "react";

interface CreateTaskFormProps {
  onSuccess: () => void;
}

export function CreateTaskForm({ onSuccess }: CreateTaskFormProps) {
  const [tagInput, setTagInput] = useState("");
  const form = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      tags: [],
    },
  });

  const { mutate, isPending } = useCreateTaskMutation();

  const onSubmit = (data: CreateTaskForm) => {
    const pendingTag = tagInput.trim();
    const finalTags = [...(data.tags || [])];
    if (pendingTag && !finalTags.includes(pendingTag)) {
      finalTags.push(pendingTag);
    }
    const finalData = { ...data, tags: finalTags };

    console.log("Submitting task data:", finalData);
    mutate(finalData, {
      onSuccess: () => {
        toast.success("Task created successfully");
        form.reset();
        setTagInput("");
        onSuccess();
      },
      onError: () => {
        toast.error("Failed to create task");
      },
    });
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag) {
        const currentTags = form.getValues("tags") || [];
        if (!currentTags.includes(tag)) {
          form.setValue("tags", [...currentTags, tag]);
        }
        setTagInput("");
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove)
    );
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Controller
          name="title"
          control={form.control}
          render={({ field }) => <Input {...field} placeholder="Title" />}
        />
        {form.formState.errors.title && (
          <p className="text-red-500 text-sm mt-1">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>
      <div>
        <Controller
          name="description"
          control={form.control}
          render={({ field }) => (
            <Textarea {...field} placeholder="Description (optional)" />
          )}
        />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <Controller
            name="priority"
            control={form.control}
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Priority</label>
                <select
                  {...field}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            )}
          />
        </div>
        <div className="flex-1">
          <Controller
            name="deadline"
            control={form.control}
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Deadline</label>
                <DatePicker date={field.value} setDate={field.onChange} />
              </div>
            )}
          />
        </div>
      </div>
      <div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Tags</label>
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Type tag and press Enter"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {form.watch("tags")?.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Creating..." : "Create Task"}
      </Button>
    </form>
  );
}
