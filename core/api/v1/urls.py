from ninja import Router

from core.api.v1.finances.handlers import router as finances_router
from core.api.v1.receipts.handlers import router as receipts_router
from core.api.v1.transaction_requests.handlers import router as transaction_requests_router
from core.api.v1.transactions.handlers import router as transactions_router
from core.api.v1.users.handlers import router as users_router


router = Router(tags=['v1'])
router.add_router(router=users_router, prefix='users/')
router.add_router(router=transactions_router, prefix='transactions/')
router.add_router(router=receipts_router, prefix='receipts/')
router.add_router(router=finances_router, prefix='finances/')
router.add_router(router=transaction_requests_router, prefix='transaction_requests/')
