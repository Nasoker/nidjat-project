from dataclasses import (
    dataclass,
    field,
)
from datetime import datetime


@dataclass
class Finances:
    id: int | None = field(default=None)  # noqa
    amount_in_goods: float = field(default=0)
    amount_in_defects: float = field(default=0)
    income_amount: float = field(default=0)
    debt_for_goods_amount: float = field(default=0)
    created_at: datetime | None = field(default_factory=datetime.now)
    updated_at: datetime | None = field(default=None)
