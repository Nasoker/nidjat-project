from abc import (
    ABC,
    abstractmethod,
)
from datetime import (
    date,
    datetime,
)
from typing import Iterable

from django.db.models import (
    F,
    Q,
    Sum,
)

from core.api.filters import PaginationIn
from core.api.v1.transactions.filters import (
    BalancesSumFilters,
    TransactionFilters,
)
from core.apps.transactions.entities.transactions import (
    Transaction as Transaction,
    TransactionType as TransactionType,
)
from core.apps.transactions.models import (
    Transaction as TransactionModel,
    TransactionType as TransactionTypeModel,
)


class BaseTransactionsService(ABC):
    @abstractmethod
    def get_transactions(self, filters: TransactionFilters, pagination: PaginationIn) -> Iterable[Transaction]:
        ...

    @abstractmethod
    def get_transaction_by_id(self, transaction_id: int) -> Transaction:
        ...

    @abstractmethod
    def get_transactions_count(self, filters: TransactionFilters) -> int:
        ...

    @abstractmethod
    def get_transactions_total(self, filters: TransactionFilters) -> float:
        ...

    @abstractmethod
    def get_customer_transactions(self, customer_id: int, pagination: PaginationIn) -> Iterable[Transaction]:
        ...

    @abstractmethod
    def get_customer_transactions_count(self, customer_id: int) -> int:
        ...

    @abstractmethod
    def get_user_balance(self, user_id: int) -> float:
        ...

    @abstractmethod
    def get_transaction_types(self, pagination: PaginationIn) -> Iterable[TransactionType]:
        ...

    @abstractmethod
    def get_transaction_types_count(self) -> int:
        ...

    @abstractmethod
    def get_transaction_type_by_id(self, transaction_type_id: int) -> TransactionType:
        ...

    @abstractmethod
    def create_transaction(self, transaction: Transaction) -> Transaction:
        ...

    @abstractmethod
    def update_transaction(self, transaction_id: int, fields_to_update: dict) -> Transaction:
        ...

    @abstractmethod
    def get_subtotal(self, transaction_id: int) -> float:
        ...

    @abstractmethod
    def get_balances_sum(self, filters: BalancesSumFilters) -> float:
        ...

    @abstractmethod
    def get_provider_total_data(self, on_date: date, pagination: PaginationIn) -> list[dict]:
        ...

    @abstractmethod
    def get_provider_total_count(self, on_date: date) -> int:
        ...


class ORMTransactionsService(BaseTransactionsService):
    def get_transactions(self, filters: TransactionFilters, pagination: PaginationIn) -> Iterable[Transaction]:
        query = self._build_transactions_query(filters)
        qs = TransactionModel \
                 .objects \
                 .filter(query) \
                 .order_by('-created_at') \
                 .select_related()[pagination.offset:pagination.offset + pagination.limit]

        return [transaction.to_entity() for transaction in qs]

    def get_transaction_by_id(self, transaction_id: int) -> Transaction | None:
        transaction_dto = TransactionModel.objects.filter(pk=transaction_id).select_related().first()

        if transaction_dto:
            return transaction_dto.to_entity()
        else:
            return None

    def get_transactions_count(self, filters: TransactionFilters) -> int:
        query = self._build_transactions_query(filters)
        return TransactionModel.objects.filter(query).count()

    def get_transactions_total(self, filters: TransactionFilters) -> float:
        query = self._build_transactions_query(filters)
        total_data = TransactionModel.objects.filter(query).aggregate(Sum('amount'))

        if total_data['amount__sum']:
            return total_data['amount__sum']
        else:
            return 0

    def get_customer_transactions(self, customer_id: int, pagination: PaginationIn) -> Iterable[Transaction]:
        qs = TransactionModel \
                 .objects \
                 .filter(customer__pk=customer_id) \
                 .order_by('-created_at') \
                 .select_related()[pagination.offset:pagination.offset + pagination.limit]

        return [transaction.to_entity() for transaction in qs]

    def get_customer_transactions_count(self, customer_id: int) -> int:
        return TransactionModel.objects.filter(customer__pk=customer_id).count()

    def get_user_balance(self, user_id: int) -> float:
        balance_data = TransactionModel.objects.filter(Q(customer__pk=user_id)).aggregate(Sum('amount'))

        if balance_data['amount__sum']:
            return balance_data['amount__sum']
        else:
            return 0

    def get_transaction_types(self, pagination: PaginationIn) -> Iterable[TransactionType]:
        qs = TransactionTypeModel \
                 .objects \
                 .order_by('-created_at') \
                 .all()[pagination.offset:pagination.offset + pagination.limit]
        return [transaction_type.to_entity() for transaction_type in qs]

    def get_transaction_types_count(self) -> int:
        return TransactionTypeModel.objects.all().count()

    def get_transaction_type_by_id(self, transaction_type_id: int) -> TransactionType | None:
        transaction_type_dto = TransactionTypeModel.objects.filter(pk=transaction_type_id).first()

        if transaction_type_dto:
            return transaction_type_dto.to_entity()
        else:
            return None

    def create_transaction(self, transaction: Transaction) -> Transaction:
        transaction_dto = TransactionModel.from_entity(transaction)
        transaction_dto.save()
        return transaction_dto.to_entity()

    def update_transaction(self, transaction_id: int, fields_to_update: dict) -> Transaction:
        transaction_dto = TransactionModel.objects.select_related().get(pk=transaction_id)

        for key, value in fields_to_update.items():
            if key == 'transaction_type' and value is not None:
                transaction_type = TransactionTypeModel.objects.get(pk=value)
                setattr(transaction_dto, key, transaction_type)
            elif value is not None:
                setattr(transaction_dto, key, value)

        transaction_dto.save()
        return transaction_dto.to_entity()

    def get_subtotal(self, transaction_id: int) -> float:
        transaction_dto = TransactionModel.objects.filter(pk=transaction_id).select_related().first()

        if not transaction_dto:
            raise Exception('Transaction does not exist')

        query = Q()

        query &= Q(customer__pk=transaction_dto.customer_id) & Q(created_at__lte=transaction_dto.created_at)

        subtotal_data = TransactionModel.objects.filter(query).aggregate(Sum('amount'))

        if subtotal_data['amount__sum']:
            return subtotal_data['amount__sum']

        return 0

    def get_balances_sum(self, filters: BalancesSumFilters) -> float:
        query = Q()

        if filters.positive is None or filters.positive:
            query &= Q(balance__gt=0)
        else:
            query &= Q(balance__lt=0)

        qs = TransactionModel \
            .objects \
            .order_by('-created_at') \
            .values('customer') \
            .filter(Q(customer__isnull=False)) \
            .annotate(balance=Sum('amount')) \
            .filter(query) \
            .aggregate(total=Sum('balance'))

        if qs['total']:
            return qs['total']

        return 0

    def get_provider_total_data(self, on_date: date, pagination: PaginationIn) -> list[dict]:
        query = self._build_provider_total_query(on_date)

        qs = TransactionModel \
                 .objects \
                 .filter(query) \
                 .annotate(provider_name=F('provider')) \
                 .values('provider_name') \
                 .annotate(total=Sum('amount')) \
                 .order_by('total')[pagination.offset:pagination.offset + pagination.limit]

        return [{'provider': obj['provider_name'], 'total': obj['total']} for obj in qs]

    def get_provider_total_count(self, on_date: date) -> int:
        query = self._build_provider_total_query(on_date)

        return TransactionModel \
            .objects \
            .filter(query) \
            .values('provider') \
            .order_by('provider') \
            .distinct('provider') \
            .count()

    def _build_provider_total_query(self, on_date: date) -> Q:
        query = Q()

        query &= Q(transaction_type__type='Закуп')

        if on_date is None:
            query &= Q(created_at__date=date.today())
        else:
            query &= Q(created_at__date=on_date)

        return query

    def _build_transactions_query(self, filters: TransactionFilters) -> Q:
        query = Q()

        if filters.types is not None:
            for type_id in filters.types:
                query |= Q(transaction_type__pk=type_id)

        if filters.is_income is not None:
            if filters.is_income:
                query &= Q(amount__gte=0)
            else:
                query &= Q(amount__lt=0)

        if filters.year and filters.month:
            query &= Q(created_at__month=filters.month)
            query &= Q(created_at__year=filters.year)
        elif filters.is_current_month:
            today = datetime.now()
            query &= Q(created_at__month=today.month)
            query &= Q(created_at__year=today.year)
        elif filters.is_today:
            query &= Q(created_at__date=date.today())

        return query
