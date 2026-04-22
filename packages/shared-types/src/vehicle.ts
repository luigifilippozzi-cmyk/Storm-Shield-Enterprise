import { VehicleCondition } from './enums.js';

export interface Vehicle {
  id: string;
  tenant_id: string;
  customer_id: string;
  vin: string | null;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  color: string | null;
  mileage: number | null;
  condition: VehicleCondition | null;
  license_plate: string | null;
  license_state: string | null;
  insurance_company_id: string | null;
  claim_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface VehiclePhoto {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  storage_key: string;
  file_name: string;
  description: string | null;
  photo_type: string;
  taken_at: string | null;
  uploaded_by: string;
  created_at: string;
}
