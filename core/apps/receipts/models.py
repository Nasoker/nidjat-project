import uuid

from django.db import models

from core.apps.common.models import TimeStampedModel
from core.apps.receipts.entities.receipts import Receipt as ReceiptEntity
from core.apps.transactions.models import Transaction


def receipt_filename(instance, filename):
    return f'receipts/{uuid.uuid4()}_{filename}'


class Receipt(TimeStampedModel):
    transaction = models.ForeignKey(
        Transaction,
        on_delete=models.CASCADE,
        null=False,
        blank=False,
        related_name='receipts',
        verbose_name='Чеки',
    )

    file = models.FileField(
        upload_to=receipt_filename,
    )

    def to_entity(self):
        return ReceiptEntity(
            id=self.pk,
            transaction_id=int(self.transaction_id),
            file_path=self.file.url,
        )
