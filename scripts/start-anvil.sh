#!/bin/bash

echo "Starting Anvil local blockchain..."
echo "Chain ID: 31337"
echo "RPC URL: http://127.0.0.1:8545"
echo ""

# Check if anvil is installed
if ! command -v anvil &> /dev/null; then
    echo "Anvil not found. Installing Foundry..."
    curl -L https://foundry.paradigm.xyz | bash
    # Source the foundryup script
    source ~/.foundry/bin/foundryup
fi

# Start Anvil with specific configuration
anvil \
    --host 0.0.0.0 \
    --port 8545 \
    --chain-id 31337 \
    --accounts 10 \
    --balance 10000 \
    --block-time 1 \
    --gas-limit 30000000