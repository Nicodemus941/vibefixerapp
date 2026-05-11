import { events, inngest } from "../client";

// Phase 2 M1: placeholder. The real pipeline (spec → materialize → github → vercel)
// is wired in M5. For now this exists so /api/inngest registers at least one
// function and the Inngest dev server has something to display.
export const generateRebuild = inngest.createFunction(
  {
    id: "generate-rebuild",
    name: "Generate rebuild",
    triggers: [events.generateRebuild],
  },
  async ({ event, step, logger }) => {
    logger.info("generate/rebuild received", { projectId: event.data.projectId });

    await step.run("placeholder", async () => {
      return { projectId: event.data.projectId, note: "M1 placeholder" };
    });

    return { ok: true };
  },
);
