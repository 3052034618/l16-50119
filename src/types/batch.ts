export interface RawMaterial {
  id: string;
  name: string;
  supplierId: string;
  supplierName: string;
  batchNo: string;
  quantity: number;
}

export interface InspectionItem {
  name: string;
  standard: string;
  result: string;
  status: 'pass' | 'fail';
}

export interface InspectionResult {
  items: InspectionItem[];
  overall: 'qualified' | 'unqualified';
  inspector: string;
  reportUrl?: string;
  inspectedAt: string;
}

export type BatchStatus =
  | 'pending'
  | 'qualified'
  | 'unqualified'
  | 'in_stock'
  | 'shipped'
  | 'recalling';

export interface Batch {
  id: string;
  batchNo: string;
  productName: string;
  productionDate: string;
  shelfLife: number;
  expiryDate: string;
  quantity: number;
  remainingQty: number;
  rawMaterials: RawMaterial[];
  inspection: InspectionResult;
  traceCode: string;
  status: BatchStatus;
  createdAt: string;
  remark?: string;
}

export interface FilterParams {
  keyword?: string;
  status?: BatchStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}
