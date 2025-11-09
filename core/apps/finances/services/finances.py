from abc import (
    ABC,
    abstractmethod,
)

from core.apps.finances.entities.finances import Finances
from core.apps.finances.models import Finances as FinancesModel


class BaseFinancesService(ABC):
    @abstractmethod
    def get_finance_data(self) -> Finances:
        ...

    @abstractmethod
    def update_finance_data(self, fields_to_update: dict) -> Finances:
        ...


class ORMFinancesService(BaseFinancesService):
    def get_finance_data(self) -> Finances:
        finances_dto = FinancesModel.objects.filter().first()

        if not finances_dto:
            finances_dto = FinancesModel.objects.create()

        return finances_dto.to_entity()

    def update_finance_data(self, fields_to_update: dict) -> Finances:
        finances_dto = FinancesModel.objects.filter().first()

        for key, value in fields_to_update.items():
            if value is not None:
                setattr(finances_dto, key, value)

        finances_dto.save()

        return finances_dto.to_entity()
