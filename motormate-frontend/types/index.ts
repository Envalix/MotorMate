export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Vehicle enums ────────────────────────────────────────────────────────────

export type FuelType = 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'OTHER';
export type Transmission = 'MANUAL' | 'AUTOMATIC' | 'CVT' | 'OTHER';
export type VehicleStatus = 'IN_STOCK' | 'RESERVED' | 'SOLD';
export type VehicleCondition = 'NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
export type VehicleType = 'CAR' | 'MOTORCYCLE' | 'TRUCK' | 'VAN' | 'SUV' | 'BUS' | 'OTHER';

// ─── Vehicle models ───────────────────────────────────────────────────────────

export interface VehicleImage {
  id: string;
  vehicleId: string;
  url: string;
  publicId: string;
  isPrimary: boolean;
  createdAt: string;
}

export type DocumentType =
  | 'BLUE_BOOK'
  | 'CMT'
  | 'REVENUE_LICENCE'
  | 'INSURANCE'
  | 'SIGNED_LETTER'
  | 'NIC'
  | 'OTHER';

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  name: string;
  url: string;
  publicId: string;
  docType: DocumentType;
  isLocked: boolean;
  expiryDate: string | null;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  vehicleType: VehicleType | null;
  make: string;
  model: string;
  year: number;
  vin: string | null;
  plateNumber: string | null;
  color: string | null;
  engineCC: number | null;
  mileage: number | null;
  fuelType: FuelType | null;
  transmission: Transmission | null;
  condition: VehicleCondition | null;
  status: VehicleStatus;
  purchasePrice: string; // Decimal serialized as string
  sellingPrice: string | null;
  notes: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  images?: VehicleImage[];
  documents?: VehicleDocument[];
}

// ─── Buy record + expenses ────────────────────────────────────────────────────

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'FINANCING' | 'OTHER';

export type ExpenseCategory =
  | 'TIRES'
  | 'PAINT'
  | 'ENGINE'
  | 'ELECTRICAL'
  | 'INTERIOR'
  | 'REGISTRATION'
  | 'TRANSPORT'
  | 'CLEANING'
  | 'OTHER';

export interface SellRecord {
  id: string;
  vehicleId: string;
  userId: string;
  buyerName: string | null;
  buyerNic: string | null;
  buyerContact: string | null;
  buyerAddress: string | null;
  sellingPrice: string; // Decimal serialized as string
  saleDate: string;
  paymentMethod: PaymentMethod | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BuyRecord {
  id: string;
  vehicleId: string;
  userId: string;
  sellerName: string | null;
  sellerNic: string | null;
  sellerContact: string | null;
  sellerAddress: string | null;
  purchasePrice: string; // Decimal serialized as string
  purchaseDate: string;
  paymentMethod: PaymentMethod | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  vehicleId: string;
  userId: string;
  category: ExpenseCategory;
  description: string;
  amount: string; // Decimal serialized as string
  date: string;
  vendor: string | null;
  receiptUrl: string | null;
  receiptPublicId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfitSummary {
  buyPrice: string | null;
  totalExpenses: string;
  sellPrice: string | null;
  netProfit: string | null;
  profitPercentage: number | null;
}

// ─── Vehicle inputs ───────────────────────────────────────────────────────────

export interface CreateVehicleInput {
  vehicleType?: VehicleType;
  make: string;
  model: string;
  year: number;
  vin?: string;
  plateNumber?: string;
  color?: string;
  engineCC?: number;
  mileage?: number;
  fuelType?: FuelType;
  transmission?: Transmission;
  condition?: VehicleCondition;
  purchasePrice: number;
  sellingPrice?: number;
  notes?: string;
}

export type UpdateVehicleInput = Partial<CreateVehicleInput> & {
  status?: VehicleStatus;
};
