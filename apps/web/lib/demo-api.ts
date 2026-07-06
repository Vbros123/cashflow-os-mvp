import type {
  Alert,
  BankAccount,
  CategorySpend,
  DailyCashflow,
  DashboardResponse,
  ForecastPoint,
  ForecastSummary,
  Invoice,
  SummaryMetric,
  Transaction
} from "./types";

const DAY = 24 * 60 * 60 * 1000;
const LOW_BALANCE_THRESHOLD = 5000;

let syncSequence = 0;
let syncedTransactions: Transaction[] = [];

function today() {
  return new Date();
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY);
}

function daysAgo(days: number) {
  return dateKey(addDays(today(), -days));
}

function transaction(id: string, days: number, merchant: string, description: string, category: string, amount: number): Transaction {
  return {
    id,
    account_id: "acct_operating",
    posted_at: daysAgo(days),
    merchant,
    description,
    category,
    amount,
    direction: amount >= 0 ? "income" : "expense",
    source: "plaid_mock",
    pending: false
  };
}

function baseAccounts(): BankAccount[] {
  const synced = `${dateKey(today())}T09:15:00.000Z`;
  const syncedImpact = syncedTransactions.reduce((sum, item) => sum + item.amount, 0);

  return [
    {
      id: "acct_operating",
      institution_name: "Mercury",
      mask: "4312",
      account_type: "checking",
      current_balance: Number((18340.52 + syncedImpact).toFixed(2)),
      available_balance: Number((17615.52 + syncedImpact).toFixed(2)),
      currency: "USD",
      connected: true,
      last_synced_at: synced
    },
    {
      id: "acct_reserve",
      institution_name: "Mercury",
      mask: "9981",
      account_type: "savings",
      current_balance: 12200,
      available_balance: 12200,
      currency: "USD",
      connected: true,
      last_synced_at: synced
    }
  ];
}

function baseInvoices(): Invoice[] {
  const now = today();
  return [
    { id: "inv_1007", customer: "Luma Events", amount_due: 4200, due_at: dateKey(addDays(now, 5)), status: "sent" },
    { id: "inv_1008", customer: "Arcade Coffee", amount_due: 2950, due_at: dateKey(addDays(now, 11)), status: "sent" },
    { id: "inv_1003", customer: "Field Kit Co.", amount_due: 1800, due_at: dateKey(addDays(now, -4)), status: "overdue" }
  ];
}

function baseTransactions(): Transaction[] {
  const rows: Array<[number, string, string, string, number]> = [
    [1, "Stripe", "Online sales payout", "Sales", 3180.44],
    [2, "Adobe", "Creative Cloud", "Software", -84.99],
    [3, "Figma", "Design platform", "Software", -144],
    [4, "USPS", "Shipment labels", "Shipping", -218.31],
    [5, "Staples", "Packaging supplies", "Supplies", -442.19],
    [6, "Stripe", "Online sales payout", "Sales", 2875.8],
    [7, "Gusto", "Payroll", "Payroll", -6120],
    [8, "AWS", "Cloud hosting", "Infrastructure", -718.12],
    [9, "Google Ads", "Search campaign", "Marketing", -1340.5],
    [10, "Square", "Retail terminal batch", "Sales", 2140.67],
    [12, "The Loading Dock", "Inventory restock", "Inventory", -3875.25],
    [14, "Stripe", "Online sales payout", "Sales", 3315.42],
    [15, "Notion", "Workspace subscription", "Software", -96],
    [17, "Mercury", "Account analysis fee", "Banking", -35],
    [18, "Luma Events", "Invoice payment INV-1004", "Receivables", 5200],
    [20, "FedEx", "Freight", "Shipping", -520.8],
    [21, "Gusto", "Payroll", "Payroll", -6120],
    [23, "Shopify", "Subscription", "Software", -105],
    [24, "Meta Ads", "Retargeting campaign", "Marketing", -960.1],
    [26, "Square", "Retail terminal batch", "Sales", 2295.34],
    [29, "Rent ACH", "Studio lease", "Rent", -4200],
    [31, "Stripe", "Online sales payout", "Sales", 3020.11],
    [33, "USPS", "Shipment labels", "Shipping", -196.42],
    [35, "Gusto", "Payroll", "Payroll", -6120],
    [36, "Field Kit Co.", "Invoice payment INV-1002", "Receivables", 1800],
    [38, "The Loading Dock", "Inventory restock", "Inventory", -2500],
    [40, "Stripe", "Online sales payout", "Sales", 3460.9],
    [42, "Google Ads", "Search campaign", "Marketing", -1255],
    [44, "Square", "Retail terminal batch", "Sales", 1985.75],
    [46, "Adobe", "Creative Cloud", "Software", -84.99],
    [49, "Gusto", "Payroll", "Payroll", -6120],
    [51, "AWS", "Cloud hosting", "Infrastructure", -692.4],
    [53, "Stripe", "Online sales payout", "Sales", 2880.18],
    [56, "Rent ACH", "Studio lease", "Rent", -4200],
    [58, "Square", "Retail terminal batch", "Sales", 2410.22]
  ];

  return rows.map((row, index) => transaction(`txn_${1000 + index}`, ...row));
}

function allTransactions() {
  return [...syncedTransactions, ...baseTransactions()].sort((a, b) => b.posted_at.localeCompare(a.posted_at));
}

function buildCashflow(transactions: Transaction[]): DailyCashflow[] {
  const start = addDays(today(), -29);
  return Array.from({ length: 30 }).map((_, index) => {
    const date = dateKey(addDays(start, index));
    const rows = transactions.filter((item) => item.posted_at === date);
    const income = rows.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0);
    const expenses = Math.abs(rows.filter((item) => item.amount < 0).reduce((sum, item) => sum + item.amount, 0));
    return { date, income: Number(income.toFixed(2)), expenses: Number(expenses.toFixed(2)), net: Number((income - expenses).toFixed(2)) };
  });
}

function buildCategories(transactions: Transaction[]): CategorySpend[] {
  const cutoff = addDays(today(), -30).getTime();
  const totals = new Map<string, number>();

  transactions
    .filter((item) => new Date(`${item.posted_at}T12:00:00Z`).getTime() >= cutoff && item.amount < 0)
    .forEach((item) => totals.set(item.category, (totals.get(item.category) ?? 0) + Math.abs(item.amount)));

  const total = Array.from(totals.values()).reduce((sum, value) => sum + value, 0) || 1;
  return Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({
      category,
      amount: Number(amount.toFixed(2)),
      share: Number((amount / total).toFixed(4))
    }));
}

function recurringEvents(transactions: Transaction[], horizonDays: number) {
  const groups = new Map<string, Transaction[]>();
  transactions.forEach((item) => {
    const key = `${item.merchant}:${item.category}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });

  const events = new Map<string, number[]>();
  const now = today();
  const horizonEnd = addDays(now, horizonDays);

  groups.forEach((group) => {
    if (group.length < 2) return;
    const ordered = [...group].sort((a, b) => a.posted_at.localeCompare(b.posted_at));
    const gaps = ordered.slice(1).map((item, index) => {
      const prev = new Date(`${ordered[index].posted_at}T12:00:00Z`).getTime();
      const next = new Date(`${item.posted_at}T12:00:00Z`).getTime();
      return Math.round((next - prev) / DAY);
    });
    const interval = gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)] ?? 0;
    if (interval < 6 || interval > 40) return;

    const lastDate = new Date(`${ordered[ordered.length - 1].posted_at}T12:00:00Z`);
    const amount = ordered.slice(-3).reduce((sum, item) => sum + item.amount, 0) / Math.min(3, ordered.length);
    let nextDate = addDays(lastDate, interval);

    while (nextDate > now && nextDate <= horizonEnd) {
      const key = dateKey(nextDate);
      events.set(key, [...(events.get(key) ?? []), amount]);
      nextDate = addDays(nextDate, interval);
    }
  });

  return events;
}

function buildForecast(accounts: BankAccount[], transactions: Transaction[]): ForecastSummary {
  const horizonDays = 30;
  const cashflow = buildCashflow(transactions);
  const income30 = cashflow.reduce((sum, item) => sum + item.income, 0);
  const expenses30 = cashflow.reduce((sum, item) => sum + item.expenses, 0);
  const baseDailyIncome = income30 / 30;
  const baseDailyExpenses = expenses30 / 30;
  const burnRateDaily = Math.max((expenses30 - income30) / 30, 0);
  const events = recurringEvents(transactions, horizonDays);
  const startingBalance = Number(accounts.reduce((sum, account) => sum + account.current_balance, 0).toFixed(2));

  let balance = startingBalance;
  let shortageDate: string | null = null;
  const points: ForecastPoint[] = Array.from({ length: horizonDays }).map((_, index) => {
    const date = dateKey(addDays(today(), index + 1));
    const recurring = events.get(date) ?? [];
    const expectedIncome = baseDailyIncome + recurring.filter((amount) => amount > 0).reduce((sum, amount) => sum + amount, 0);
    const expectedExpenses = baseDailyExpenses + Math.abs(recurring.filter((amount) => amount < 0).reduce((sum, amount) => sum + amount, 0));
    const projectedNet = expectedIncome - expectedExpenses;

    balance += projectedNet;
    if (balance < LOW_BALANCE_THRESHOLD && !shortageDate) shortageDate = date;

    return {
      date,
      projected_balance: Number(balance.toFixed(2)),
      projected_net: Number(projectedNet.toFixed(2)),
      expected_income: Number(expectedIncome.toFixed(2)),
      expected_expenses: Number(expectedExpenses.toFixed(2))
    };
  });

  const runwayDays = burnRateDaily > 0 ? Math.floor((startingBalance - LOW_BALANCE_THRESHOLD) / burnRateDaily) : null;
  const risk = shortageDate ? "medium" : income30 - expenses30 < 0 ? "medium" : "low";

  return {
    horizon_days: horizonDays,
    starting_balance: startingBalance,
    ending_balance: points[points.length - 1].projected_balance,
    burn_rate_daily: Number(burnRateDaily.toFixed(2)),
    runway_days: runwayDays,
    risk,
    shortage_date: shortageDate,
    confidence: 0.72,
    points
  };
}

function buildSummary(accounts: BankAccount[], cashflow: DailyCashflow[], forecast: ForecastSummary): SummaryMetric[] {
  const income = cashflow.reduce((sum, item) => sum + item.income, 0);
  const expenses = cashflow.reduce((sum, item) => sum + item.expenses, 0);
  const net = income - expenses;
  const available = accounts.reduce((sum, account) => sum + account.available_balance, 0);

  return [
    { label: "Available cash", value: Number(available.toFixed(2)), delta: Number(net.toFixed(2)), unit: "currency" },
    { label: "30-day income", value: Number(income.toFixed(2)), delta: null, unit: "currency" },
    { label: "30-day expenses", value: Number(expenses.toFixed(2)), delta: null, unit: "currency" },
    {
      label: "Projected 30-day cash",
      value: forecast.ending_balance,
      delta: Number((forecast.ending_balance - forecast.starting_balance).toFixed(2)),
      unit: "currency"
    }
  ];
}

function buildAlerts(invoices: Invoice[], forecast: ForecastSummary): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();

  if (forecast.shortage_date) {
    alerts.push({
      id: "alert_forecast_shortage",
      severity: forecast.risk === "high" ? "high" : "medium",
      title: "Projected liquidity pressure",
      detail: `Forecast dips below $${LOW_BALANCE_THRESHOLD.toLocaleString()} on ${forecast.shortage_date}.`,
      created_at: now,
      action: "Pull receivables forward"
    });
  }

  const overdue = invoices.filter((invoice) => invoice.status === "overdue");
  if (overdue.length) {
    const total = overdue.reduce((sum, invoice) => sum + invoice.amount_due, 0);
    alerts.push({
      id: "alert_overdue_invoices",
      severity: "medium",
      title: "Receivables need attention",
      detail: `$${total.toLocaleString()} is overdue across ${overdue.length} invoice(s).`,
      created_at: now,
      action: "Send reminders"
    });
  }

  return alerts.length
    ? alerts
    : [
        {
          id: "alert_healthy",
          severity: "low",
          title: "No urgent liquidity alerts",
          detail: "Cash position is above the operating floor for the forecast horizon.",
          created_at: now,
          action: null
        }
      ];
}

export function getDashboard(): DashboardResponse {
  const transactions = allTransactions();
  const accounts = baseAccounts();
  const invoices = baseInvoices();
  const cashflow = buildCashflow(transactions);
  const forecast = buildForecast(accounts, transactions);

  return {
    business: {
      id: "biz_demo",
      name: "Northstar Studio Supply",
      industry: "Specialty retail and light services",
      timezone: "America/New_York"
    },
    accounts,
    summary: buildSummary(accounts, cashflow, forecast),
    cashflow,
    categories: buildCategories(transactions),
    forecast,
    alerts: buildAlerts(invoices, forecast),
    transactions: transactions.slice(0, 50),
    invoices
  };
}

export function syncDemo() {
  syncSequence += 1;
  const amount = syncSequence % 2 ? -325.75 : 1840.25;
  syncedTransactions = [
    {
      id: `txn_live_${syncSequence}`,
      account_id: "acct_operating",
      posted_at: dateKey(today()),
      merchant: amount < 0 ? "USPS" : "Stripe",
      description: "New synced sandbox transaction",
      category: amount < 0 ? "Shipping" : "Sales",
      amount,
      direction: amount < 0 ? "expense" : "income",
      source: "plaid_mock",
      pending: false
    },
    ...syncedTransactions
  ];

  return {
    synced_at: new Date().toISOString(),
    imported_transactions: 1,
    account_count: 2,
    status: "ok"
  };
}
