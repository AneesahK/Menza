import { chatRouter } from "./routers/chat";
import { userRouter } from "./routers/user";
import { widgetRouter } from "./routers/widget";
import { createCallerFactory, createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  chat: chatRouter,
  user: userRouter,
  widget: widgetRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
