from app.schemas import Transaction


CATEGORY_RULES: dict[str, list[str]] = {
    "Payroll": ["gusto", "payroll", "adp", "rippling"],
    "Rent": ["rent", "lease", "property"],
    "Software": ["adobe", "figma", "notion", "shopify", "github", "slack"],
    "Infrastructure": ["aws", "cloud", "render", "vercel", "supabase"],
    "Marketing": ["ads", "google ads", "meta", "tiktok", "campaign"],
    "Shipping": ["usps", "fedex", "ups", "freight", "shipment"],
    "Inventory": ["inventory", "restock", "supplier", "loading dock"],
    "Sales": ["stripe", "square", "payout", "retail terminal"],
    "Receivables": ["invoice payment", "inv-"],
    "Banking": ["fee", "wire", "ach return"],
}


def classify_transaction(merchant: str, description: str, amount: float) -> str:
    haystack = f"{merchant} {description}".lower()
    for category, keywords in CATEGORY_RULES.items():
        if any(keyword in haystack for keyword in keywords):
            return category
    return "Sales" if amount > 0 else "Other"


def normalize_categories(transactions: list[Transaction]) -> list[Transaction]:
    normalized: list[Transaction] = []
    for transaction in transactions:
        category = classify_transaction(transaction.merchant, transaction.description, transaction.amount)
        normalized.append(transaction.model_copy(update={"category": category}))
    return normalized
