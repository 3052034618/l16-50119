export type ShipmentStatus = 'transit' | 'delivered';

export interface Shipment {
  id: string;
  batchId: string;
  batchNo: string;
  dealerId: string;
  dealerName: string;
  storeIds: string[];
  storeNames: string[];
  quantity: number;
  shipmentDate: string;
  trackingNo: string;
  status: ShipmentStatus;
  remark?: string;
}

export interface ShipmentFilterParams {
  keyword?: string;
  batchId?: string;
  dealerId?: string;
  status?: ShipmentStatus;
  startDate?: string;
  endDate?: string;
}
