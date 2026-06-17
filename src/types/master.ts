export interface Dealer {
  id: string;
  name: string;
  contact: string;
  phone: string;
  region: string;
  address: string;
  createdAt: string;
}

export interface Store {
  id: string;
  name: string;
  dealerId: string;
  dealerName: string;
  contact: string;
  phone: string;
  address: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  licenseNo: string;
  licenseExpiry: string;
  address: string;
}
