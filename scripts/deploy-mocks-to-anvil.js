const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function deployMockSafeContracts() {
  console.log('Deploying Mock Safe contracts to Anvil...');
  
  // Connect to Anvil
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  
  // Use first Anvil account as deployer
  const deployerPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const wallet = new ethers.Wallet(deployerPrivateKey, provider);
  
  console.log('Deployer address:', wallet.address);
  
  // Load compiled mock contracts
  const mockSafePath = path.join(process.cwd(), 'artifacts/contracts/SafeMockContracts.sol');
  
  // Read MockSafeSingleton artifact
  const safeSingletonArtifact = JSON.parse(
    fs.readFileSync(path.join(mockSafePath, 'MockSafeSingleton.json'), 'utf8')
  );
  
  // Read MockSafeProxyFactory artifact
  const proxyFactoryArtifact = JSON.parse(
    fs.readFileSync(path.join(mockSafePath, 'MockSafeProxyFactory.json'), 'utf8')
  );
  
  // Deploy Safe Singleton
  console.log('Deploying MockSafeSingleton...');
  const safeSingletonFactory = new ethers.ContractFactory(
    safeSingletonArtifact.abi,
    safeSingletonArtifact.bytecode,
    wallet
  );
  const safeSingleton = await safeSingletonFactory.deploy();
  await safeSingleton.waitForDeployment();
  const safeSingletonAddress = await safeSingleton.getAddress();
  console.log('MockSafeSingleton deployed at:', safeSingletonAddress);
  
  // Deploy Safe Proxy Factory
  console.log('Deploying MockSafeProxyFactory...');
  const proxyFactoryFactory = new ethers.ContractFactory(
    proxyFactoryArtifact.abi,
    proxyFactoryArtifact.bytecode,
    wallet
  );
  const proxyFactory = await proxyFactoryFactory.deploy(safeSingletonAddress);
  await proxyFactory.waitForDeployment();
  const proxyFactoryAddress = await proxyFactory.getAddress();
  console.log('MockSafeProxyFactory deployed at:', proxyFactoryAddress);
  
  // Deploy test Safe through factory
  console.log('\nDeploying test Safe...');
  const owners = [wallet.address];
  const threshold = 1;
  
  // Create initializer data for Safe setup
  const safeSingletonInterface = new ethers.Interface([
    'function setup(address[] calldata _owners, uint256 _threshold, address to, bytes calldata data, address fallbackHandler, address paymentToken, uint256 payment, address payable paymentReceiver) external'
  ]);
  
  const initializerData = safeSingletonInterface.encodeFunctionData('setup', [
    owners,
    threshold,
    '0x0000000000000000000000000000000000000000', // to
    '0x', // data
    '0x0000000000000000000000000000000000000000', // fallbackHandler
    '0x0000000000000000000000000000000000000000', // paymentToken
    0, // payment
    '0x0000000000000000000000000000000000000000' // paymentReceiver
  ]);
  
  // Deploy Safe proxy through factory
  const proxyFactoryContract = new ethers.Contract(
    proxyFactoryAddress,
    proxyFactoryArtifact.abi,
    wallet
  );
  
  console.log('Creating Safe proxy...');
  const tx = await proxyFactoryContract.createProxy(safeSingletonAddress, initializerData);
  const receipt = await tx.wait();
  console.log('Transaction hash:', receipt.hash);
  
  // Parse ProxyCreation event to get Safe address
  let safeAddress;
  for (const log of receipt.logs) {
    try {
      const parsed = proxyFactoryContract.interface.parseLog({
        topics: log.topics,
        data: log.data
      });
      
      if (parsed && parsed.name === 'ProxyCreation') {
        safeAddress = parsed.args.proxy || parsed.args[0];
        console.log('Test Safe deployed at:', safeAddress);
        break;
      }
    } catch (e) {
      // Not this event
    }
  }
  
  if (!safeAddress && receipt.contractAddress) {
    safeAddress = receipt.contractAddress;
    console.log('Using contract address from receipt:', safeAddress);
  }
  
  // Save deployment info
  const deployment = {
    network: 'localhost',
    chainId: 31337,
    deploymentType: 'mock-safe-contracts',
    contracts: {
      safeSingleton: safeSingletonAddress,
      safeProxyFactory: proxyFactoryAddress,
      multiSend: safeSingletonAddress, // Using singleton as placeholder
      createCall: safeSingletonAddress  // Using singleton as placeholder
    },
    testSafe: safeAddress || 'deployment-failed',
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    version: 'mock-safe-v1.0.0'
  };
  
  const deploymentPath = path.join(process.cwd(), 'deployments', 'localhost-anvil.json');
  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log('\nDeployment info saved to:', deploymentPath);
  
  // Verify the deployment
  console.log('\nVerifying deployment...');
  const code = await provider.getCode(safeSingletonAddress);
  console.log('SafeSingleton has code:', code !== '0x' ? 'YES' : 'NO');
  
  const factoryCode = await provider.getCode(proxyFactoryAddress);
  console.log('ProxyFactory has code:', factoryCode !== '0x' ? 'YES' : 'NO');
  
  if (safeAddress) {
    const safeCode = await provider.getCode(safeAddress);
    console.log('Test Safe has code:', safeCode !== '0x' ? 'YES' : 'NO');
  }
  
  return deployment;
}

// Run the deployment
deployMockSafeContracts()
  .then(() => {
    console.log('\nMock Safe contracts deployed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nDeployment failed:', error);
    process.exit(1);
  });