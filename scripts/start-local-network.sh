#!/bin/bash

echo "🚀 Starting local blockchain network..."
echo "Network: Hardhat Local Network"
echo "Chain ID: 31337"
echo "RPC URL: http://127.0.0.1:8545"
echo ""

# Start Hardhat network
npx hardhat node --hostname 0.0.0.0 --port 8545