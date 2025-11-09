from django.http import HttpRequest
from ninja import (
    File,
    Router,
)
from ninja.errors import HttpError
from ninja.files import UploadedFile

from core.api.filters import PaginationOut
from core.api.schemas import (
    ApiResponse,
    ListPaginatedResponse,
)
from core.api.v1.receipts.schemas import (
    ReceiptOutSchema,
    TransactionIdsInSchema,
)
from core.apps.receipts.services.receipts import (
    BaseReceiptService,
    ORMReceiptService,
)


router = Router(tags=['Receipts'])


@router.post('', response=ApiResponse[ListPaginatedResponse[ReceiptOutSchema]])
def handle_get_receipts(
        request: HttpRequest,
        transaction_ids_in: TransactionIdsInSchema,
) -> ApiResponse[ListPaginatedResponse[ReceiptOutSchema]]:
    service: BaseReceiptService = ORMReceiptService()

    receipts = service.get_receipts_by_transaction_ids(transaction_ids_in.transaction_ids)
    items = [ReceiptOutSchema.from_entity(obj) for obj in receipts]
    pagination_out: PaginationOut = PaginationOut(
        offset=0,
        limit=len(items),
        total=len(items),
    )

    return ApiResponse(data=ListPaginatedResponse(items=items, pagination=pagination_out))


@router.get('/{transaction_id}', response=ApiResponse[ReceiptOutSchema])
def handle_get_receipt(
        request: HttpRequest,
        transaction_id: int,
) -> ApiResponse[ReceiptOutSchema]:
    service: BaseReceiptService = ORMReceiptService()

    try:
        receipt = service.get_receipt(transaction_id)

        if receipt is None:
            raise HttpError(status_code=400, message=f'No receipt found for transaction: {transaction_id}')

        return ApiResponse(data=ReceiptOutSchema.from_entity(receipt))
    except Exception:
        raise HttpError(status_code=500, message='Something went wrong. Please try again.')


@router.post('/{transaction_id}/save', response=ApiResponse[ReceiptOutSchema])
def handle_add_receipt(
        request: HttpRequest,
        transaction_id: int,
        file: UploadedFile = File(...),
) -> ApiResponse[ReceiptOutSchema]:
    service: BaseReceiptService = ORMReceiptService()

    try:
        saved_receipt = service.save_receipt(transaction_id=transaction_id, file=file)
        return ApiResponse(data=ReceiptOutSchema.from_entity(saved_receipt))
    except Exception as e:
        print(e)
        raise HttpError(status_code=500, message='Something went wrong. Please try again.')
