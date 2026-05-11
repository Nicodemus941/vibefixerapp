import { Inngest, eventType, staticSchema } from "inngest";

export const events = {
  generateRebuild: eventType("generate/rebuild", {
    schema: staticSchema<{ projectId: string }>(),
  }),
};

export const inngest = new Inngest({ id: "rebuild-engine" });
