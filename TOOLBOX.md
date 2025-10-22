







# start services (it won't run any command by default)
docker compose -f docker-compose.dev.yml up -d hardhat-cli
 docker compose -f docker-compose.dev.yml build hardhat-cli --no-cache


 
# open an interactive shell in the hardhat-cli container
docker compose -f docker-compose.dev.yml run --rm hardhat-cli bash

# inside container shell:
npm ci --legacy-peer-deps
npx hardhat compile --show-stack-traces
npx hardhat test --show-stack-traces






