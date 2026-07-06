from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from app.repository import DemoRepository
from app.schemas import (
    BankAccount,
    DashboardResponse,
    ExchangePublicTokenRequest,
    ExchangePublicTokenResponse,
    LinkTokenResponse,
    SyncResponse,
    Transaction,
)
from app.settings import get_settings

settings = get_settings()
repo = DemoRepository(settings)

app = FastAPI(title=settings.app_name, version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "environment": settings.environment}


@app.get("/v1/dashboard", response_model=DashboardResponse)
def dashboard() -> DashboardResponse:
    return repo.dashboard()


@app.get("/v1/accounts", response_model=list[BankAccount])
def accounts() -> list[BankAccount]:
    return repo.list_accounts()


@app.get("/v1/transactions", response_model=list[Transaction])
def transactions(limit: int = Query(default=100, ge=1, le=500)) -> list[Transaction]:
    return repo.list_transactions(limit=limit)


@app.post("/v1/plaid/link-token", response_model=LinkTokenResponse)
def create_link_token() -> LinkTokenResponse:
    return repo.create_link_token()


@app.post("/v1/plaid/exchange-public-token", response_model=ExchangePublicTokenResponse)
def exchange_public_token(payload: ExchangePublicTokenRequest) -> ExchangePublicTokenResponse:
    return repo.exchange_public_token(payload.public_token)


@app.post("/v1/sync", response_model=SyncResponse)
def sync_transactions() -> SyncResponse:
    return repo.sync()
