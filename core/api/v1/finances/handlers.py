from django.http import HttpRequest
from ninja import Router
from ninja.errors import HttpError

from core.api.schemas import ApiResponse
from core.api.v1.finances.schemas import (
    FinancesOutSchema,
    FinancesUpdateInSchema,
)
from core.apps.finances.services.finances import (
    BaseFinancesService,
    ORMFinancesService,
)


router = Router(tags=['Finances'])


@router.get('', response=ApiResponse[FinancesOutSchema])
def get_finance_data_handler(request: HttpRequest) -> ApiResponse[FinancesOutSchema]:
    try:
        service: BaseFinancesService = ORMFinancesService()
        finance_data = service.get_finance_data()

        return ApiResponse(data=FinancesOutSchema.from_entity(finance_data))
    except Exception as e:
        raise HttpError(status_code=500, message=str(e))


@router.put('/update', response=ApiResponse[FinancesOutSchema])
def update_finance_data_handler(
        request: HttpRequest,
        finance_data_in: FinancesUpdateInSchema,
) -> ApiResponse[FinancesOutSchema]:
    try:
        service: BaseFinancesService = ORMFinancesService()
        updated_finance_data = service.update_finance_data(finance_data_in.dict())

        return ApiResponse(data=FinancesOutSchema.from_entity(updated_finance_data))
    except Exception as e:
        raise HttpError(status_code=500, message=str(e))
