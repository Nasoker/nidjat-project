DC = docker compose
STORAGES_FILE = docker_compose/storages.yaml
APP_FILE = docker_compose/app.yaml
LOGS = docker logs
EXEC = docker exec -it
DB_CONTAINER = nidjat-db
APP_CONTAINER = nidjat_app
ENV = --env-file .env
MANAGE_PY = python manage.py

.PHONY: storages
storages:
	${DC} -f ${STORAGES_FILE} ${ENV} up -d

.PHONY: storages-down
storages-down:
	${DC} -f ${STORAGES_FILE} down

.PHONY: storages-logs
storages-logs:
	${LOGS} ${DB_CONTAINER} -f

.PHONY: storages-exec
storages-exec:
	${EXEC} ${DB_CONTAINER} psql nidjat -U postgres

.PHONY: app
app:
	${DC} -f ${APP_FILE} -f ${STORAGES_FILE} ${ENV} up --build -d

.PHONY: app-logs
app-logs:
	${LOGS} ${APP_CONTAINER} -f

.PHONY: app-down
app-down:
	${DC} -f ${APP_FILE} -f ${STORAGES_FILE} ${ENV} down

.PHONY: migrate
migrate:
	${EXEC} ${APP_CONTAINER} ${MANAGE_PY} migrate

.PHONY: migrations
migrations:
	${EXEC} ${APP_CONTAINER} ${MANAGE_PY} makemigrations

.PHONY: superuser
superuser:
	${EXEC} ${APP_CONTAINER} ${MANAGE_PY} createsuperuser

.PHONY: collect-static
collect-static:
	${EXEC} ${APP_CONTAINER} ${MANAGE_PY} collectstatic

.PHONY: clear-income-amount
clear-income-amount:
	${EXEC} ${APP_CONTAINER} ${MANAGE_PY} clear_income_amount