from ninja import Schema


class TransactionRequestFilters(Schema):
    status: str | None = None
