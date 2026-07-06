export type Risk = "low" | "medium" | "high";
export type AlertSeverity = "low" | "medium" | "high";

export interface BusinessProfile {
  id: string;
  name: string;
  industry: string;
  timezone: string;
}

export interface BankAccount {
  id: string;
  institution_name: string;
  mask: string;
  account_type: string;
  current_balance: number;
  available_balance: number;
  currency: string;
  connected: boolean;
  last_synced_at: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  posted_at: string;
  merchant: string;
  description: string;
  category: string;
  amount: number;
  direction: "income" | "expense";
  source: string;
  pending: boolean;
}

export interface Invoice {
  id: string;
  customer: string;
  amount_due: number;
  due_at: string;
  status: string;
}

export interface SummaryMetric {
  label: string;
  value: number;
  delta: number | null;
  unit: string;
}

export interface DailyCashflow {
  date: string;
  income: number;
  expenses: number;
  net: number;
}

export interface CategorySpend {
  category: string;
  amount: number;
  share: number;
}

export interface ForecastPoint {
  date: string;
  projected_balance: number;
  projected_net: number;
  expected_income: number;
  expected_expenses: number;
}

export interface ForecastSummary {
  horizon_days: number;
  starting_balance: number;
  ending_balance: number;
  burn_rate_daily: number;
  runway_days: number | null;
  risk: Risk;
  shortage_date: string | null;
  confidence: number;
  points: ForecastPoint[];
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  created_at: string;
  action: string | null;
}

export interface DashboardResponse {
  business: BusinessProfile;
  accounts: BankAccount[];
  summary: SummaryMetric[];
  cashflow: DailyCashflow[];
  categories: CategorySpend[];
  forecast: ForecastSummary;
  alerts: Alert[];
  transactions: Transaction[];
  invoices: Invoice[];
}
