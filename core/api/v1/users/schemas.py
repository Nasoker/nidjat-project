from datetime import datetime

from pydantic import BaseModel

from core.apps.users.entities.users import (
    Customer,
    Employee,
    User,
)


class UserOutSchema(BaseModel):
    id: int
    username: str
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
    telegram: str | None = None
    role: str

    @staticmethod
    def from_entity(entity: User) -> 'UserOutSchema':
        return UserOutSchema(
            id=entity.id,
            username=entity.username,
            first_name=entity.first_name,
            last_name=entity.last_name,
            email=entity.email,
            phone=entity.phone,
            telegram=entity.telegram,
            role=entity.role,
        )


class CustomerOutSchema(UserOutSchema):
    balance: float
    last_transaction_date: datetime | None = None

    @staticmethod
    def from_entity(entity: Customer) -> 'CustomerOutSchema':
        return CustomerOutSchema(
            id=entity.id,
            username=entity.username,
            first_name=entity.first_name,
            last_name=entity.last_name,
            email=entity.email,
            phone=entity.phone,
            telegram=entity.telegram,
            role=entity.role,
            balance=entity.balance,
            last_transaction_date=entity.last_transaction_date,
        )


class EmployeeOutSchema(UserOutSchema):
    salary: float

    @staticmethod
    def from_entity(entity: Employee) -> 'EmployeeOutSchema':
        return EmployeeOutSchema(
            id=entity.id,
            username=entity.username,
            first_name=entity.first_name,
            last_name=entity.last_name,
            email=entity.email,
            phone=entity.phone,
            telegram=entity.telegram,
            role=entity.role,
            salary=entity.salary,
        )


class UserBalanceOutSchema(BaseModel):
    id: int
    balance: float
