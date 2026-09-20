import { after } from "next/server";
import { z } from "zod";
import { withUser } from "@/modules/jds/http";
import {
  claimMatching,
  matchSnapshot,
  releaseMatching,
  runMatching,
} from "@/modules/matching/service";

const Input = z.object({ retryFailed: z.boolean().optional() }).strict();
type Context = { params: Promise<{ id: string }> };
export const maxDuration = 300;

export async function GET(_request: Request, context: Context) {
  return withUser(async (userId) =>
    Response.json(await matchSnapshot((await context.params).id, userId), {
      headers: { "Cache-Control": "private, no-store" },
    }),
  );
}

export async function POST(request: Request, context: Context) {
  return withUser(async (userId) => {
    const { retryFailed = false } = Input.parse(await request.json());
    const { id } = await context.params;
    const job = await claimMatching(id, userId, retryFailed);
    if (job) {
      try {
        after(() => runMatching(job, retryFailed));
      } catch (error) {
        await releaseMatching(job);
        throw error;
      }
    }
    return Response.json({ scheduled: !!job }, { status: 202 });
  });
}
