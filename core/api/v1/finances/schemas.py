from datetime import datetime

from pydantic import BaseModel

from core.apps.finances.entities.finances import Finances as FinancesEntity


class FinancesOutSchema(BaseModel):
    id: int
    amount_in_goods: float
    amount_in_defects: float
    income_amount: float
    debt_for_goods_amount: float
    created_at: datetime
    updated_at: datetime

    @staticmethod
    def from_entity(entity: FinancesEntity) -> 'FinancesOutSchema':
        return FinancesOutSchema(
            id=entity.id,
            amount_in_goods=entity.amount_in_goods,
            amount_in_defects=entity.amount_in_defects,
            income_amount=entity.income_amount,
            debt_for_goods_amount=entity.debt_for_goods_amount,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )


class FinancesUpdateInSchema(BaseModel):
    amount_in_goods: float | None = None
    amount_in_defects: float | None = None
    income_amount: float | None = None
    debt_for_goods_amount: float | None = None
