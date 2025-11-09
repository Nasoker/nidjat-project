from datetime import datetime

from pydantic import BaseModel

from core.apps.transactions.entities.transactions import (
    TransactionRequest as TransactionRequestEntity,
    TransactionType as TransactionTypeEntity,
)
from core.apps.users.entities.users import User as UserEntity


class TransactionRequestOutSchema(BaseModel):
    id: int
    transaction_type: str
    status: str
    provider: str | None
    amount: float
    comment: str | None
    customer: int | None
    requester: int | None
    approver: int | None
    created_at: datetime
    updated_at: datetime

    @staticmethod
    def from_entity(entity: TransactionRequestEntity) -> 'TransactionRequestOutSchema':
        customer_id = entity.customer.id if entity.customer is not None else None
        approver_id = entity.approver.id if entity.approver is not None else None
        requester_id = entity.requester.id if entity.requester is not None else None

        # TODO: check User entities
        return TransactionRequestOutSchema(
            id=entity.id,
            transaction_type=entity.type.type,
            status=entity.status,
            provider=entity.provider,
            amount=entity.amount,
            comment=entity.comment,
            customer=customer_id,
            approver=approver_id,
            requester=requester_id,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )


class CreateTransactionRequestInSchema(BaseModel):
    transaction_type_id: int
    amount: float
    requester_id: int
    customer_id: int | None = None
    provider: str | None = None
    comment: str | None = None

    def to_entity(
            self,
            transaction_type: TransactionTypeEntity,
            requester: UserEntity,
            customer: UserEntity | None,
    ) -> TransactionRequestEntity:
        return TransactionRequestEntity(
            requester=requester,
            type=transaction_type,
            customer=customer,
            provider=self.provider,
            amount=self.amount,
            comment=self.comment,
        )


class UpdateTransactionRequestInSchema(BaseModel):
    transaction_type_id: int | None = None
    customer_id: int | None = None
    provider: str | None = None
    amount: float | None = None
    comment: str | None = None
