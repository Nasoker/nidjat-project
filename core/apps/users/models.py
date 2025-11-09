from django.contrib.auth.models import AbstractUser
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.db import models

from phonenumber_field.modelfields import PhoneNumberField

from core.apps.users.entities.users import (
    Customer as CustomerEntity,
    Employee as EmployeeEntity,
    User as UserEntity,
)


class User(AbstractUser):
    CUSTOMER = 'Customer'
    CASHIER = 'Cashier'
    MODERATOR = 'Moderator'
    ADMIN = 'Admin'
    DEPOSITOR = 'Depositor'

    ROLE_CHOICES = (
        (CUSTOMER, 'Клиент'),
        (CASHIER, 'Кассир'),
        (MODERATOR, 'Модератор'),
        (ADMIN, 'Администратор'),
        (DEPOSITOR, 'Инвестор'),
    )

    phone = PhoneNumberField(
        region='RU',
        unique=True,
        verbose_name='Номер телефона',
    )

    telegram = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        unique=True,
        validators=[UnicodeUsernameValidator()],
        verbose_name='Телеграм',
    )

    role = models.CharField(
        max_length=50,
        choices=ROLE_CHOICES,
        default=CUSTOMER,
        verbose_name='Роль',
    )

    salary = models.DecimalField(
        decimal_places=2,
        max_digits=10,
        null=True,
        blank=True,
        verbose_name='Зарплата сотрудника',
    )

    def __str__(self):
        if not self.last_name:
            return f'{self.first_name} ({self.email})'
        else:
            return f'{self.first_name} {self.last_name} ({self.email})'

    @property
    def is_admin(self) -> bool:
        return self.role == self.ADMIN and self.role == self.is_staff

    @property
    def is_moderator(self) -> bool:
        return self.role == self.MODERATOR and self.role == self.is_staff

    @property
    def is_cashier(self) -> bool:
        return self.role == self.CASHIER

    @property
    def is_customer(self) -> bool:
        return self.role == self.CUSTOMER

    def to_entity(self) -> UserEntity:
        return UserEntity(
            id=self.id,
            username=self.username,
            first_name=self.first_name,
            last_name=self.last_name,
            email=self.email,
            phone=str(self.phone),
            telegram=self.telegram,
            role=self.role,
        )

    def to_customer_entity(self) -> CustomerEntity:
        balance = self.balance if self.balance else 0

        return CustomerEntity(
            id=self.id,
            username=self.username,
            first_name=self.first_name,
            last_name=self.last_name,
            email=self.email,
            phone=str(self.phone),
            telegram=self.telegram,
            role=self.role,
            balance=balance,
            last_transaction_date=self.last_transaction_date,
        )

    def to_employee_entity(self) -> EmployeeEntity:
        salary = self.salary if self.salary else 0

        return EmployeeEntity(
            id=self.id,
            username=self.username,
            first_name=self.first_name,
            last_name=self.last_name,
            email=self.email,
            phone=str(self.phone),
            telegram=self.telegram,
            role=self.role,
            salary=float(salary),
        )

    @classmethod
    def from_entity(cls, entity: UserEntity) -> 'User':
        return cls(
            id=entity.id,
            username=entity.username,
            first_name=entity.first_name,
            last_name=entity.last_name,
            email=entity.email,
            phone=entity.phone,
            telegram=entity.telegram,
            role=entity.role,
        )

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
        ordering = ['-date_joined']
