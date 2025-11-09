from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import Group

from .models import User


@admin.register(User)
class UserAdmin(UserAdmin):
    fieldsets = (
        ('Личные данные', {'fields': ('email', 'first_name', 'last_name', 'phone', 'telegram')}),
        ('Права пользователя', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'user_permissions')}),
        ('Информация о сотруднике', {'fields': ('salary',)}),
        ('Аутентификация', {'fields': ('username', 'password')}),
        ('Информация о входе', {'fields': ('last_login', 'date_joined')}),
    )

    readonly_fields = ('last_login', 'date_joined')

    add_fieldsets = (
        ('Личные данные', {'fields': ('email', 'first_name', 'last_name', 'phone', 'telegram')}),
        (
            'Аутентификация', {
                'classes': ('wide',),
                'fields': ('username', 'password1', 'password2'),
            },
        ),
        ('Права пользователя', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'user_permissions')}),
    )

    list_display = (
        'id',
        'username',
        'email',
        'first_name',
        'last_name',
        'phone',
        'telegram',
        'role',
        'salary',
    )

    list_display_links = ('username',)


admin.site.unregister(Group)
