#!/bin/bash

# Network configuration
NETWORK="testnet"
RPC_URL="https://soroban-testnet.stellar.org"
FRIENDBOT_URL="https://friendbot.stellar.org"

# Admin identity
ADMIN="deployer"

echo "Using identity: $ADMIN"

# Fund the account if needed
ADDRESS=$(stellar keys address $ADMIN)
echo "Address: $ADDRESS"
echo "Funding account via friendbot..."
curl -s -X POST "$FRIENDBOT_URL?addr=$ADDRESS" > /dev/null

# Build contracts optimized
echo "Building optimized contracts..."
stellar contract build --optimize

# Deploy contracts
echo "Deploying Victim Registry..."
VICTIM_REGISTRY_ID=$(stellar contract deploy --wasm target/wasm32v1-none/release/victim_registry.wasm --source $ADMIN --network $NETWORK)
echo "Victim Registry ID: $VICTIM_REGISTRY_ID"

echo "Deploying Shopkeeper Registry..."
SHOPKEEPER_REGISTRY_ID=$(stellar contract deploy --wasm target/wasm32v1-none/release/shopkeeper_registry.wasm --source $ADMIN --network $NETWORK)
echo "Shopkeeper Registry ID: $SHOPKEEPER_REGISTRY_ID"

echo "Deploying Clawback Controller..."
CLAWBACK_CONTROLLER_ID=$(stellar contract deploy --wasm target/wasm32v1-none/release/clawback_controller.wasm --source $ADMIN --network $NETWORK)
echo "Clawback Controller ID: $CLAWBACK_CONTROLLER_ID"

echo "Deploying Relief Pool..."
RELIEF_POOL_ID=$(stellar contract deploy --wasm target/wasm32v1-none/release/relief_pool.wasm --source $ADMIN --network $NETWORK)
echo "Relief Pool ID: $RELIEF_POOL_ID"

# Update .env.local in the parent/frontend directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
ENV_FILE="$SCRIPT_DIR/../frontend/.env.local"

echo "Updating $ENV_FILE..."

cat > "$ENV_FILE" <<EOF
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_VICTIM_REGISTRY_CONTRACT_ID=$VICTIM_REGISTRY_ID
NEXT_PUBLIC_SHOPKEEPER_REGISTRY_CONTRACT_ID=$SHOPKEEPER_REGISTRY_ID
NEXT_PUBLIC_CLAWBACK_CONTROLLER_CONTRACT_ID=$CLAWBACK_CONTROLLER_ID
NEXT_PUBLIC_RELIEF_POOL_CONTRACT_ID=$RELIEF_POOL_ID
NEXT_PUBLIC_USDC_CONTRACT_ID=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
EOF

echo "Deployment complete. Environment updated."
