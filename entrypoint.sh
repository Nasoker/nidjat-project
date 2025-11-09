#!/bin/bash

wait_for_port() {
  local host="$1"
  local port="$2"
  local timeout=10
  local start_time=$(date +%s)

  local nc_command="nc"
  type $nc_command >/dev/null 2>&1 || nc_command="ncat"

  while ! $nc_command -z "$host" "$port" >/dev/null 2>&1; do
    sleep 1
    local current_time=$(date +%s)
    local elapsed_time=$((current_time - start_time))
    echo "Trying to connect to: $host:$port"

    if [ $elapsed_time -ge $timeout ]; then
      echo "Unable to connect to $host:$port"
      exit 1
    fi
  done
}

# Wait for postgres
wait_for_port "nidjat-db" 5432

# Run Django
python manage.py runserver 0.0.0.0:8000