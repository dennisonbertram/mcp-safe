# Safe Documentation - Batch 1

This file contains the initial crawled documentation from docs.safe.global

## Safenet Protocol

The Safenet Protocol consists of smart contracts that enable trustless communication between all parties. Both contract variables and events serve as communication channels.

## Safe{Core} SDK Overview

The Safe{Core} SDK aims to bring Account Abstraction to life by integrating Safe with different third parties. The SDK groups functionality into four different kits:

### Starter Kit
- Starting point for interacting with Safe smart accounts
- Handles user operations, multi-signature transactions, and off-chain/on-chain messages
- Most simplified way to deploy accounts and handle Safe transaction flow

### Protocol Kit
- Enables creation of new Safe accounts
- Updates configuration and signs/executes transactions
- Modular and customizable smart contract accounts with battle-tested security

### API Kit
- Interacts with Safe Transaction Service API
- Helps share transactions among signers
- Gets information from Safe account (configuration, transaction history)

### Relay Kit
- Enables transaction relaying with Safe
- Allows users to pay transaction fees from their Safe account
- Supports ERC-4337, gas-less experiences using Gelato, sponsored transactions

## Smart Account References

### Owner Management
- `addOwnerWithThreshold(address owner, uint256 _threshold)`: Adds owner and updates threshold
- Events: `AddedOwner`, `ChangedThreshold`

### Signature Management  
- `approveHash(bytes32 hashToApprove)`: Marks hash as approved for pre-approved signatures
- Event: `ApproveHash`

### Guards
- `setModuleGuard(address moduleGuard)`: Set Module Guard for transaction checking
- Event: `ChangedModuleGuard`

## ERC-4337 Support

Safe provides comprehensive ERC-4337 support through:
- Safe4337Module for user operations
- Integration with bundlers and paymasters
- Sponsorship capabilities
- Compatible with permissionless.js library

## ERC-7579 Compatibility

Safe7579 Adapter makes Safe Smart Accounts compliant with ERC-7579:
- Developed by Rhinestone and Safe
- Provides access to 14 audited modules
- Includes security checks via Rhinestone registry
- Functions as both Safe Module and Fallback Handler

## Developer Tools

- Magic Signer integration
- Dynamic signer support  
- Passkey authentication
- ModuleKit for building/testing modules
- ModuleSDK for TypeScript applications
- ModuleStore for module distribution

## Security & Audits

Multiple comprehensive audits for all versions:
- Safe v1.4.0, v1.3.0, v1.2.0, v1.1.0, v1.0.0, v0.0.1
- Allowance Module v0.1.0
- Bug bounty program available

This represents initial documentation from the comprehensive Safe ecosystem crawl.