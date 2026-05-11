import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { generateRebuild } from "@/lib/inngest/functions/generate";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateRebuild],
});
