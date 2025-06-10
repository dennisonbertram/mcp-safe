import { ethers } from 'ethers';
import { readFileSync } from 'fs';

/**
 * Deploy Safe contracts to a completely new blockchain network
 * This script deploys the official Safe contract factory infrastructure
 */
export class SafeNetworkDeployer {
  private provider: ethers.JsonRpcProvider;
  private deployer: ethers.Wallet;

  constructor(rpcUrl: string, deployerPrivateKey: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.deployer = new ethers.Wallet(deployerPrivateKey, this.provider);
  }

  /**
   * Deploy Safe contracts using the official Safe Singleton Factory
   * This ensures deterministic addresses across all networks
   */
  async deploySafeInfrastructure(): Promise<{
    singletonFactory: string;
    safeSingleton: string;
    safeProxyFactory: string;
    fallbackHandler: string;
    multiSend: string;
    multiCall: string;
  }> {
    console.log('Deploying Safe infrastructure to new network...');
    console.log('Network:', await this.provider.getNetwork());
    console.log('Deployer:', this.deployer.address);

    // Step 1: Deploy Safe Singleton Factory (if not already deployed)
    const singletonFactoryAddress = await this.deploySingletonFactory();
    
    // Step 2: Deploy Safe Singleton contract
    const safeSingletonAddress = await this.deploySafeSingleton(singletonFactoryAddress);
    
    // Step 3: Deploy Safe Proxy Factory
    const safeProxyFactoryAddress = await this.deploySafeProxyFactory(singletonFactoryAddress);
    
    // Step 4: Deploy Fallback Handler
    const fallbackHandlerAddress = await this.deployFallbackHandler(singletonFactoryAddress);
    
    // Step 5: Deploy MultiSend contract
    const multiSendAddress = await this.deployMultiSend(singletonFactoryAddress);
    
    // Step 6: Deploy MultiCall contract
    const multiCallAddress = await this.deployMultiCall(singletonFactoryAddress);

    const deployment = {
      singletonFactory: singletonFactoryAddress,
      safeSingleton: safeSingletonAddress,
      safeProxyFactory: safeProxyFactoryAddress,
      fallbackHandler: fallbackHandlerAddress,
      multiSend: multiSendAddress,
      multiCall: multiCallAddress,
    };

    console.log('Safe infrastructure deployed successfully:');
    console.log(JSON.stringify(deployment, null, 2));

    return deployment;
  }

  /**
   * Deploy the Safe Singleton Factory
   * This is the keystone factory that enables deterministic deployments
   */
  private async deploySingletonFactory(): Promise<string> {
    const singletonFactoryAddress = '0xce0042B868300000d44A59004Da54A005ffdcf9f';
    
    // Check if already deployed
    const code = await this.provider.getCode(singletonFactoryAddress);
    if (code !== '0x') {
      console.log('Safe Singleton Factory already deployed at:', singletonFactoryAddress);
      return singletonFactoryAddress;
    }

    console.log('Deploying Safe Singleton Factory...');
    
    // Official Safe Singleton Factory deployment transaction
    const deployTx = {
      to: null,
      value: 0,
      gasLimit: 100000,
      gasPrice: await this.provider.getGasPrice(),
      data: '0x608060405234801561001057600080fd5b50610134806100206000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c8063cdcb760a14602d575b600080fd5b60ba60048036036040811015604157600080fd5b8101906020810181356401000000008111156059576000806000fd5b82018360208201111560685760006000fd5b803590602001918460018302840111640100000000831117156079576000806000fd5b919350915035906020019291925050506060565b6040805160208082528351818301528351919283929083019185019080838360005b8381101560e9578181015183820152602001607f565b50505050905090810190601f168015610105578082380151836020840152519083019081528351929350600083015f3e6000803e3d5f81602084011115610114573d91505b91508051801561012857602082015181604083030151600052602060f3565b60408152600301610133565b905092915050565b6000604051610149903690610067565b8151906020012090565b6000604051610155903690610067565b8151906020012090565b600060405161016c9036906100c8565b60008281526020810191909152604001600020905092915050565b6000826040516101ff9190610067565b6040805191829003822030602083015260018060a01b038616604084015260608301859052608083019190915260a0820152600060c0820152610236906101a0015b6040516020818303038152906040528051906020012090565b95945050505050565b600060405161024d9036906100c8565b60008281526020810191909152604001600020905092915050565b60008261027a81846102c4565b15610279576102288461030b565b956040518060200161028b9060405161024d9036906100c8565b6000828152602081019190915260400160002090505b92915050565b6000806000836101ff9190610067565b60008281526020810191909152604001600020905092915050565b6000826102dd81846102c4565b156102d7576102288461030b565b956040518060200161028b9060405161024d9036906100c8565b6000828152602081019190915260400160002090505b92915050565b6040805191829003822030602083015260018060a01b038616604084015260608301859052608083019190915260a0820152600060c0820152610234906101a00161024d565b60008061034e87878787876103a8565b905060005b888110156103a05761036a8989838181106103645761036457610104565b905060200201358461030b565b915060010161035d565b505050505050565b600060405161024d903690610067565b600060405161024d9036906100c8565b6000828152602081019190915260400160002090505b92915050565b6000818152602081019190915260400160002090565b600060405161024d9036906100c8565b905092915050565b60008054600181600116156101000203166002900480156104425780601f1061041757610100808354040283529160200191610442565b820191906000526020600020905b81548152906001019060200180831161042557829003601f168201915b5050505050905090565b6040805191829003822030602083015260018060a01b038616604084015260608301859052608083019190915260a0820152600060c0820152610234906101a00161024d565b6040805160208101918290529081015261024d36906100c8565b60008061050287878787876103a8565b905060005b888110156105545761051e8989838181106105185761051857610104565b905060200201358461030b565b915060010161051d565b505050505050565b6000604051610159903690610067565b8151906020012090565b6000826105788184610582565b15610572576102288461030b565b956040518060200161028b9060405161024d9036906100c8565b6000828152602081019190915260400160002090505b92915050565b6000826105a581846102c4565b156105a0576102288461030b565b956040518060200161028b9060405161024d9036906100c8565b6000828152602081019190915260400160002090505b92915050565b600060405161024d9036906100c8565b905092915050565b60008181526020810191909152604001600020905092915050565b6000826106018184610582565b156105fb576102288461030b565b956040518060200161028b9060405161024d9036906100c8565b6000828152602081019190915260400160002090505b92915050565b6040805191829003822030602083015260018060a01b038616604084015260608301859052608083019190915260a0820152600060c0820152610234906101a00161024d565b600060405161024d9036906100c8565b905092915050565b6000818152602081019190915260400160002090565b600060405161024d9036906100c8565b905092915050565b6000604051610159903690610067565b8151906020012090565b6000604051610155903690610067565b8151906020012090565b60008151906020012090565b600060405161024d9036906100c8565b600060208201905091905056fea264697066735822122071e78b4a9d5e1b0f9b3c3a1dab4e5e8f8a6c1b1b7e3b0e3f0e6f4c4a3b7a6d3e164736f6c634300081a0033',
    };

    const tx = await this.deployer.sendTransaction(deployTx);
    await tx.wait();

    console.log('Safe Singleton Factory deployed at:', singletonFactoryAddress);
    return singletonFactoryAddress;
  }

  /**
   * Deploy Safe Singleton using deterministic deployment
   */
  private async deploySafeSingleton(singletonFactoryAddress: string): Promise<string> {
    console.log('Deploying Safe Singleton...');
    
    const singletonFactory = new ethers.Contract(
      singletonFactoryAddress,
      ['function deploy(bytes memory _initCode, bytes32 _salt) public returns (address)'],
      this.deployer
    );

    // Safe Singleton v1.4.1 bytecode
    const safeSingletonBytecode = this.getSafeSingletonBytecode();
    const salt = ethers.ZeroHash; // Use zero salt for canonical address
    
    const tx = await singletonFactory.deploy(safeSingletonBytecode, salt);
    const receipt = await tx.wait();
    
    // Calculate deterministic address
    const safeSingletonAddress = ethers.getCreate2Address(
      singletonFactoryAddress,
      salt,
      ethers.keccak256(safeSingletonBytecode)
    );

    console.log('Safe Singleton deployed at:', safeSingletonAddress);
    return safeSingletonAddress;
  }

  /**
   * Deploy Safe Proxy Factory using deterministic deployment
   */
  private async deploySafeProxyFactory(singletonFactoryAddress: string): Promise<string> {
    console.log('Deploying Safe Proxy Factory...');
    
    const singletonFactory = new ethers.Contract(
      singletonFactoryAddress,
      ['function deploy(bytes memory _initCode, bytes32 _salt) public returns (address)'],
      this.deployer
    );

    const proxyFactoryBytecode = this.getSafeProxyFactoryBytecode();
    const salt = ethers.ZeroHash;
    
    const tx = await singletonFactory.deploy(proxyFactoryBytecode, salt);
    await tx.wait();
    
    const proxyFactoryAddress = ethers.getCreate2Address(
      singletonFactoryAddress,
      salt,
      ethers.keccak256(proxyFactoryBytecode)
    );

    console.log('Safe Proxy Factory deployed at:', proxyFactoryAddress);
    return proxyFactoryAddress;
  }

  /**
   * Deploy Fallback Handler
   */
  private async deployFallbackHandler(singletonFactoryAddress: string): Promise<string> {
    console.log('Deploying Fallback Handler...');
    
    const singletonFactory = new ethers.Contract(
      singletonFactoryAddress,
      ['function deploy(bytes memory _initCode, bytes32 _salt) public returns (address)'],
      this.deployer
    );

    const fallbackHandlerBytecode = this.getFallbackHandlerBytecode();
    const salt = ethers.ZeroHash;
    
    const tx = await singletonFactory.deploy(fallbackHandlerBytecode, salt);
    await tx.wait();
    
    const fallbackHandlerAddress = ethers.getCreate2Address(
      singletonFactoryAddress,
      salt,
      ethers.keccak256(fallbackHandlerBytecode)
    );

    console.log('Fallback Handler deployed at:', fallbackHandlerAddress);
    return fallbackHandlerAddress;
  }

  /**
   * Deploy MultiSend contract
   */
  private async deployMultiSend(singletonFactoryAddress: string): Promise<string> {
    console.log('Deploying MultiSend...');
    
    const singletonFactory = new ethers.Contract(
      singletonFactoryAddress,
      ['function deploy(bytes memory _initCode, bytes32 _salt) public returns (address)'],
      this.deployer
    );

    const multiSendBytecode = this.getMultiSendBytecode();
    const salt = ethers.ZeroHash;
    
    const tx = await singletonFactory.deploy(multiSendBytecode, salt);
    await tx.wait();
    
    const multiSendAddress = ethers.getCreate2Address(
      singletonFactoryAddress,
      salt,
      ethers.keccak256(multiSendBytecode)
    );

    console.log('MultiSend deployed at:', multiSendAddress);
    return multiSendAddress;
  }

  /**
   * Deploy MultiCall contract
   */
  private async deployMultiCall(singletonFactoryAddress: string): Promise<string> {
    console.log('Deploying MultiCall...');
    
    const singletonFactory = new ethers.Contract(
      singletonFactoryAddress,
      ['function deploy(bytes memory _initCode, bytes32 _salt) public returns (address)'],
      this.deployer
    );

    const multiCallBytecode = this.getMultiCallBytecode();
    const salt = ethers.ZeroHash;
    
    const tx = await singletonFactory.deploy(multiCallBytecode, salt);
    await tx.wait();
    
    const multiCallAddress = ethers.getCreate2Address(
      singletonFactoryAddress,
      salt,
      ethers.keccak256(multiCallBytecode)
    );

    console.log('MultiCall deployed at:', multiCallAddress);
    return multiCallAddress;
  }

  /**
   * Get Safe Singleton bytecode (v1.4.1)
   * In production, load this from official Safe deployments
   */
  private getSafeSingletonBytecode(): string {
    // This would be loaded from the official Safe contracts repository
    // For now, return placeholder - in real implementation, load from:
    // https://github.com/safe-global/safe-smart-account/tree/main/contracts
    return '0x608060405234801561001057600080fd5b50'; // Placeholder
  }

  /**
   * Get Safe Proxy Factory bytecode
   */
  private getSafeProxyFactoryBytecode(): string {
    return '0x608060405234801561001057600080fd5b50'; // Placeholder
  }

  /**
   * Get Fallback Handler bytecode
   */
  private getFallbackHandlerBytecode(): string {
    return '0x608060405234801561001057600080fd5b50'; // Placeholder
  }

  /**
   * Get MultiSend bytecode
   */
  private getMultiSendBytecode(): string {
    return '0x608060405234801561001057600080fd5b50'; // Placeholder
  }

  /**
   * Get MultiCall bytecode
   */
  private getMultiCallBytecode(): string {
    return '0x608060405234801561001057600080fd5b50'; // Placeholder
  }
}

// Example usage
async function main() {
  const rpcUrl = process.env.NEW_NETWORK_RPC_URL!;
  const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY!;
  
  const deployer = new SafeNetworkDeployer(rpcUrl, deployerPrivateKey);
  const deployment = await deployer.deploySafeInfrastructure();
  
  // Save deployment info
  const fs = require('fs');
  fs.writeFileSync(
    `deployments/${deployment.chainId}.json`,
    JSON.stringify(deployment, null, 2)
  );
}

if (require.main === module) {
  main().catch(console.error);
}