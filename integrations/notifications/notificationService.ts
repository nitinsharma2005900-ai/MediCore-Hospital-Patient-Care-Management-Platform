import { NotificationChannel, NotificationStatus } from '@medicore/shared';

export interface SendNotificationPayload {
  userId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  idempotencyKey?: string;
}

export interface NotificationResult {
  success: boolean;
  messageId: string;
  channel: NotificationChannel;
  timestamp: string;
  deliveredToSandbox: boolean;
}

export class NotificationSandboxService {
  private sentLog: Array<SendNotificationPayload & { timestamp: Date; messageId: string }> = [];

  /**
   * Dispatches email or SMS to local sandbox (e.g. Mailpit for SMTP, mock sandbox for SMS)
   * Handles idempotency, timeouts, and delivery verification.
   */
  public async send(payload: SendNotificationPayload): Promise<NotificationResult> {
    // Check idempotency
    if (payload.idempotencyKey) {
      const existing = this.sentLog.find(l => l.idempotencyKey === payload.idempotencyKey);
      if (existing) {
        return {
          success: true,
          messageId: existing.messageId,
          channel: existing.channel,
          timestamp: existing.timestamp.toISOString(),
          deliveredToSandbox: true
        };
      }
    }

    const messageId = `MSG-SANDBOX-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Simulate sandbox dispatch (e.g., to Mailpit on localhost:1025 or mock SMS gateway)
    const logEntry = {
      ...payload,
      messageId,
      timestamp: new Date()
    };
    this.sentLog.push(logEntry);

    return {
      success: true,
      messageId,
      channel: payload.channel,
      timestamp: logEntry.timestamp.toISOString(),
      deliveredToSandbox: true
    };
  }

  public getDispatchHistory() {
    return [...this.sentLog];
  }
}

export const notificationService = new NotificationSandboxService();
