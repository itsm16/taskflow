import { MailtrapClient } from "mailtrap";
import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";

type EmailJob = {
    to: string;
    subject: string;
    text: string;
}

const mailtrap = new MailtrapClient({
    token: process.env.MAILTRAP_API_KEY!,
});

const client = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

const EMAIL_QUEUE_NAME = "email-queue";

const emailQueue = new Queue<EmailJob>(EMAIL_QUEUE_NAME, {
    connection: client,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});

const emailWorker = new Worker<EmailJob>(EMAIL_QUEUE_NAME, async (job) => {
    const { to, subject, text } = job.data;
    await mailtrap.send({
        from: { name: "Taskflow", email: process.env.MAILTRAP_SENDER_EMAIL ?? "hello@demomailtrap.co" },
        to: [{ email: to }],
        subject,
        text,
    });
    console.log(`Email "${subject}" sent to ${to}`);
}, { connection: client });

emailWorker.on("failed", (job, err) => {
    console.error(`Email job ${job?.id} failed: ${err.message}`);
});

const sendMail = async ({ to, subject, text }: EmailJob) => {
    return emailQueue.add("send", { to, subject, text });
};

const JOB_TYPES = ["active", "waiting", "delayed", "completed", "failed"] as const;

const getJobs = async () => {
    const counts = await emailQueue.getJobCounts(...JOB_TYPES);
    const jobs = await emailQueue.getJobs([...JOB_TYPES]);
    const detailed = await Promise.all(
        jobs.map(async (job) => ({
            id: job.id,
            name: job.name,
            queue: EMAIL_QUEUE_NAME,
            data: job.data,
            status: await job.getState(),
            attemptsMade: job.attemptsMade,
            maxAttempts: job.opts.attempts,
            failedReason: job.failedReason ?? null,
            timestamp: job.timestamp,
            processedOn: job.processedOn ?? null,
            finishedOn: job.finishedOn ?? null,
        }))
    );
    return {
        counts,
        total: detailed.length,
        jobs: detailed.sort((a, b) => b.timestamp - a.timestamp),
    };
};

export { sendMail, getJobs };
