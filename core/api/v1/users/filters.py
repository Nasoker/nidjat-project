from ninja import Schema


class UserFilters(Schema):
    name: str | None = None


class CustomerFilters(UserFilters):
    is_debtor: bool | None = None
