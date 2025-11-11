import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { submitFeedbackProcedure } from "./routes/feedback/submit/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  feedback: createTRPCRouter({
    submit: submitFeedbackProcedure,
  }),
});

export type AppRouter = typeof appRouter;
