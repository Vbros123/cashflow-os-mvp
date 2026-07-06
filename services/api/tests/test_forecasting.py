from app.forecasting import build_forecast
from app.seed import seed_accounts, seed_transactions


def test_forecast_returns_30_day_projection():
    forecast = build_forecast(seed_accounts(), seed_transactions())

    assert forecast.horizon_days == 30
    assert len(forecast.points) == 30
    assert forecast.starting_balance > 0


def test_forecast_can_detect_low_cash_risk():
    accounts = seed_accounts()
    for account in accounts:
        account.current_balance = 2500
        account.available_balance = 2500

    forecast = build_forecast(accounts, seed_transactions(), low_balance_threshold=5000)

    assert forecast.shortage_date is not None
    assert forecast.risk in {"high", "medium"}
