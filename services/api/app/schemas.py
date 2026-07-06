from datetime import date, datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class TransactionDirection(StrEnum):
    income = "income"
    expense = "expense"


class AlertSeverity(StrEnum):
    low = "low"
    medium = "medium"
    high = "high"


class LiquidityRisk(StrEnum):
    low = "low"
    medium = "medium"
    high = "high"


class BusinessProfile(BaseModel):
    id: str
    name: str
    industry: str
    timezone: str = "America/New_York"


class BankAccount(BaseModel):
    id: str
    institution_name: str
    mask: str
    account_type: str
    current_balance: float
    available_balance: float
    currency: str = "USD"
    connected: bool = True
    last_synced_at: datetime


class Transaction(BaseModel):
    id: str
    account_id: str
    posted_at: date
    merchant: str
    description: str
    category: str
    amount: float = Field(description="Signed amount. Income is positive; expenses are negative.")
    direction: TransactionDirection
    source: str = "plaid_mock"
    pending: bool = False


class Invoice(BaseModel):
    id: str
    customer: str
    amount_due: float
    due_at: date
    status: str


class SummaryMetric(BaseModel):
    label: str
    value: float
    delta: float | None = None
    unit: str = "currency"


class DailyCashflow(BaseModel):
    date: date
    income: float
    expenses: float
    net: float


class CategorySpend(BaseModel):
    category: str
    amount: float
    share: float


class ForecastPoint(BaseModel):
    date: date
    projected_balance: float
    projected_net: float
    expected_income: float
    expected_expenses: float


class ForecastSummary(BaseModel):
    horizon_days: int
    starting_balance: float
    ending_balance: float
    burn_rate_daily: float
    runway_days: int | None
    risk: LiquidityRisk
    shortage_date: date | None
    confidence: float
    points: list[ForecastPoint]


class Alert(BaseModel):
    id: str
    severity: AlertSeverity
    title: str
    detail: str
    created_at: datetime
    action: str | None = None


class DashboardResponse(BaseModel):
    business: BusinessProfile
    accounts: list[BankAccount]
    summary: list[SummaryMetric]
    cashflow: list[DailyCashflow]
    categories: list[CategorySpend]
    forecast: ForecastSummary
    alerts: list[Alert]
    transactions: list[Transaction]
    invoices: list[Invoice]


class LinkTokenResponse(BaseModel):
    provider: str
    link_token: str
    expiration: datetime


class ExchangePublicTokenRequest(BaseModel):
    public_token: str


class ExchangePublicTokenResponse(BaseModel):
    item_id: str
    institution_name: str
    status: str


class SyncResponse(BaseModel):
    synced_at: datetime
    imported_transactions: int
    account_count: int
    status: str
