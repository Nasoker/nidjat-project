"""URL configuration for project nidjat.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))

"""
from django.contrib import admin
from django.urls import (
    include,
    path,
)

from core.project import views


# from core.project.settings import local as settings

urlpatterns = [
    path('adminsecure/', admin.site.urls),
    path('api/', include('core.api.urls')),
    path('capitalization/', views.capitalization, name='capitalization'),
    path('client/', views.client, name='client'),
    path('clients/', views.clients, name='clients'),
    path('login/', views.login, name='login'),
    path('', views.login, name='login'),
    path('orders/', views.orders, name='orders'),
    path('purchase/', views.purchase, name='purchase'),
    path('report/', views.report, name='report'),
    path('salary/', views.salary, name='salary'),
    path('budget/', views.budget, name='budget'),
]

# if settings.DEBUG:
#     urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
