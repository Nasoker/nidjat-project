from datetime import datetime

from pydantic import BaseModel

from core.apps.transactions.entities.transactions import (
    Transaction as TransactionEntity,
    TransactionType as TransactionTypeEntity,
)
from core.apps.users.entities.users import User as UserEntity


class TransactionOutSchema(BaseModel):
    id: int
    transaction_type: str
    provider: str | None
    amount: float
    comment: str | None
    created_at: datetime
    updated_at: datetime

    @staticmethod
    def from_entity(entity: TransactionEntity) -> 'TransactionOutSchema':
        return TransactionOutSchema(
            id=entity.id,
            transaction_type=entity.type.type,
            provider=entity.provider,
            amount=entity.amount,
            comment=entity.comment,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )


class TransactionsTotalOutSchema(BaseModel):
    total: float


class TransactionSubtotalOutSchema(BaseModel):
    subtotal: float


class TransactionTypeOutSchema(BaseModel):
    id: int
    type: str

    @staticmethod
    def from_entity(entity: TransactionTypeEntity) -> 'TransactionTypeOutSchema':
        return TransactionTypeOutSchema(
            id=entity.id,
            type=entity.type,
        )


class CreateTransactionInSchema(BaseModel):
    customer_id: int | None = None
    transaction_type_id: int
    provider: str | None = None
    amount: float
    comment: str | None = None

    def to_entity(self, customer: UserEntity | None, transaction_type: TransactionTypeEntity) -> TransactionEntity:
        return TransactionEntity(
            customer=customer,
            type=transaction_type,
            provider=self.provider,
            amount=self.amount,
            comment=self.comment,
        )


class UpdateTransactionInSchema(BaseModel):
    transaction_type_id: int | None = None
    provider: str | None = None
    amount: float | None = None
    comment: str | None = None


class ProviderTotalOutSchema(BaseModel):
    provider: str | None = None
    total: float
