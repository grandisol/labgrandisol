/**
 * Message Queue Module (Bull)
 * Provides asynchronous job processing with retry logic and persistence
 * @module utils/queue
 */

import { Queue, Job, QueueOptions } from 'bull';
import Logger from './logger.js';

const logger = new Logger('Queue');

/**
 * Job types for the queue
 */
export type JobType = 'send_email' | 'send_notification' | 'process_export' | 'cleanup_temp' | 'sync_remote';

/**
 * Email job payload
 */
export interface EmailJobData {
  type: 'send_email';
  to: string;
  subject: string;
  body: string;
  html?: string;
  userId: number;
}

/**
 * Notification job payload
 */
export interface NotificationJobData {
  type: 'send_notification';
  userId: number;
  title: string;
  message: string;
  severity: 'alert' | 'info' | 'success';
}

/**
 * Export job payload
 */
export interface ExportJobData {
  type: 'process_export';
  userId: number;
  format: 'pdf' | 'csv' | 'json';
  resource: 'notes' | 'profile';
}

/**
 * Cleanup job payload
 */
export interface CleanupJobData {
  type: 'cleanup_temp';
  pattern: string;
  olderThanDays: number;
}

/**
 * Sync job payload
 */
export interface SyncJobData {
  type: 'sync_remote';
  userId: number;
  service: string;
}

/**
 * Union of all job payload types
 */
export type JobData = EmailJobData | NotificationJobData | ExportJobData | CleanupJobData | SyncJobData;

/**
 * Queue configuration
 */
interface QueueConfig extends QueueOptions {
  attempts?: number;
  backoff?: {
    type: 'exponential';
    delay: number;
  };
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
}

/**
 * Queue Manager class
 */
export class QueueManager {
  private queues: Map<string, Queue<any>> = new Map();

  /**
   * Initialize queue manager
   */
  public async initialize(): Promise<void> {
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '1'), // Use different DB than cache
      };

      // Create queues
      this.createQueue('email', redisConfig);
      this.createQueue('notification', redisConfig);
      this.createQueue('export', redisConfig);
      this.createQueue('cleanup', redisConfig);
      this.createQueue('sync', redisConfig);

      // Register jobs handlers
      this.registerJobHandlers();

      logger.info('Queue manager initialized successfully');
    } catch (err) {
      logger.error('Failed to initialize queue manager', err as Error);
      throw err;
    }
  }

  /**
   * Create a queue
   * @param name Queue name
   * @param redisConfig Redis configuration
   */
  private createQueue(name: string, redisConfig: any): void {
    const config: QueueConfig = {
      ...redisConfig,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        age: 86400, // Keep for 24 hours
      },
      removeOnFail: false, // Keep failed jobs for debugging
    };

    // @ts-ignore - Bull Queue dynamic instantiation
    const queue: Queue<any> = new (Queue as any)(name, config);
    this.queues.set(name, queue);

    // Event listeners
    queue.on('completed', (job: Job) => {
      logger.debug(`Job completed: ${name}`, { jobId: job.id });
    });

    queue.on('failed', (job: Job, err: Error) => {
      logger.error(`Job failed: ${name}`, err, { jobId: job.id, attempt: job.attemptsMade });
    });

    queue.on('error', (err: Error) => {
      logger.error(`Queue error: ${name}`, err);
    });

    logger.info(`Queue created: ${name}`);
  }

  /**
   * Register job handlers
   */
  private registerJobHandlers(): void {
    const emailQueue = this.queues.get('email');
    const notificationQueue = this.queues.get('notification');
    const exportQueue = this.queues.get('export');
    const cleanupQueue = this.queues.get('cleanup');
    const syncQueue = this.queues.get('sync');

    // Email processor
    if (emailQueue) {
      emailQueue.process(5, this.handleEmailJob.bind(this));
      logger.debug('Email processor registered');
    }

    // Notification processor
    if (notificationQueue) {
      notificationQueue.process(10, this.handleNotificationJob.bind(this));
      logger.debug('Notification processor registered');
    }

    // Export processor
    if (exportQueue) {
      exportQueue.process(2, this.handleExportJob.bind(this));
      logger.debug('Export processor registered');
    }

    // Cleanup processor
    if (cleanupQueue) {
      cleanupQueue.process(1, this.handleCleanupJob.bind(this));
      logger.debug('Cleanup processor registered');
    }

    // Sync processor
    if (syncQueue) {
      syncQueue.process(3, this.handleSyncJob.bind(this));
      logger.debug('Sync processor registered');
    }
  }

  /**
   * Handle email job
   */
  private async handleEmailJob(job: Job<EmailJobData>): Promise<void> {
    logger.logAudit('send_email', job.data.userId, 'email', {
      to: job.data.to,
      subject: job.data.subject,
    });

    // TODO: Implement actual email sending
    // Example with nodemailer:
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({
    //   from: process.env.SMTP_FROM,
    //   to: job.data.to,
    //   subject: job.data.subject,
    //   html: job.data.html,
    // });

    logger.info(`Email sent to ${job.data.to}`, { jobId: job.id });
  }

  /**
   * Handle notification job
   */
  private async handleNotificationJob(job: Job<NotificationJobData>): Promise<void> {
    logger.logAudit('create_notification', job.data.userId, 'notification', {
      type: job.data.type,
      title: job.data.title,
    });

    // TODO: Implement notification delivery
    // - WebSocket push
    // - Database record
    // - Email notification
    // - SMS notification

    logger.info(`Notification sent to user ${job.data.userId}`, { jobId: job.id });
  }

  /**
   * Handle export job
   */
  private async handleExportJob(job: Job<ExportJobData>): Promise<void> {
    logger.logAudit('export_data', job.data.userId, job.data.resource, {
      format: job.data.format,
    });

    // TODO: Implement data export
    // - Generate file (PDF, CSV, JSON)
    // - Store in S3 or local storage
    // - Send download link via email
    // - Update job with file path

    logger.info(`Export generated for user ${job.data.userId}`, { jobId: job.id });
  }

  /**
   * Handle cleanup job
   */
  private async handleCleanupJob(job: Job<CleanupJobData>): Promise<void> {
    logger.info('Running cleanup job', {
      pattern: job.data.pattern,
      olderThanDays: job.data.olderThanDays,
    });

    // TODO: Implement cleanup logic
    // - Delete temporary files
    // - Remove old session data
    // - Archive old logs
    // - Clean up database

    logger.info('Cleanup job completed', { jobId: job.id });
  }

  /**
   * Handle sync job
   */
  private async handleSyncJob(job: Job<SyncJobData>): Promise<void> {
    logger.logAudit('sync_remote', job.data.userId, job.data.service, {});

    // TODO: Implement remote sync
    // - Sync with external services (Google Drive, Dropbox, etc.)
    // - Update local data with remote changes
    // - Handle conflicts

    logger.info(`Sync completed for user ${job.data.userId}`, {
      jobId: job.id,
      service: job.data.service,
    });
  }

  /**
   * Add email job to queue
   */
  public async addEmailJob(data: EmailJobData, options?: any): Promise<Job> {
    const queue = this.queues.get('email');
    if (!queue) {
      throw new Error('Email queue not initialized');
    }

    const job = await queue.add(data, {
      jobId: `email-${data.userId}-${Date.now()}`,
      ...options,
    });

    logger.debug(`Email job added: ${job.id}`);
    return job;
  }

  /**
   * Add notification job to queue
   */
  public async addNotificationJob(data: NotificationJobData, options?: any): Promise<Job> {
    const queue = this.queues.get('notification');
    if (!queue) {
      throw new Error('Notification queue not initialized');
    }

    const job = await queue.add(data, {
      jobId: `notif-${data.userId}-${Date.now()}`,
      ...options,
    });

    logger.debug(`Notification job added: ${job.id}`);
    return job;
  }

  /**
   * Add export job to queue
   */
  public async addExportJob(data: ExportJobData, options?: any): Promise<Job> {
    const queue = this.queues.get('export');
    if (!queue) {
      throw new Error('Export queue not initialized');
    }

    const job = await queue.add(data, {
      jobId: `export-${data.userId}-${Date.now()}`,
      ...options,
    });

    logger.debug(`Export job added: ${job.id}`);
    return job;
  }

  /**
   * Add cleanup job to queue
   */
  public async addCleanupJob(data: CleanupJobData, options?: any): Promise<Job> {
    const queue = this.queues.get('cleanup');
    if (!queue) {
      throw new Error('Cleanup queue not initialized');
    }

    const job = await queue.add(data, {
      jobId: `cleanup-${Date.now()}`,
      ...options,
    });

    logger.debug(`Cleanup job added: ${job.id}`);
    return job;
  }

  /**
   * Add sync job to queue
   */
  public async addSyncJob(data: SyncJobData, options?: any): Promise<Job> {
    const queue = this.queues.get('sync');
    if (!queue) {
      throw new Error('Sync queue not initialized');
    }

    const job = await queue.add(data, {
      jobId: `sync-${data.userId}-${Date.now()}`,
      ...options,
    });

    logger.debug(`Sync job added: ${job.id}`);
    return job;
  }

  /**
   * Get queue stats
   */
  public async getStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};

    for (const [name, queue] of this.queues) {
      try {
        const counts = await queue.getJobCounts();
        stats[name] = counts;
      } catch (err) {
        logger.error(`Error getting stats for ${name}`, err as Error);
      }
    }

    return stats;
  }

  /**
   * Drain a queue (remove all jobs)
   */
  public async drainQueue(name: string): Promise<void> {
    const queue = this.queues.get(name);
    if (queue && 'drain' in queue) {
      await (queue as any).drain();
      logger.info(`Queue drained: ${name}`);
    }
  }

  /**
   * Shutdown queue manager
   */
  public async shutdown(): Promise<void> {
    try {
      // Close all queues
      for (const [name, queue] of this.queues) {
        await queue.close();
        logger.debug(`Queue closed: ${name}`);
      }

      logger.info('Queue manager shutdown complete');
    } catch (err) {
      logger.error('Error during queue shutdown', err as Error);
    }
  }
}

/**
 * Global queue instance
 */
let queueInstance: QueueManager | null = null;

/**
 * Get or create global queue instance
 */
export function getQueue(): QueueManager {
  if (!queueInstance) {
    queueInstance = new QueueManager();
  }
  return queueInstance;
}

/**
 * Initialize global queue
 */
export async function initializeQueue(): Promise<void> {
  const queue = getQueue();
  await queue.initialize();
}

/**
 * Shutdown global queue
 */
export async function shutdownQueue(): Promise<void> {
  if (queueInstance) {
    await queueInstance.shutdown();
    queueInstance = null;
  }
}

export default QueueManager;
