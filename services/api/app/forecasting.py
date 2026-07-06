from datetime import date, datetime, timedelta, timezone
from statistics import median

import pandas as pd

from app.schemas import (
    Alert,
    AlertSeverity,
    BankAccount,
    CategorySpend,
    DailyCashflow,
    ForecastPoint,
    ForecastSummary,
    Invoice,
    LiquidityRisk,
    SummaryMetric,
    Transaction,
)


def _transaction_frame(transactions: list[Transaction]) -> pd.DataFrame:
    if not transactions:
        return pd.DataFrame(columns=["posted_at", "merchant", "category", "amount", "income", "expenses", "net"])

    frame = pd.DataFrame([transaction.model_dump() for transaction in transactions])
    frame["posted_at"] = pd.to_datetime(frame["posted_at"])
    frame["income"] = frame["amount"].clip(lower=0)
    frame["expenses"] = frame["amount"].clip(upper=0).abs()
    frame["net"] = frame["amount"]
    return frame.sort_values("posted_at")


def build_cashflow(transactions: list[Transaction], days: int = 30) -> list[DailyCashflow]:
    frame = _transaction_frame(transactions)
    today = pd.Timestamp(date.today())
    start = today - pd.Timedelta(days=days - 1)
    index = pd.date_range(start=start, end=today, freq="D")

    if frame.empty:
        daily = pd.DataFrame(index=index, data={"income": 0.0, "expenses": 0.0, "net": 0.0})
    else:
        recent = frame[frame["posted_at"].between(start, today)]
        daily = recent.groupby("posted_at")[["income", "expenses", "net"]].sum().reindex(index, fill_value=0.0)

    return [
        DailyCashflow(date=idx.date(), income=round(row.income, 2), expenses=round(row.expenses, 2), net=round(row.net, 2))
        for idx, row in daily.iterrows()
    ]


def build_categories(transactions: list[Transaction], days: int = 30) -> list[CategorySpend]:
    frame = _transaction_frame(transactions)
    if frame.empty:
        return []

    cutoff = pd.Timestamp(date.today() - timedelta(days=days))
    expenses = frame[(frame["posted_at"] >= cutoff) & (frame["amount"] < 0)]
    grouped = expenses.groupby("category")["expenses"].sum().sort_values(ascending=False)
    total = float(grouped.sum()) or 1.0
    return [
        CategorySpend(category=category, amount=round(float(amount), 2), share=round(float(amount) / total, 4))
        for category, amount in grouped.items()
    ]


def _recurring_events(frame: pd.DataFrame, horizon_days: int) -> dict[date, list[float]]:
    events: dict[date, list[float]] = {}
    if frame.empty:
        return events

    grouped = frame.groupby(["merchant", "category"])
    today = date.today()
    horizon_end = today + timedelta(days=horizon_days)

    for _, group in grouped:
        if len(group) < 2:
            continue
        ordered = group.sort_values("posted_at")
        gaps = ordered["posted_at"].diff().dropna().dt.days.tolist()
        likely_interval = int(median(gaps)) if gaps else 0
        if likely_interval < 6 or likely_interval > 40:
            continue

        last_posted = ordered.iloc[-1]["posted_at"].date()
        amount = float(ordered.tail(3)["amount"].mean())
        next_date = last_posted + timedelta(days=likely_interval)
        while today < next_date <= horizon_end:
            events.setdefault(next_date, []).append(amount)
            next_date = next_date + timedelta(days=likely_interval)

    return events


def build_forecast(
    accounts: list[BankAccount],
    transactions: list[Transaction],
    horizon_days: int = 30,
    low_balance_threshold: float = 5000.0,
) -> ForecastSummary:
    frame = _transaction_frame(transactions)
    today = date.today()
    starting_balance = round(sum(account.current_balance for account in accounts), 2)
    cutoff = pd.Timestamp(today - timedelta(days=30))
    recent = frame[frame["posted_at"] >= cutoff] if not frame.empty else frame

    income_30 = float(recent["income"].sum()) if not recent.empty else 0.0
    expenses_30 = float(recent["expenses"].sum()) if not recent.empty else 0.0
    net_30 = income_30 - expenses_30
    base_daily_income = income_30 / 30
    base_daily_expenses = expenses_30 / 30
    burn_rate_daily = max((expenses_30 - income_30) / 30, 0.0)
    recurring = _recurring_events(frame, horizon_days)

    balance = starting_balance
    points: list[ForecastPoint] = []
    shortage_date: date | None = None

    for day in range(1, horizon_days + 1):
        forecast_date = today + timedelta(days=day)
        expected_income = base_daily_income
        expected_expenses = base_daily_expenses
        for amount in recurring.get(forecast_date, []):
            if amount >= 0:
                expected_income += amount
            else:
                expected_expenses += abs(amount)

        projected_net = expected_income - expected_expenses
        balance += projected_net
        if balance < low_balance_threshold and shortage_date is None:
            shortage_date = forecast_date

        points.append(
            ForecastPoint(
                date=forecast_date,
                projected_balance=round(balance, 2),
                projected_net=round(projected_net, 2),
                expected_income=round(expected_income, 2),
                expected_expenses=round(expected_expenses, 2),
            )
        )

    runway_days = int((starting_balance - low_balance_threshold) / burn_rate_daily) if burn_rate_daily > 0 else None
    days_until_shortage = (shortage_date - today).days if shortage_date else None
    if days_until_shortage is not None and days_until_shortage <= 14:
        risk = LiquidityRisk.high
    elif days_until_shortage is not None and days_until_shortage <= horizon_days:
        risk = LiquidityRisk.medium
    elif net_30 < 0:
        risk = LiquidityRisk.medium
    else:
        risk = LiquidityRisk.low

    return ForecastSummary(
        horizon_days=horizon_days,
        starting_balance=starting_balance,
        ending_balance=points[-1].projected_balance if points else starting_balance,
        burn_rate_daily=round(burn_rate_daily, 2),
        runway_days=runway_days,
        risk=risk,
        shortage_date=shortage_date,
        confidence=0.72,
        points=points,
    )


def build_summary(accounts: list[BankAccount], transactions: list[Transaction], forecast: ForecastSummary) -> list[SummaryMetric]:
    cashflow = build_cashflow(transactions, days=30)
    income = sum(day.income for day in cashflow)
    expenses = sum(day.expenses for day in cashflow)
    net = income - expenses
    available = sum(account.available_balance for account in accounts)
    return [
        SummaryMetric(label="Available cash", value=round(available, 2), delta=round(net, 2)),
        SummaryMetric(label="30-day income", value=round(income, 2), delta=None),
        SummaryMetric(label="30-day expenses", value=round(expenses, 2), delta=None),
        SummaryMetric(label="Projected 30-day cash", value=forecast.ending_balance, delta=round(forecast.ending_balance - forecast.starting_balance, 2)),
    ]


def build_alerts(
    accounts: list[BankAccount],
    transactions: list[Transaction],
    invoices: list[Invoice],
    forecast: ForecastSummary,
    low_balance_threshold: float = 5000.0,
) -> list[Alert]:
    now = datetime.now(timezone.utc)
    alerts: list[Alert] = []
    available_cash = sum(account.available_balance for account in accounts)

    if available_cash < low_balance_threshold:
        alerts.append(
            Alert(
                id="alert_low_cash_now",
                severity=AlertSeverity.high,
                title="Cash below operating floor",
                detail=f"Available cash is ${available_cash:,.0f}, below the ${low_balance_threshold:,.0f} floor.",
                created_at=now,
                action="Delay discretionary spend",
            )
        )

    if forecast.shortage_date:
        severity = AlertSeverity.high if forecast.risk == LiquidityRisk.high else AlertSeverity.medium
        alerts.append(
            Alert(
                id="alert_forecast_shortage",
                severity=severity,
                title="Projected liquidity pressure",
                detail=f"Forecast dips below ${low_balance_threshold:,.0f} on {forecast.shortage_date.isoformat()}.",
                created_at=now,
                action="Pull receivables forward",
            )
        )

    frame = _transaction_frame(transactions)
    if not frame.empty:
        today = pd.Timestamp(date.today())
        last_7 = frame[(frame["posted_at"] >= today - pd.Timedelta(days=7)) & (frame["amount"] < 0)]["expenses"].sum()
        prev_30 = frame[
            (frame["posted_at"] < today - pd.Timedelta(days=7))
            & (frame["posted_at"] >= today - pd.Timedelta(days=37))
            & (frame["amount"] < 0)
        ]["expenses"].sum()
        baseline_7 = float(prev_30) / 30 * 7 if prev_30 else 0.0
        if baseline_7 and float(last_7) > baseline_7 * 1.35:
            alerts.append(
                Alert(
                    id="alert_spend_spike",
                    severity=AlertSeverity.medium,
                    title="Spending spike detected",
                    detail=f"Last 7-day expenses are ${float(last_7):,.0f}, above the recent baseline of ${baseline_7:,.0f}.",
                    created_at=now,
                    action="Review payroll, inventory, and marketing",
                )
            )

    overdue = [invoice for invoice in invoices if invoice.status == "overdue"]
    if overdue:
        total_overdue = sum(invoice.amount_due for invoice in overdue)
        alerts.append(
            Alert(
                id="alert_overdue_invoices",
                severity=AlertSeverity.medium,
                title="Receivables need attention",
                detail=f"${total_overdue:,.0f} is overdue across {len(overdue)} invoice(s).",
                created_at=now,
                action="Send reminders",
            )
        )

    if not alerts:
        alerts.append(
            Alert(
                id="alert_healthy",
                severity=AlertSeverity.low,
                title="No urgent liquidity alerts",
                detail="Cash position is above the operating floor for the forecast horizon.",
                created_at=now,
                action=None,
            )
        )

    return alerts
