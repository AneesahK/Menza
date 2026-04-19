import { chatRouter } from "./routers/chat";
import { memoryRouter } from "./routers/memory";
import { widgetRouter } from "./routers/widget";
import { createCallerFactory, createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  chat: chatRouter,
  widget: widgetRouter,
  memory: memoryRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
