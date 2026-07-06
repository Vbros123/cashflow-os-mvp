from datetime import date, datetime, timezone
from itertools import count

from app.categorizer import normalize_categories
from app.forecasting import build_alerts, build_cashflow, build_categories, build_forecast, build_summary
from app.schemas import (
    BankAccount,
    DashboardResponse,
    ExchangePublicTokenResponse,
    LinkTokenResponse,
    SyncResponse,
    Transaction,
    TransactionDirection,
)
from app.seed import seed_accounts, seed_business, seed_invoices, seed_transactions
from app.settings import Settings


class DemoRepository:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.business = seed_business()
        self.accounts = seed_accounts()
        self.invoices = seed_invoices()
        self.transactions = normalize_categories(seed_transactions())
        self._sync_count = count(1)

    def dashboard(self) -> DashboardResponse:
        transactions = sorted(self.transactions, key=lambda transaction: transaction.posted_at, reverse=True)
        forecast = build_forecast(
            self.accounts,
            transactions,
            horizon_days=30,
            low_balance_threshold=self.settings.low_balance_threshold,
        )
        return DashboardResponse(
            business=self.business,
            accounts=self.accounts,
            summary=build_summary(self.accounts, transactions, forecast),
            cashflow=build_cashflow(transactions),
            categories=build_categories(transactions),
            forecast=forecast,
            alerts=build_alerts(
                self.accounts,
                transactions,
                self.invoices,
                forecast,
                low_balance_threshold=self.settings.low_balance_threshold,
            ),
            transactions=transactions[:50],
            invoices=self.invoices,
        )

    def list_transactions(self, limit: int = 100) -> list[Transaction]:
        return sorted(self.transactions, key=lambda transaction: transaction.posted_at, reverse=True)[:limit]

    def list_accounts(self) -> list[BankAccount]:
        return self.accounts

    def create_link_token(self) -> LinkTokenResponse:
        provider = "plaid_sandbox" if self.settings.plaid_client_id and self.settings.plaid_secret else "mock_plaid"
        return LinkTokenResponse(
            provider=provider,
            link_token=f"{provider}_link_token_demo",
            expiration=datetime.now(timezone.utc).replace(microsecond=0),
        )

    def exchange_public_token(self, public_token: str) -> ExchangePublicTokenResponse:
        for account in self.accounts:
            account.connected = True
            account.last_synced_at = datetime.now(timezone.utc)
        return ExchangePublicTokenResponse(
            item_id=f"item_{abs(hash(public_token)) % 100000}",
            institution_name=self.accounts[0].institution_name,
            status="connected",
        )

    def sync(self) -> SyncResponse:
        sequence = next(self._sync_count)
        amount = -325.75 if sequence % 2 else 1840.25
        merchant = "USPS" if amount < 0 else "Stripe"
        category = "Shipping" if amount < 0 else "Sales"
        direction = TransactionDirection.expense if amount < 0 else TransactionDirection.income
        transaction = Transaction(
            id=f"txn_live_{sequence}",
            account_id="acct_operating",
            posted_at=date.today(),
            merchant=merchant,
            description="New synced sandbox transaction",
            category=category,
            amount=amount,
            direction=direction,
        )
        self.transactions = normalize_categories([transaction]) + self.transactions

        for account in self.accounts:
            if account.id == "acct_operating":
                account.current_balance = round(account.current_balance + amount, 2)
                account.available_balance = round(account.available_balance + amount, 2)
            account.last_synced_at = datetime.now(timezone.utc)

        return SyncResponse(
            synced_at=datetime.now(timezone.utc),
            imported_transactions=1,
            account_count=len(self.accounts),
            status="ok",
        )
