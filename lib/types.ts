// Enums matching database
export type UserRole = 'ADMIN' | 'COMMITTEE' | 'MEMBER'
export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type UnitType = 'FLAT' | 'SHOP'
export type ResidentType = 'OWNER' | 'TENANT' | 'FAMILY'
export type TransactionType = 'INCOME' | 'EXPENSE'
export type VehicleType = 'TWO_WHEELER' | 'FOUR_WHEELER'
export type PaymentMode = 'CASH' | 'UPI' | 'BANK'

// Database models
export interface Unit {
  id: string
  unit_number: string
  wing?: string
  floor?: number
  type: UnitType
  created_by?: string
  created_at: string
}

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  password_hash: string
  role: UserRole
  status: UserStatus
  unit_id: string
  resident_type: ResidentType
  created_at: string
}

export interface Transaction {
  id: string
  type: TransactionType
  title: string
  amount: number
  group_id?: string
  unit_id?: string
  payment_mode?: PaymentMode
  transaction_date: string
  created_by?: string
  created_at: string
}

export interface ExpenseGroup {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface Vehicle {
  id: string
  user_id: string
  unit_id?: string
  type: VehicleType
  sticker_number: string
  created_at: string
}

export interface Notice {
  id: string
  title: string
  description?: string
  created_by?: string
  created_at: string
}

export interface CommitteeMember {
  id: string
  user_id: string
  designation?: string
  created_at: string
}

// Auth related
export interface AuthPayload {
  id: string
  email: string
  name: string
  role: UserRole
  status: UserStatus
}

export interface AuthResponse {
  token: string
  user: Omit<User, 'password_hash'>
}

// API responses
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
