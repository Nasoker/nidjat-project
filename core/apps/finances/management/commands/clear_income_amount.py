from django.core.management.base import (
    BaseCommand,
    CommandError,
)

from core.apps.finances.services.finances import (
    BaseFinancesService,
    ORMFinancesService,
)


class Command(BaseCommand):
    def handle(self, *args, **options):
        try:
            service: BaseFinancesService = ORMFinancesService()
            service.update_finance_data({
                'income_amount': 0,
            })

            self.stdout.write(
                self.style.SUCCESS('Successfully cleared income_amount'),
            )
        except Exception as e:
            raise CommandError(e)
