import { v4 as uuidv4 } from "uuid";

type JobStatus = "queued" | "running" | "completed" | "failed" | "payment_required";

interface JobRecord {
  id: string;
  requester?: string;
  provider?: string;
  status: JobStatus;
  quote?: any;
  result?: any;
  createdAt: string;
  updatedAt: string;
}

const store = new Map<string, JobRecord>();

export function createJob(initial: Partial<JobRecord>): JobRecord {
  const id = uuidv4();
  const rec: JobRecord = {
    id,
    status: "queued",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...initial,
  };
  store.set(id, rec);
  return rec;
}

export function updateJob(id: string, patch: Partial<JobRecord>) {
  const rec = store.get(id);
  if (!rec) throw new Error("job-not-found");
  const updated = { ...rec, ...patch, updatedAt: new Date().toISOString() };
  store.set(id, updated);
  return updated;
}

export function getJob(id: string) {
  return store.get(id);
}
