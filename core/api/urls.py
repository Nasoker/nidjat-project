from django.urls import path

from ninja_extra import NinjaExtraAPI
from ninja_jwt.authentication import JWTAuth
from ninja_jwt.controller import NinjaJWTDefaultController

from core.api.v1.urls import router as v1_router


api = NinjaExtraAPI(docs_url=None)
api.register_controllers(NinjaJWTDefaultController)

api.add_router(router=v1_router, prefix="v1/", auth=JWTAuth())

urlpatterns = [
    path("", api.urls),
]
