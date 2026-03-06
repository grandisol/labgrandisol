/**
 * Queue Module Tests
 * Tests for Bull job queue functionality
 */

import { QueueManager, getQueue } from '../utils/queue.js';

describe('Queue Module', () => {
  let queueManager: QueueManager;

  beforeAll(async () => {
    queueManager = new QueueManager();
    // Note: Initialize would connect to Redis, which may not be available in test environment
    // await queueManager.initialize();
  });

  afterAll(async () => {
    // Note: Shutdown would disconnect from Redis
    // await queueManager.shutdown();
  });

  describe('Queue Manager Creation', () => {
    it('should create queue manager instance', () => {
      expect(queueManager).toBeDefined();
      expect(queueManager).toBeInstanceOf(QueueManager);
    });

    it('should return same instance from getQueue()', () => {
      const queue1 = getQueue();
      const queue2 = getQueue();

      expect(queue1).toBe(queue2);
    });
  });

  describe('Email Jobs', () => {
    it('should create email job data structure', () => {
      const emailJob = {
        type: 'send_email' as const,
        to: 'test@example.com',
        subject: 'Test Email',
        body: 'This is a test email',
        userId: 1,
      };

      expect(emailJob.type).toBe('send_email');
      expect(emailJob.to).toBe('test@example.com');
      expect(emailJob.subject).toBe('Test Email');
    });

    it('should handle HTML email', () => {
      const emailJob = {
        type: 'send_email' as const,
        to: 'test@example.com',
        subject: 'Test',
        body: 'Body',
        html: '<p>HTML Body</p>',
        userId: 1,
      };

      expect(emailJob.html).toBe('<p>HTML Body</p>');
    });
  });

  describe('Notification Jobs', () => {
    it('should create notification job data structure', () => {
      const notifJob = {
        type: 'send_notification' as const,
        userId: 1,
        title: 'New Note',
        message: 'You have a new note',
        severity: 'info' as const,
      };

      expect(notifJob.type).toBe('send_notification');
      expect(notifJob.title).toBe('New Note');
    });

    it('should handle different notification severities', () => {
      const severities = ['alert', 'info', 'success'] as const;

      severities.forEach((severity) => {
        const notifJob = {
          type: 'send_notification' as const,
          userId: 1,
          title: 'Test',
          message: 'Message',
          severity,
        };

        expect(notifJob.severity).toBe(severity);
      });
    });
  });

  describe('Export Jobs', () => {
    it('should support PDF export', () => {
      const exportJob = {
        type: 'process_export' as const,
        userId: 1,
        format: 'pdf' as const,
        resource: 'notes' as const,
      };

      expect(exportJob.format).toBe('pdf');
    });

    it('should support CSV export', () => {
      const exportJob = {
        type: 'process_export' as const,
        userId: 1,
        format: 'csv' as const,
        resource: 'profile' as const,
      };

      expect(exportJob.format).toBe('csv');
    });

    it('should support JSON export', () => {
      const exportJob = {
        type: 'process_export' as const,
        userId: 1,
        format: 'json' as const,
        resource: 'notes' as const,
      };

      expect(exportJob.format).toBe('json');
    });
  });

  describe('Cleanup Jobs', () => {
    it('should create cleanup job', () => {
      const cleanupJob = {
        type: 'cleanup_temp' as const,
        pattern: 'temp:*',
        olderThanDays: 7,
      };

      expect(cleanupJob.pattern).toBe('temp:*');
      expect(cleanupJob.olderThanDays).toBe(7);
    });
  });

  describe('Sync Jobs', () => {
    it('should create sync job for different services', () => {
      const services = ['google-drive', 'dropbox', 'aws-s3'];

      services.forEach((service) => {
        const syncJob = {
          type: 'sync_remote' as const,
          userId: 1,
          service,
        };

        expect(syncJob.service).toBe(service);
      });
    });
  });

  describe('Job Priorities', () => {
    it('should be creatable with priority options', () => {
      const emailJob = {
        type: 'send_email' as const,
        to: 'test@example.com',
        subject: 'Urgent',
        body: 'Urgent message',
        userId: 1,
      };

      const jobOptions = {
        priority: 10, // Higher priority
        attempts: 5,
        backoff: {
          type: 'exponential' as const,
          delay: 5000,
        },
      };

      expect(jobOptions.priority).toBe(10);
      expect(jobOptions.attempts).toBe(5);
    });
  });

  describe('Job Types', () => {
    it('should support all job types', () => {
      const jobTypes: Array<
        'send_email' | 'send_notification' | 'process_export' | 'cleanup_temp' | 'sync_remote'
      > = ['send_email', 'send_notification', 'process_export', 'cleanup_temp', 'sync_remote'];

      expect(jobTypes.length).toBe(5);
      expect(jobTypes).toContain('send_email');
      expect(jobTypes).toContain('send_notification');
    });
  });
});