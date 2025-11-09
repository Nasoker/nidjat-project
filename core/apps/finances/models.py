from django.db import models
from django.utils.html import format_html

from core.apps.common.models import TimeStampedModel
from core.apps.finances.entities.finances import Finances as FinancesEntity


class Cash(TimeStampedModel):
    """Used to store data about Cash."""

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=False,
        null=False,
        verbose_name='Сумма',
    )

    comment = models.TextField(
        max_length=2000,
        blank=True,
        null=True,
        verbose_name='Примечание',
    )

    def colored_amount(self):
        color_code = '#77DD77' if self.amount > 0 else '#ff6961'

        return format_html(
            '<span style="color:{0};">{1}</span>',
            color_code,
            f'{self.amount:,}',
        )

    colored_amount.allow_tags = True
    colored_amount.short_description = 'Сумма операции'

    class Meta:
        verbose_name = 'Кеш в обороте'
        verbose_name_plural = 'Кеш в обороте'


class Finances(TimeStampedModel):
    """Used to store other finance data.

    Only one record should exist at a time

    """

    amount_in_goods = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        blank=False,
        null=False,
        verbose_name='Сумма в товаре',
    )

    amount_in_defects = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        blank=False,
        null=False,
        verbose_name='Сумма в браке',
    )

    income_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        blank=False,
        null=False,
        verbose_name='Сумма доходов',
    )

    debt_for_goods_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        blank=False,
        null=False,
        verbose_name='Сумма долга за товар',
    )

    def to_entity(self) -> FinancesEntity:
        return FinancesEntity(
            id=self.pk,
            amount_in_goods=float(self.amount_in_goods),
            amount_in_defects=float(self.amount_in_defects),
            income_amount=float(self.income_amount),
            debt_for_goods_amount=float(self.debt_for_goods_amount),
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    @classmethod
    def from_entity(cls, entity: FinancesEntity) -> 'Finances':
        return cls(
            amount_in_goods=entity.amount_in_goods,
            amount_in_defects=entity.amount_in_defects,
            income_amount=entity.income_amount,
            debt_for_goods_amount=entity.debt_for_goods_amount,
        )

    class Meta:
        verbose_name = 'Финансы'
        verbose_name_plural = 'Финансы'
