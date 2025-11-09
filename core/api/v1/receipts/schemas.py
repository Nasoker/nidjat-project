from pydantic import BaseModel


class TransactionIdsInSchema(BaseModel):
    transaction_ids: list[int]


class ReceiptOutSchema(BaseModel):
    id: int
    transaction_id: int
    file_path: str

    @staticmethod
    def from_entity(entity) -> 'ReceiptOutSchema':
        return ReceiptOutSchema(
            id=entity.id,
            transaction_id=entity.transaction_id,
            file_path=entity.file_path,
        )
