SHELL = /bin/bash
MAKEFLAGS += --silent

export ROOT_DIR=$(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))
ARGS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))

init_local_env = cp --update=none .env.dist .env

dev:
	$(init_local_env)
	docker compose --profile development down
	docker compose --profile development up -d

dev-build:
	$(init_local_env)
	docker compose --profile development down
	docker compose --profile development up --build -d

prod:
	$(init_local_env)
	docker compose --profile production down
	docker compose --profile production up -d

prod-build:
	$(init_local_env)
	docker compose --profile production down
	docker compose --profile production up --build -d

stop:
	$(init_local_env)
	docker compose --profile production --profile development down

logs:
	$(init_local_env)
	docker compose --profile production --profile development logs -f
