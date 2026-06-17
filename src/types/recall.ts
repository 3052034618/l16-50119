export type RecallLevel = 'level1' | 'level2' | 'level3';
export type RecallStatus = 'pending' | 'notifying' | 'in_progress' | 'completed';
export type RecallNotificationStatus =
  | 'pending'
  | 'sent'
  | 'received'
  | 'off_shelf'
  | 'returned'
  | 'urged';

export interface RecallNotification {
  id: string;
  recallId: string;
  recipientType: 'dealer' | 'store';
  recipientId: string;
  recipientName: string;
  contact: string;
  status: RecallNotificationStatus;
  quantity: number;
  sentAt?: string;
  respondedAt?: string;
  remark?: string;
}

export interface Recall {
  id: string;
  recallNo: string;
  batchId: string;
  batchNo: string;
  productName: string;
  reason: string;
  level: RecallLevel;
  scope: string;
  createdAt: string;
  initiator: string;
  status: RecallStatus;
  notifications: RecallNotification[];
}

export interface RecallStats {
  total: number;
  sent: number;
  received: number;
  offShelf: number;
  returned: number;
  urged: number;
  pending: number;
  completionRate: number;
}

export interface RecallFilterParams {
  keyword?: string;
  status?: RecallStatus;
  level?: RecallLevel;
  startDate?: string;
  endDate?: string;
}
