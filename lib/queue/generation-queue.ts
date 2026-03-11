import PQueue from "p-queue";

export interface JobStatus {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: { completed: number; total: number };
  results: Array<{ scenarioId: number; outputId?: number; error?: string }>;
  createdAt: Date;
  completedAt?: Date;
}

// In-memory job tracking
const jobs = new Map<string, JobStatus>();

// Single concurrency queue - process one generation at a time
const queue = new PQueue({ concurrency: 1 });

export function createJob(id: string, totalScenarios: number): JobStatus {
  const job: JobStatus = {
    id,
    status: "pending",
    progress: { completed: 0, total: totalScenarios },
    results: [],
    createdAt: new Date(),
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): JobStatus | undefined {
  return jobs.get(id);
}

export function updateJob(id: string, update: Partial<JobStatus>): void {
  const job = jobs.get(id);
  if (job) {
    Object.assign(job, update);
  }
}

export function addJobResult(
  id: string,
  result: JobStatus["results"][0],
): void {
  const job = jobs.get(id);
  if (job) {
    job.results.push(result);
    job.progress.completed = job.results.length;
    if (job.progress.completed >= job.progress.total) {
      job.status = "completed";
      job.completedAt = new Date();
    }
  }
}

export function enqueue(fn: () => Promise<void>): void {
  queue.add(fn);
}

// Clean up old jobs (older than 1 hour)
export function cleanupJobs(): void {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [id, job] of jobs) {
    if (
      job.createdAt.getTime() < oneHourAgo &&
      (job.status === "completed" || job.status === "failed")
    ) {
      jobs.delete(id);
    }
  }
}
