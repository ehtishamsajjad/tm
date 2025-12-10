import {
  IconTrendingDown,
  IconTrendingUp,
  IconCircleCheck,
  IconClock,
  IconListCheck,
  IconActivity,
} from "@tabler/icons-react";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasksQuery } from "@/hooks/use-tasks-query";

export function SectionCards() {
  const { data, isPending, isError } = useTasksQuery();

  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <Skeleton className="h-5 w-5 rounded-lg mb-2" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return <div className="px-4 lg:px-6">Error loading tasks data.</div>;
  }

  const total = data.tasks.length;
  const pending = data.tasks.filter((t) => t.status === "todo").length;
  const active = data.tasks.filter((t) => t.status === "in_progress").length;
  const completed = data.tasks.filter((t) => t.status === "completed").length;
  const completionRate =
    total > 0 ? ((completed / total) * 100).toFixed(1) : "0.0";

  const cardConfig = [
    {
      title: "Total Tasks",
      value: total,
      description: "All tasks in the system",
      icon: IconListCheck,
      trend: "up",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Pending Tasks",
      value: pending,
      description: "Requires attention",
      icon: IconClock,
      trend: "down",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "Active Tasks",
      value: active,
      description: "Active work items",
      icon: IconActivity,
      trend: "up",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Completion Rate",
      value: `${completionRate}%`,
      description: "Overall progress",
      icon: IconCircleCheck,
      trend: "up",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      iconColor: "text-green-600 dark:text-green-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cardConfig.map((config, index) => {
        const IconComponent = config.icon;
        const TrendIcon =
          config.trend === "up" ? IconTrendingUp : IconTrendingDown;

        return (
          <Card key={index} className="@container/card overflow-hidden">
            <div className={`absolute inset-0 ${config.bgColor} -z-10`} />
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${config.bgColor}`}>
                  <IconComponent
                    className={`size-5 ${config.iconColor}`}
                    strokeWidth={1.5}
                  />
                </div>
              </div>
              <CardDescription className="text-xs font-medium uppercase tracking-wider">
                {config.title}
              </CardDescription>
              <CardTitle className="text-2xl font-bold tabular-nums @[250px]/card:text-3xl">
                {config.value}
              </CardTitle>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-2 text-sm">
              <div className="flex items-center gap-2">
                <TrendIcon className="size-4" strokeWidth={1.5} />
                <span className="font-medium text-foreground">
                  {config.title.toLowerCase()}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {config.description}
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}