from django.contrib import admin
from django.db.models import Sum

from rangefilter.filters import DateRangeFilterBuilder

from .models import (
    Transaction,
    TransactionType,
)


@admin.register(TransactionType)
class TransactionTypeAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'type',
        'created_at',
        'updated_at',
    )


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_filter = (('created_at', DateRangeFilterBuilder()),)

    change_list_template = 'admin/transactions/transaction/change_list.html'

    fieldsets = (
        ('Общая информация', {'fields': ('transaction_type', 'amount', 'comment')}),
        ('Данные о клиенте', {'fields': ('customer',)}),
        ('Данные о поставщике', {'fields': ('provider',)}),
        ('Системные данные', {'fields': ('created_at', 'updated_at')}),
    )

    add_fieldsets = (
        ('Общая информация', {'fields': ('transaction_type', 'amount', 'comment')}),
        ('Данные о клиенте', {'fields': ('customer',)}),
        ('Данные о поставщике', {'fields': ('provider',)}),
    )

    readonly_fields = ('created_at', 'updated_at')

    list_display = (
        'id',
        'transaction_type',
        'colored_amount',
        'comment',
        'customer',
        'provider',
        'created_at',
        'updated_at',
    )

    list_display_links = ('transaction_type',)

    def get_amount_sum(self):
        amount_sum = Transaction.objects.aggregate(amount_sum=Sum('amount'))['amount_sum']
        return f'{amount_sum:,}' if amount_sum is not None else 0

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['amount_sum'] = self.get_amount_sum()
        return super().changelist_view(request, extra_context)
