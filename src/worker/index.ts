import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { z } from "zod";
import * as schema from "./db/schema";
import { task, tag, taskTag, taskStatusEnum, priorityEnum } from "./db/schema";
import { getAuth } from "./lib/auth";
import { getAuthUser } from "./lib/get-auth-user";

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(taskStatusEnum).optional().default("todo"),
  priority: z.enum(priorityEnum).optional().default("medium"),
  deadline: z.string().optional().nullable(), // ISO string
  tags: z.array(z.string()).optional(), // Array of tag names
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(taskStatusEnum).optional(),
  priority: z.enum(priorityEnum).optional(),
  deadline: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  const auth = getAuth(c.env);
  return auth.handler(c.req.raw);
});

app.get("/api/me", async (c) => {
  const auth = getAuth(c.env);
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({ user: session.user });
});

app.get("/api/tasks", async (c) => {
  const user = await getAuthUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = drizzle(c.env.DB, { schema });
  const tasks = await db.query.task.findMany({
    where: eq(task.userId, user.id),
    with: {
      tags: {
        with: {
          tag: true,
        },
      },
    },
  });

  // Transform to flat tags array
  const formattedTasks = tasks.map((t) => ({
    ...t,
    tags: t.tags.map((tt) => tt.tag),
  }));
  console.log("GET /api/tasks RESULT:", JSON.stringify(formattedTasks, null, 2));
  return c.json({ tasks: formattedTasks });
});

app.get("/api/tasks/:id", async (c) => {
  const user = await getAuthUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const taskId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const foundTask = await db.query.task.findFirst({
    where: and(eq(task.id, taskId), eq(task.userId, user.id)),
    with: {
      tags: {
        with: {
          tag: true,
        },
      },
    },
  });

  if (!foundTask) {
    return c.json({ error: "Task not found" }, 404);
  }

  const formattedTask = {
    ...foundTask,
    tags: foundTask.tags.map((tt) => tt.tag),
  };

  return c.json({ task: formattedTask });
});

app.post("/api/tasks", zValidator("json", createTaskSchema), async (c) => {
  const user = await getAuthUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = c.req.valid("json");
  console.log("POST /api/tasks BODY:", JSON.stringify(body, null, 2));
  const db = drizzle(c.env.DB, { schema });
  const now = new Date();

  const newTask = {
    id: crypto.randomUUID(),
    title: body.title,
    description: body.description ?? null,
    status: body.status,
    priority: body.priority,
    deadline: body.deadline ? new Date(body.deadline) : null,
    userId: user.id,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(task).values(newTask);

  // Handle tags
  if (body.tags && body.tags.length > 0) {
    for (const tagName of body.tags) {
      console.log("Processing tag:", tagName);
      // Find or create tag
      let tagId: string;
      const existingTag = await db.query.tag.findFirst({
        where: and(eq(tag.name, tagName), eq(tag.userId, user.id)),
      });

      if (existingTag) {
        tagId = existingTag.id;
      } else {
        tagId = crypto.randomUUID();
        await db.insert(tag).values({
          id: tagId,
          name: tagName,
          color: "blue", // Default color
          userId: user.id,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Link tag to task
      await db.insert(taskTag).values({
        taskId: newTask.id,
        tagId: tagId,
      });
    }
  }

  const createdTask = await db.query.task.findFirst({
    where: eq(task.id, newTask.id),
    with: {
      tags: {
        with: {
          tag: true,
        },
      },
    },
  });

  const formattedTask = {
    ...createdTask,
    tags: createdTask?.tags.map((tt) => tt.tag) || [],
  };

  return c.json({ task: formattedTask }, 201);
});

app.patch("/api/tasks/:id", zValidator("json", updateTaskSchema), async (c) => {
  const user = await getAuthUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const taskId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const existingTask = await db.query.task.findFirst({
    where: and(eq(task.id, taskId), eq(task.userId, user.id)),
  });

  if (!existingTask) {
    return c.json({ error: "Task not found" }, 404);
  }

  const body = c.req.valid("json");

  const updateData: Partial<typeof existingTask> = {
    updatedAt: new Date(),
  };

  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.priority !== undefined) updateData.priority = body.priority;
  if (body.deadline !== undefined) updateData.deadline = body.deadline ? new Date(body.deadline) : null;

  await db.update(task).set(updateData).where(eq(task.id, taskId));

  // Handle tags update if provided
  if (body.tags !== undefined) {
    // Remove existing tags
    await db.delete(taskTag).where(eq(taskTag.taskId, taskId));

    // Add new tags
    const now = new Date();
    for (const tagName of body.tags) {
      let tagId: string;
      const existingTag = await db.query.tag.findFirst({
        where: and(eq(tag.name, tagName), eq(tag.userId, user.id)),
      });

      if (existingTag) {
        tagId = existingTag.id;
      } else {
        tagId = crypto.randomUUID();
        await db.insert(tag).values({
          id: tagId,
          name: tagName,
          color: "blue",
          userId: user.id,
          createdAt: now,
          updatedAt: now,
        });
      }

      await db.insert(taskTag).values({
        taskId: taskId,
        tagId: tagId,
      });
    }
  }

  const updatedTask = await db.query.task.findFirst({
    where: eq(task.id, taskId),
    with: {
      tags: {
        with: {
          tag: true,
        },
      },
    },
  });

  const formattedTask = {
    ...updatedTask,
    tags: updatedTask?.tags.map((tt) => tt.tag) || [],
  };

  return c.json({ task: formattedTask });
});

app.delete("/api/tasks/:id", async (c) => {
  const user = await getAuthUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const taskId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const existingTask = await db.query.task.findFirst({
    where: and(eq(task.id, taskId), eq(task.userId, user.id)),
  });

  if (!existingTask) {
    return c.json({ error: "Task not found" }, 404);
  }

  await db.delete(task).where(eq(task.id, taskId));

  return c.json({ message: "Task deleted successfully" });
});

app.get("/api/tags", async (c) => {
  const user = await getAuthUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = drizzle(c.env.DB, { schema });
  const tags = await db.query.tag.findMany({
    where: eq(tag.userId, user.id),
  });

  return c.json({ tags });
});

export default app;
