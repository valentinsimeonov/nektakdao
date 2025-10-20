DC := $(shell which docker-compose)
ifeq ($(DC),)
	DC := docker compose
endif


CERULEAN := \033[0;36m
NC_CERULEAN := \033[0m

RED := \033[0;31m
NC_RED := \033[0m

NPMRUN = npm run

DEV_DC			:= ./docker-compose.dev.yml
PROD_DC			:= ./docker-compose.prod.yml

FRONTEND_DIR	:= frontend
BACKEND_DIR		:= backend

BUILD_LOG := build_log.txt

all: dev

prod: $(PROD_DC)
	@echo "\n$(RED)<    Nektak DAO    >$(NC_RED)"
	@echo "\n$(CERULEAN)Creating Docker Production Version$(NC)\n"
	$(DC) -f $(PROD_DC) up --build --remove-orphans -d

dev: $(DEV_DC)
	@echo "\n$(RED)<    Nektak  DAO   >$(NC_RED)"
	@echo "\n$(CERULEAN)Starting Docker services...$(NC)\n"
	$(DC) -f $(DEV_DC) up --build --remove-orphans -d 
	$(DC) -f $(DEV_DC) logs --tail 200 -f
	
stop:
	@echo "\n$(RED)<    Nektak DAO   >$(NC_RED)"
	@echo "\n$(CERULEAN)Stopping Docker services...$(NC)\n"
	-$(DC) -f $(DEV_DC) stop
	-$(DC) -f $(PROD_DC) stop

down: stop
	@echo "\n$(RED)<    Nektak DAO   >$(NC_RED)"
	@echo "\n$(CERULEAN)Removing Docker services...$(NC)\n"
	-$(DC) -f $(DEV_DC) down
	-$(DC) -f $(PROD_DC) down

fast: down dev
	@echo "\n$(RED)<    Nektak DAO   >$(NC_RED)"
	@echo "\n$(CERULEAN)Stopping then Building Docker services...$(NC)\n"

front:
	@echo "\n$(RED)<    Nektak  DAO  >$(NC_RED)"
	@echo "\n$(CERULEAN)Starting Frontend Server - NO CONTAINER...$(NC)\n"
	@cd $(FRONTEND_DIR) && sudo $(NPMRUN) dev

frontw:
	@echo "\n$(RED)<    Nektak  DAO  >$(NC_RED)"
	@echo "\n$(CERULEAN)Starting Frontend Server - NO CONTAINER...$(NC)\n"
	@cd $(FRONTEND_DIR) && $(NPMRUN) dev


frontp:
	@echo "\n$(RED)<    Nektak  DAO  >$(NC_RED)"
	@echo "\n$(CERULEAN)Starting Frontend Server - NO CONTAINER...$(NC)\n"
	@cd $(FRONTEND_DIR) && sudo $(NPMRUN) build
	@cd $(FRONTEND_DIR) && sudo $(NPMRUN) start

back:
	@echo "\n$(RED)<    Nektak  DAO  >$(NC_RED)"
	@echo "\n$(CERULEAN)Starting Backend Server - NO CONTAINER...$(NC)\n"
	@cd $(BACKEND_DIR) && $(NPMRUN) start

cleardb:
	@echo "\n$(RED)<    Nektak  DAO  >$(NC_RED)"
	@echo "\n$(CERULEAN)Checking for processes on port :5432...$(NC)\n"
	@sudo lsof -i :5432 || true

	@echo "\n$(RED)Killing processes on port 5432...$(NC_RED)\n"
	@sudo lsof -i :5432 | awk 'NR>1 {print $$2}' | xargs -r sudo kill -9 || true

	@echo "\n$(CERULEAN)Rechecking for processes on port :5432...$(NC)\n"
	@sudo lsof -i :5432 || true

cleara:
	@echo "\n$(RED)<    Nektak  DAO  >$(NC_RED)"
	@echo "\n$(CERULEAN)Stopping Apache Server on port :80 $(NC)\n"
	@sudo service apache2 stop || true
	@echo "\n$(CERULEAN)Double checking :80 $(NC)\n"
	@sudo lsof -i :80 || true

clear80:
	@echo "\n$(RED)<    Nektak  DAO  >$(NC_RED)"
	@echo "\n$(CERULEAN)Checking for processes on port :80...$(NC)\n"
	@sudo lsof -i :80 || true

	@echo "\n$(RED)Killing processes on port 80...$(NC_RED)\n"
	@sudo lsof -i :80 | awk 'NR>1 {print $$2}' | xargs -r sudo kill -9 || true

	@echo "\n$(CERULEAN)Rechecking for processes on port :80...$(NC)\n"
	@sudo lsof -i :80 || true

cleard:
	@echo "\n$(RED)<    Nektak  DAO  >$(NC_RED)"
	@echo "\n$(CERULEAN) Deleting Docker Volums, Images, Containers $(NC)\n"
	@docker system prune -a --volumes
	@docker container prune
	@docker network prune
	@docker image prune
	@docker image prune -a


test-contracts:
	cd contracts && npx hardhat test

deploy-testnet:
	cd contracts && npx hardhat run scripts/deploy.ts --network base-goerli

deploy-mainnet:
	cd contracts && npx hardhat run scripts/deploy.ts --network base

verify:
	cd contracts && npx hardhat verify --network base <contractAddress> "<constructorArgs>"



.PHONY: all prod dev stop down front frontp back cleardb cleara cleard logs test deploy-testnet deploy-mainnet verify