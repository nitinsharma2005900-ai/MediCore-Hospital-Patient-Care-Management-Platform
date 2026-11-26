import { NotificationChannel } from '@medicore/shared';
import { notificationService } from '../../integrations/notifications/notificationService';

export interface BackgroundJob {
  id: string;
  type: 'APPOINTMENT_REMINDER' | 'OVERDUE_INVOICE' | 'LAB_RESULTS_DISPATCH';
  payload: any;
  attempts: number;
}

export class MediCoreWorker {
  private queue: BackgroundJob[] = [];
  private isRunning: boolean = false;

  public enqueue(type: BackgroundJob['type'], payload: any): string {
    const id = `JOB-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    this.queue.push({ id, type, payload, attempts: 0 });
    return id;
  }

  public async processNext(): Promise<boolean> {
    const job = this.queue.shift();
    if (!job) return false;

    job.attempts++;
    try {
      if (job.type === 'APPOINTMENT_REMINDER') {
        await notificationService.send({
          userId: job.payload.patientId,
          title: 'Appointment Reminder',
          message: `Upcoming appointment scheduled for ${job.payload.scheduledTime}`,
          channel: NotificationChannel.EMAIL,
          idempotencyKey: `REMINDER-${job.payload.appointmentId}`
        });
      } else if (job.type === 'LAB_RESULTS_DISPATCH') {
        await notificationService.send({
          userId: job.payload.patientId,
          title: 'Laboratory Diagnostic Results Ready',
          message: `Your results for ${job.payload.testPanel} are validated and available in your portal.`,
          channel: NotificationChannel.SMS,
          idempotencyKey: `LAB-DISPATCH-${job.payload.labOrderId}`
        });
      }
      return true;
    } catch (err) {
      if (job.attempts < 3) {
        this.queue.push(job); // Retry
      }
      return false;
    }
  }

  public getQueueLength(): number {
    return this.queue.length;
  }
}

export const worker = new MediCoreWorker();
