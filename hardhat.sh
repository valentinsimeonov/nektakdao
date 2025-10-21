#!/bin/bash
# Helper script to run Hardhat commands in Docker container

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

COMPOSE_FILE="docker-compose.dev.yml"
SERVICE="hardhat-cli"

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if docker-compose is available
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

# Function to run hardhat commands
run_hardhat() {
    docker compose -f "$COMPOSE_FILE" run --rm "$SERVICE" "npx hardhat $*"
}

# Function to enter container shell
shell() {
    print_info "Starting interactive shell in $SERVICE container..."
    docker compose -f "$COMPOSE_FILE" run --rm --service-ports "$SERVICE" bash
}

# Function to clean everything
clean_all() {
    print_warn "Cleaning all generated files..."
    run_hardhat clean
    print_info "Cleaning Docker volumes..."
    docker compose -f "$COMPOSE_FILE" down -v
    print_info "Clean complete!"
}

# Main script logic
case "$1" in
    shell|sh|bash)
        shell
        ;;
    clean)
        if [ "$2" == "--all" ] || [ "$2" == "-a" ]; then
            clean_all
        else
            run_hardhat clean
        fi
        ;;
    compile|test|node|run)
        shift
        run_hardhat "$@"
        ;;
    exec)
        shift
        docker compose -f "$COMPOSE_FILE" run --rm "$SERVICE" "$@"
        ;;
    help|--help|-h|"")
        echo "Hardhat Docker Helper Script"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  shell               Enter interactive shell in container"
        echo "  compile             Compile smart contracts"
        echo "  test                Run tests"
        echo "  clean               Clean cache and artifacts"
        echo "  clean --all         Clean everything including Docker volumes"
        echo "  node                Start Hardhat node"
        echo "  run <script>        Run a script"
        echo "  exec <cmd>          Execute arbitrary command in container"
        echo "  help                Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 shell"
        echo "  $0 compile"
        echo "  $0 test"
        echo "  $0 run scripts/deploy.ts"
        echo "  $0 exec npx hardhat --version"
        ;;
    *)
        # Pass through any other hardhat command
        run_hardhat "$@"
        ;;
esac