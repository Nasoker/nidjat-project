from abc import (
    ABC,
    abstractmethod,
)
from typing import Iterable

from django.db.models import Q

from core.api.filters import PaginationIn
from core.api.v1.transaction_requests.filters import TransactionRequestFilters
from core.apps.transactions.entities.transactions import (
    Transaction as Transaction,
    TransactionRequest as TransactionRequest,
)
from core.apps.transactions.models import (
    Transaction as TransactionModel,
    TransactionRequest as TransactionRequestModel,
)
from core.apps.users.models import User as UserModel
from core.apps.users.services.users import (
    BaseUsersService,
    ORMUsersService,
)


class BaseTransactionRequestsService(ABC):
    @abstractmethod
    def get_transaction_requests(
            self,
            filters: TransactionRequestFilters,
            pagination: PaginationIn,
    ) -> Iterable[TransactionRequest]:
        ...

    @abstractmethod
    def get_transaction_requests_count(self, filters: TransactionRequestFilters) -> int:
        ...

    @abstractmethod
    def get_transaction_request(self, transaction_request_id: int) -> TransactionRequest:
        ...

    @abstractmethod
    def create_transaction_request(self, transaction_request: TransactionRequest) -> TransactionRequest:
        ...

    @abstractmethod
    def update_transaction_request(self, transaction_request_id: int, fields_to_update: dict) -> TransactionRequest:
        ...

    @abstractmethod
    def approve_transaction_request(self, transaction_request_id: int, approver_id: int) -> Transaction:
        ...

    @abstractmethod
    def reject_transaction_request(self, transaction_request_id: int, approver_id: int) -> None:
        ...


class ORMTransactionRequestsService(BaseTransactionRequestsService):
    def get_transaction_requests(
            self,
            filters: TransactionRequestFilters,
            pagination: PaginationIn,
    ) -> Iterable[TransactionRequest]:
        query = self._build_transaction_requests_query(filters)
        qs = TransactionRequestModel \
                 .objects \
                 .filter(query) \
                 .select_related('customer') \
                 .select_related('requester') \
                 .select_related('approver') \
                 .select_related('transaction_type') \
                 .order_by('-created_at')[pagination.offset:pagination.offset + pagination.limit]

        return [transaction_request.to_entity() for transaction_request in qs]

    def get_transaction_requests_count(self, filters: TransactionRequestFilters) -> int:
        query = self._build_transaction_requests_query(filters)
        return TransactionRequestModel.objects.filter(query).select_related().count()

    def get_transaction_request(self, transaction_request_id: int) -> TransactionRequest | None:
        transaction_request_dto = TransactionRequestModel \
            .objects \
            .filter(pk=transaction_request_id) \
            .select_related('customer') \
            .select_related('requester') \
            .select_related('approver') \
            .select_related('transaction_type') \
            .first()

        if transaction_request_dto:
            return transaction_request_dto.to_entity()
        else:
            return None

    def create_transaction_request(self, transaction_request: TransactionRequest) -> TransactionRequest:
        transaction_request_dto = TransactionRequestModel.from_entity(transaction_request)
        transaction_request_dto.status = TransactionRequestModel.REQUESTED
        transaction_request_dto.save()
        return transaction_request_dto.to_entity()

    def update_transaction_request(self, transaction_request_id: int, fields_to_update: dict) -> TransactionRequest:
        raise Exception('Not Implemented!')

    def approve_transaction_request(self, transaction_request_id: int, approver_id: int) -> Transaction:
        transaction_request_dto = TransactionRequestModel \
            .objects \
            .select_related('customer') \
            .select_related('requester') \
            .select_related('approver') \
            .select_related('transaction_type') \
            .get(pk=transaction_request_id)

        users_service: BaseUsersService = ORMUsersService()
        approver = users_service.get_user(approver_id)

        if approver is None:
            raise Exception(f'No Approver found with id: {approver_id}')

        setattr(transaction_request_dto, 'status', TransactionRequestModel.APPROVED)
        setattr(transaction_request_dto, 'approver', UserModel.from_entity(approver))

        transaction_request_dto.save()

        # TODO: link transaction request and transaction ???

        transaction_dto = TransactionModel(
            transaction_type=transaction_request_dto.transaction_type,
            customer=transaction_request_dto.customer,
            provider=transaction_request_dto.provider,
            amount=transaction_request_dto.amount,
            comment=transaction_request_dto.comment,
        )

        transaction_dto.save()

        return transaction_dto.to_entity()

    def reject_transaction_request(self, transaction_request_id: int, approver_id: int) -> None:
        transaction_request_dto = TransactionRequestModel \
            .objects \
            .select_related('customer') \
            .select_related('requester') \
            .select_related('approver') \
            .select_related('transaction_type') \
            .get(pk=transaction_request_id)

        users_service: BaseUsersService = ORMUsersService()
        approver = users_service.get_user(approver_id)

        if approver is None:
            raise Exception(f'No Approver found with id: {approver_id}')

        setattr(transaction_request_dto, 'status', TransactionRequestModel.REJECTED)
        setattr(transaction_request_dto, 'approver', UserModel.from_entity(approver))

        transaction_request_dto.save()

    def _build_transaction_requests_query(self, filters: TransactionRequestFilters) -> Q:
        query = Q()

        if filters.status is not None and filters.status not in TransactionRequestModel.STATUSES:
            raise Exception('Invalid Transaction Request status.')

        if filters.status is not None:
            query &= Q(status=filters.status)

        return query
