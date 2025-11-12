import express from "express";
import { parseA2A } from "../middleware/a2a.js";
import { getBestQuote } from "../services/quoteClient.js";
import { runOnExecutor } from "../services/executorClient.js";
import { createJob, updateJob, getJob } from "../db/jobStore.js";
import { A2AEnvelope, RunTaskPayload } from "../types.js";

const router = express.Router();

// A2A message endpoint
router.post("/a2a/message", parseA2A, async (req: express.Request & { a2a?: A2AEnvelope }, res) => {
  const env = req.a2a!;
  if (env.type === "task_request") {
    const job = createJob({ requester: env.agent_id, status: "payment_required" });

    const responseEnvelope: A2AEnvelope = {
      type: "payment_required",
      agent_id: "galaksio-broker",
      payload: {
        accepts: [
          {
            scheme: "exact",
            network: "base-sepolia",
            payTo: process.env.BROKER_WALLET || "0x066e4FBb1Cb2fd7dE4fb1432a7B1C1169B4c2C8F",
            asset: "0x036CbD53842c5426634e7929541eC2318b4c2C8F",
            maxAmountRequired: "1000000000000000",
            description: "Pay to run requested task",
          },
        ],
      },
      meta: { jobId: job.id },
    };
    return res.status(200).json(responseEnvelope);
  }

  return res.status(400).json({ error: "unsupported-a2a-type" });
});

// Run endpoint (payment already verified by middleware)
router.post("/run", async (req, res) => {
  const payload = (req.body?.payload ?? req.body) as RunTaskPayload;

  const job = createJob({
    requester: (req as any).headers["x-wallet"] || "anonymous",
    status: "queued",
  });

  try {
    // Map payload to orchestration spec
    const spec = {
      provider: payload.provider,
      cpu_cores: payload.cpu,       // map cpu to cpu_cores
      memory_gb: payload.memory,    // if you have memory in payload
      storage_gb: payload.storage,  // map storage
      size_gb: payload.size,        // if storage task has size
      duration_days: payload.duration_days,
      permanent: payload.permanent,
      gpu: payload.gpu,
      // Add cache fields from meta (mapped to quote engine field names)
      cache_operation: payload.meta?.cacheOperation,
      size_mb: payload.meta?.cacheSize,
      ttl_hours: payload.meta?.cacheTtl ? payload.meta.cacheTtl / 3600 : undefined, // convert seconds to hours
      // Note: cacheId, cacheKey, cacheValue, cacheRegion are runtime parameters
      // passed to executor, not needed for quote engine
    };

    console.log("Orchestration spec:", spec);

    const quote = await getBestQuote(spec);

    console.log("Obtained quote:", quote);

    updateJob(job.id, { status: "running", quote, provider: quote.quote?.provider || quote.provider });

    const execResp = await runOnExecutor({ jobId: job.id, payload, quote });

    updateJob(job.id, { status: "completed", result: execResp });
    return res.json({ jobId: job.id, status: "completed", result: execResp });
  } catch (err: any) {
    updateJob(job.id, { status: "failed", result: { error: err.message } });
    return res.status(500).json({ error: err.message });
  }
});

// Status endpoint
router.get("/status/:id", (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: "not-found" });
  return res.json(job);
});

export default router;
