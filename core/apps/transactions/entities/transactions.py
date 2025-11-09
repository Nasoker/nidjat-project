from dataclasses import (
    dataclass,
    field,
)
from datetime import datetime

from core.apps.common.enums import EntityStatus
from core.apps.users.entities.users import User


@dataclass
class TransactionType:
    id: int
    type: str
    created_at: datetime
    updated_at: datetime


@dataclass
class Transaction:
    id: int | None = field(default=None)  # noqa
    type: TransactionType | EntityStatus = field(default=EntityStatus.NOT_LOADED)
    customer: User | None = field(default=None)
    provider: str | None = field(default=None)
    amount: float = field(default=0)
    comment: str | None = field(default=None)
    created_at: datetime | None = field(default_factory=datetime.now)
    updated_at: datetime | None = field(default=None)


@dataclass
class TransactionRequest(Transaction):
    status: str | None = field(default=None)
    requester: User | None = field(default=None)
    approver: User | None = field(default=None)
