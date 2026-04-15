#!/bin/bash
set -e

echo "Deploying and initializing all contracts with your Freighter Wallet as Admin..."

export ADMIN_ADDR="GCRA6G5ZLEKWNFFN3LP2GS2KXZ74C7H2P5AIKOMD42KYNB3IJMP4CH52"
export USDC="CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA"

cd /Users/macbook/reliefmesh/contracts

# Build all contracts
echo "Compiling..."
stellar contract build

# Deploy all contracts
echo "Deploying Victim Registry..."
VR_ID=$(stellar contract deploy --wasm target/wasm32v1-none/release/victim_registry.wasm --source deployer --network testnet)
echo "VR_ID = $VR_ID"

echo "Deploying Shopkeeper Registry..."
SR_ID=$(stellar contract deploy --wasm target/wasm32v1-none/release/shopkeeper_registry.wasm --source deployer --network testnet)
echo "SR_ID = $SR_ID"

echo "Deploying Clawback Controller..."
CC_ID=$(stellar contract deploy --wasm target/wasm32v1-none/release/clawback_controller.wasm --source deployer --network testnet)
echo "CC_ID = $CC_ID"

echo "Deploying Relief Pool..."
RP_ID=$(stellar contract deploy --wasm target/wasm32v1-none/release/relief_pool.wasm --source deployer --network testnet)
echo "RP_ID = $RP_ID"

# Initialize all
echo "Initializing Victim Registry..."
stellar contract invoke --id $VR_ID --source deployer --network testnet -- initialize --admin $ADMIN_ADDR

echo "Initializing Shopkeeper Registry..."
stellar contract invoke --id $SR_ID --source deployer --network testnet -- initialize --admin $ADMIN_ADDR

echo "Initializing Clawback Controller..."
stellar contract invoke --id $CC_ID --source deployer --network testnet -- initialize --admin $ADMIN_ADDR --token_address $USDC

echo "Initializing Relief Pool..."
stellar contract invoke --id $RP_ID --source deployer --network testnet -- initialize --admin $ADMIN_ADDR --token_address $USDC --victim_registry $VR_ID --shopkeeper_registry $SR_ID --clawback_controller $CC_ID

# Update frontend .env.local safely
echo "Updating ../frontend/.env.local..."
sed -i '' "s/NEXT_PUBLIC_VICTIM_REGISTRY_CONTRACT_ID=.*/NEXT_PUBLIC_VICTIM_REGISTRY_CONTRACT_ID=$VR_ID/" ../frontend/.env.local
sed -i '' "s/NEXT_PUBLIC_SHOPKEEPER_REGISTRY_CONTRACT_ID=.*/NEXT_PUBLIC_SHOPKEEPER_REGISTRY_CONTRACT_ID=$SR_ID/" ../frontend/.env.local
sed -i '' "s/NEXT_PUBLIC_CLAWBACK_CONTROLLER_CONTRACT_ID=.*/NEXT_PUBLIC_CLAWBACK_CONTROLLER_CONTRACT_ID=$CC_ID/" ../frontend/.env.local
sed -i '' "s/NEXT_PUBLIC_RELIEF_POOL_CONTRACT_ID=.*/NEXT_PUBLIC_RELIEF_POOL_CONTRACT_ID=$RP_ID/" ../frontend/.env.local

echo "Done! All contracts deployed and mapped to your Freighter wallet."
