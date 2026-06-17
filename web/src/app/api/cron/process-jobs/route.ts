import { NextRequest, NextResponse } from "next/server";
import { runSchedulerOnce } from "@/lib/scheduler";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Optional security check using CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    logger.warn("cron-process-jobs", "Unauthorized cron trigger attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    logger.info("cron-process-jobs", "Triggering background job processing via cron...");
    await runSchedulerOnce();
    return NextResponse.json({ success: true, message: "Scheduler run complete" });
  } catch (error: any) {
    logger.error("cron-process-jobs", `Cron run failed: ${error.message || error}`);
    return NextResponse.json({ error: "Cron execution failed", details: error.message }, { status: 500 });
  }
}
