import type { RecallNotification } from '@/types/recall';
import { now } from './date';

export interface NotificationResult {
  success: string[];
  failed: string[];
}

export const mockSendNotification = (
  notifications: RecallNotification[]
): Promise<NotificationResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const success: string[] = [];
      const failed: string[] = [];

      notifications.forEach((n) => {
        if (Math.random() > 0.05) {
          success.push(n.id);
        } else {
          failed.push(n.id);
        }
      });

      resolve({ success, failed });
    }, 1000 + Math.random() * 1500);
  });
};

export const simulateAutoResponse = (
  notification: RecallNotification,
  callback: (
    id: string,
    status: RecallNotification['status'],
    respondedAt: string
  ) => void
): void => {
  const delays = [2000, 5000, 10000, 15000];
  const statuses: RecallNotification['status'][] = [
    'received',
    'off_shelf',
    'returned',
  ];

  delays.forEach((delay, index) => {
    setTimeout(() => {
      if (index < statuses.length) {
        callback(notification.id, statuses[index], now());
      }
    }, delay * (0.5 + Math.random()));
  });
};
