export type RecallLevel = 'level1' | 'level2' | 'level3';
export type RecallStatus = 'pending' | 'notifying' | 'in_progress' | 'completed';
export type RecallNotificationStatus =
  | 'pending'
  | 'sent'
  | 'received'
  | 'off_shelf'
  | 'returned'
  | 'urged';

export type RecallTimelineEventType =
  | 'created'
  | 'notification_sent'
  | 'urged'
  | 'notification_received'
  | 'off_shelf'
  | 'returned'
  | 'status_changed';

export interface RecallTimelineEvent {
  id: string;
  type: RecallTimelineEventType;
  title: string;
  description?: string;
  time: string;
  operator?: string;
  relatedId?: string;
}

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
  urgedAt?: string;
  urgeCount?: number;
  lastUrgedAt?: string;
  disposalRemark?: string;
  returnedQty?: number;
  voucherNo?: string;
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
  timeline: RecallTimelineEvent[];
}

export interface RecallStats {
  total: number;
  sent: number;
  received: number;
  offShelf: number;
  returned: number;
  urged: number;
  pending: number;
  unresponsive: number;
  completionRate: number;
  totalUrgeCount: number;
  overdueDays: number;
  riskScore: number;
}

export interface RecallFilterParams {
  keyword?: string;
  status?: RecallStatus;
  level?: RecallLevel;
  startDate?: string;
  endDate?: string;
  minCompletionRate?: number;
  maxCompletionRate?: number;
  hasUnresponsive?: boolean;
  highRiskOnly?: boolean;
  sortByRisk?: boolean;
}
