from datetime import date, datetime, time, timedelta, timezone
from itertools import count

from app.schemas import BankAccount, BusinessProfile, Invoice, Transaction, TransactionDirection


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _posted(days_ago: int) -> date:
    return date.today() - timedelta(days=days_ago)


def _direction(amount: float) -> TransactionDirection:
    return TransactionDirection.income if amount >= 0 else TransactionDirection.expense


def seed_business() -> BusinessProfile:
    return BusinessProfile(
        id="biz_demo",
        name="Northstar Studio Supply",
        industry="Specialty retail and light services",
    )


def seed_accounts() -> list[BankAccount]:
    synced = datetime.combine(date.today(), time(9, 15), tzinfo=timezone.utc)
    return [
        BankAccount(
            id="acct_operating",
            institution_name="Mercury",
            mask="4312",
            account_type="checking",
            current_balance=18340.52,
            available_balance=17615.52,
            last_synced_at=synced,
        ),
        BankAccount(
            id="acct_reserve",
            institution_name="Mercury",
            mask="9981",
            account_type="savings",
            current_balance=12200.0,
            available_balance=12200.0,
            last_synced_at=synced,
        ),
    ]


def seed_invoices() -> list[Invoice]:
    today = date.today()
    return [
        Invoice(id="inv_1007", customer="Luma Events", amount_due=4200, due_at=today + timedelta(days=5), status="sent"),
        Invoice(id="inv_1008", customer="Arcade Coffee", amount_due=2950, due_at=today + timedelta(days=11), status="sent"),
        Invoice(id="inv_1003", customer="Field Kit Co.", amount_due=1800, due_at=today - timedelta(days=4), status="overdue"),
    ]


def seed_transactions() -> list[Transaction]:
    rows: list[tuple[int, str, str, str, float]] = [
        (1, "Stripe", "Online sales payout", "Sales", 3180.44),
        (2, "Adobe", "Creative Cloud", "Software", -84.99),
        (3, "Figma", "Design platform", "Software", -144.00),
        (4, "USPS", "Shipment labels", "Shipping", -218.31),
        (5, "Staples", "Packaging supplies", "Supplies", -442.19),
        (6, "Stripe", "Online sales payout", "Sales", 2875.80),
        (7, "Gusto", "Payroll", "Payroll", -6120.00),
        (8, "AWS", "Cloud hosting", "Infrastructure", -718.12),
        (9, "Google Ads", "Search campaign", "Marketing", -1340.50),
        (10, "Square", "Retail terminal batch", "Sales", 2140.67),
        (12, "The Loading Dock", "Inventory restock", "Inventory", -3875.25),
        (14, "Stripe", "Online sales payout", "Sales", 3315.42),
        (15, "Notion", "Workspace subscription", "Software", -96.00),
        (17, "Mercury", "Account analysis fee", "Banking", -35.00),
        (18, "Luma Events", "Invoice payment INV-1004", "Receivables", 5200.00),
        (20, "FedEx", "Freight", "Shipping", -520.80),
        (21, "Gusto", "Payroll", "Payroll", -6120.00),
        (23, "Shopify", "Subscription", "Software", -105.00),
        (24, "Meta Ads", "Retargeting campaign", "Marketing", -960.10),
        (26, "Square", "Retail terminal batch", "Sales", 2295.34),
        (29, "Rent ACH", "Studio lease", "Rent", -4200.00),
        (31, "Stripe", "Online sales payout", "Sales", 3020.11),
        (33, "USPS", "Shipment labels", "Shipping", -196.42),
        (35, "Gusto", "Payroll", "Payroll", -6120.00),
        (36, "Field Kit Co.", "Invoice payment INV-1002", "Receivables", 1800.00),
        (38, "The Loading Dock", "Inventory restock", "Inventory", -2500.00),
        (40, "Stripe", "Online sales payout", "Sales", 3460.90),
        (42, "Google Ads", "Search campaign", "Marketing", -1255.00),
        (44, "Square", "Retail terminal batch", "Sales", 1985.75),
        (46, "Adobe", "Creative Cloud", "Software", -84.99),
        (49, "Gusto", "Payroll", "Payroll", -6120.00),
        (51, "AWS", "Cloud hosting", "Infrastructure", -692.40),
        (53, "Stripe", "Online sales payout", "Sales", 2880.18),
        (56, "Rent ACH", "Studio lease", "Rent", -4200.00),
        (58, "Square", "Retail terminal batch", "Sales", 2410.22),
    ]

    ids = count(1000)
    return [
        Transaction(
            id=f"txn_{next(ids)}",
            account_id="acct_operating",
            posted_at=_posted(days_ago),
            merchant=merchant,
            description=description,
            category=category,
            amount=amount,
            direction=_direction(amount),
        )
        for days_ago, merchant, description, category, amount in rows
    ]
