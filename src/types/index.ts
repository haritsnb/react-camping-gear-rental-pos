// 1. Format Standar Response API
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

// 2. Auth & User
export interface User {
  id: number;
  role_id: number;
  role_name?: string;
  name: string;
  username: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  modified_at: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
}

// 3. Pelanggan (Customer & KYC)
export interface Customer {
  id: number;
  name: string;
  identity_type: 'KTP' | 'SIM' | 'Paspor';
  identity_number: string;
  identity_photo_url?: string;
  phone: string;
  emergency_contact?: string;
  email?: string;
  address: string;
  is_blacklisted: boolean;
  notes?: string;
  created_at: string;
  modified_at: string;
}

// 4. Katalog Produk & Unit Fisik
export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Brand {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface Product {
  id: number;
  category_id: number;
  category_name?: string;
  brand_id: number;
  brand_name?: string;
  name: string;
  rental_price_per_day: number;
  default_deposit: number;
  late_fee_per_day: number;
  lost_compensation_fee: number;
  is_active: boolean;
  total_units: number;
  available_units: number;
  rented_units: number;
  maintenance_units: number;
}

export interface ProductUnit {
  id: number;
  product_id: number;
  product_name?: string;
  unit_code: string;
  serial_number?: string;
  condition: 'good' | 'damaged' | 'lost';
  status: 'available' | 'booked' | 'rented' | 'maintenance' | 'lost';
  notes?: string;
}

// 5. Transaksi Sewa (Rentals)
export interface RentalItem {
  id: number;
  rental_id: number;
  product_unit_id: number;
  unit_code?: string;
  product_name?: string;
  daily_rate: number;
  duration_days: number;
  subtotal: number;
  condition_out: string;
  condition_in?: string;
  item_penalty_fee: number;
  return_notes?: string;
}

export interface Rental {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer_name?: string;
  user_id: number;
  user_name?: string;
  booking_date: string;
  start_date: string;
  expected_return_date: string;
  actual_return_date?: string;
  total_rental_fee: number;
  total_deposit: number;
  total_penalty_fee: number;
  grand_total: number;
  status: 'booked' | 'active' | 'returned' | 'completed' | 'cancelled';
  items?: RentalItem[];
}

// 6. Pembayaran & Servis
export interface Payment {
  id: number;
  rental_id: number;
  user_id: number;
  payment_type: 'down_payment' | 'full_payment' | 'deposit_in' | 'deposit_refund' | 'penalty_charge';
  payment_method: string;
  amount: number;
  reference_number?: string;
  notes?: string;
  paid_at: string;
}

export interface Maintenance {
  id: number;
  product_unit_id: number;
  unit_code?: string;
  issue_description: string;
  cost: number;
  start_date: string;
  completed_date?: string;
  status: 'in_progress' | 'completed';
}

// 7. Laporan Finansial & Bisnis
export interface RevenueReport {
  start_date: string;
  end_date: string;
  total_rental_revenue: number;
  total_penalty_revenue: number;
  total_gross_revenue: number;
  total_maintenance_cost: number;
  total_net_profit: number;
  total_transactions: number;
}

export interface RentalSummaryReport {
  start_date: string;
  end_date: string;
  total_booked: number;
  total_active: number;
  total_returned: number;
  total_completed: number;
  total_cancelled: number;
  total_transaction: number;
}

export interface TopProductReport {
  product_id: number;
  product_name: string;
  category_name: string;
  brand_name: string;
  total_rented: number;
  total_revenue: number;
}

export interface InventoryReport {
  total_assets_value: number;
  total_units: number;
  available_units: number;
  booked_units: number;
  rented_units: number;
  maintenance_units: number;
  lost_units: number;
}