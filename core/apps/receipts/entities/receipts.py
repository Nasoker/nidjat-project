from dataclasses import dataclass


@dataclass
class Receipt:
    id: int
    transaction_id: int
    file_path: str
