from dataclasses import dataclass
from datetime import datetime


@dataclass
class User:
    id: int
    username: str
    first_name: str
    last_name: str
    email: str
    phone: str
    telegram: str
    role: str


@dataclass
class Customer(User):
    balance: float
    last_transaction_date: datetime


@dataclass
class Employee(User):
    salary: float
