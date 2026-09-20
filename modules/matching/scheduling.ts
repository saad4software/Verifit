import { after } from "next/server";
import { listJds } from "@/modules/jds/service";
import { matchingSchemaId } from "./agent";

/** Matching failure must not turn a successful CV save or JD review into a failure. */
export function scheduleMatching(userId: string, jdId?: string) {
  if (!matchingSchemaId()) return;
  try {
    after(async () => {
      try {
        const { claimMatching, runMatching } = await import("./service");
        const deadline = Date.now() + 180_000;
        const ids = jdId
          ? [jdId]
          : (await listJds(userId))
              .filter((jd) => jd.readiness === "ready")
              .map((jd) => jd._id);
        for (const id of ids) {
          if (Date.now() >= deadline) break;
          const job = await claimMatching(id, userId);
          if (job) await runMatching(job, false, deadline);
        }
      } catch {
        // Saved inputs remain pending and the matching panel resumes the work.
        console.error(
          "Background matching was interrupted; pending assessments will resume on the next visit.",
        );
      }
    });
  } catch {
    console.error(
      "Background matching could not be scheduled; open the JD to resume.",
    );
  }
}
