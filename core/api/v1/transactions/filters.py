from ninja import Schema


class TransactionFilters(Schema):
    types: list[int] | None = None
    is_income: bool | None = None
    is_current_month: bool | None = None
    is_today: bool | None = None
    month: int | None = None
    year: int | None = None


class BalancesSumFilters(Schema):
    positive: bool | None = True
