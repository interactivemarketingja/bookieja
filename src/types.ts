export interface DataRecord {
  id: string;
  date: string;
  region: 'North' | 'South' | 'East' | 'West';
  category: 'Enterprise' | 'SME' | 'Consumer';
  revenue: number;
  cost: number;
  profit: number;
  customers: number;
  status: 'Completed' | 'Pending' | 'Flagged';
}

export interface DashboardStats {
  totalRevenue: number;
  totalProfit: number;
  totalCustomers: number;
  avgMargin: number;
  revenueGrowth: number;
  profitGrowth: number;
}

export interface Invoice {
  id: string;
  client_name: string;
  amount: number;
  tax_rate?: number;
  tax_amount?: number;
  date: string;
  due_date: string;
  status: 'Paid' | 'Unpaid' | 'Overdue';
  description?: string;
  line_items?: LineItem[];
  payment_history?: Payment[];
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  tax_amount?: number;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string;
  note?: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  due_date?: string;
  description?: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  is_recurring?: boolean;
  frequency?: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  duration_months?: number;
  end_date?: string;
  recurring_id?: string;
}

export interface Budget {
  id: string;
  category: string;
  limit_amount: number;
  period: 'Monthly' | 'Quarterly' | 'Yearly';
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  notes?: string;
  created_at: string;
}

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  description?: string;
  notes?: string;
  balance: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  status: 'Draft' | 'Posted';
  lines: JournalLine[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  date: string;
  isRead: boolean;
  link?: string;
}

export interface JournalLine {
  id: string;
  account_id: string;
  debit: number;
  credit: number;
  description?: string;
}
