from django.contrib import admin
from django.db.models import Sum

from core.apps.finances.models import Cash


@admin.register(Cash)
class CashAdmin(admin.ModelAdmin):
    change_list_template = 'admin/finances/cash/change_list.html'

    list_display = (
        'id',
        'colored_amount',
        'comment',
        'created_at',
    )

    list_display_links = ('id',)

    def get_amount_sum(self):
        amount_sum = Cash.objects.aggregate(amount_sum=Sum('amount'))['amount_sum']
        return f'{amount_sum:,}' if amount_sum is not None else 0

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['amount_sum'] = self.get_amount_sum()
        return super().changelist_view(request, extra_context)
