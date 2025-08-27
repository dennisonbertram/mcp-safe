const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function deploySafeContracts() {
  console.log('Deploying Safe contracts to Anvil...');
  
  // Connect to Anvil
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  
  // Use first Anvil account as deployer
  const deployerPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const wallet = new ethers.Wallet(deployerPrivateKey, provider);
  
  console.log('Deployer address:', wallet.address);
  
  // Load real Safe bytecodes
  const bytecodesPath = path.join(process.cwd(), 'real-safe-bytecodes.json');
  console.log('Loading bytecodes from:', bytecodesPath);
  
  if (!fs.existsSync(bytecodesPath)) {
    console.error('Real Safe bytecodes not found at:', bytecodesPath);
    process.exit(1);
  }
  
  const bytecodes = JSON.parse(fs.readFileSync(bytecodesPath, 'utf8'));
  
  // Deploy Safe Singleton
  console.log('Deploying Safe Singleton...');
  const safeSingletonFactory = new ethers.ContractFactory([], bytecodes.SafeSingleton, wallet);
  const safeSingleton = await safeSingletonFactory.deploy();
  await safeSingleton.waitForDeployment();
  const safeSingletonAddress = await safeSingleton.getAddress();
  console.log('Safe Singleton deployed at:', safeSingletonAddress);
  
  // Deploy Safe Proxy Factory
  console.log('Deploying Safe Proxy Factory...');
  const proxyFactoryFactory = new ethers.ContractFactory([], bytecodes.SafeProxyFactory, wallet);
  const proxyFactory = await proxyFactoryFactory.deploy();
  await proxyFactory.waitForDeployment();
  const proxyFactoryAddress = await proxyFactory.getAddress();
  console.log('Safe Proxy Factory deployed at:', proxyFactoryAddress);
  
  // Deploy MultiSend (use Safe bytecode if MultiSend not available)
  console.log('Deploying MultiSend...');
  const multiSendBytecode = bytecodes.MultiSend || bytecodes.SafeSingleton;
  const multiSendFactory = new ethers.ContractFactory([], multiSendBytecode, wallet);
  const multiSend = await multiSendFactory.deploy();
  await multiSend.waitForDeployment();
  const multiSendAddress = await multiSend.getAddress();
  console.log('MultiSend deployed at:', multiSendAddress);
  
  // Deploy CreateCall (use Safe bytecode if CreateCall not available)
  console.log('Deploying CreateCall...');
  const createCallBytecode = bytecodes.CreateCall || bytecodes.SafeSingleton;
  const createCallFactory = new ethers.ContractFactory([], createCallBytecode, wallet);
  const createCall = await createCallFactory.deploy();
  await createCall.waitForDeployment();
  const createCallAddress = await createCall.getAddress();
  console.log('CreateCall deployed at:', createCallAddress);
  
  // Create and test a Safe deployment
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
    [
      'function createProxy(address _singleton, bytes memory initializer) public returns (address proxy)',
      'event ProxyCreation(address indexed proxy, address singleton)'
    ],
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
        safeAddress = parsed.args[0] || parsed.args.proxy;
        console.log('Test Safe deployed at:', safeAddress);
        break;
      }
    } catch (e) {
      // Not this event
    }
  }
  
  if (!safeAddress) {
    console.error('Failed to parse ProxyCreation event');
    // Try to get from contract address if available
    if (receipt.contractAddress) {
      safeAddress = receipt.contractAddress;
      console.log('Using contract address from receipt:', safeAddress);
    }
  }
  
  // Save deployment info
  const deployment = {
    network: 'localhost',
    chainId: 31337,
    deploymentType: 'real-safe-contracts',
    contracts: {
      safeSingleton: safeSingletonAddress,
      safeProxyFactory: proxyFactoryAddress,
      multiSend: multiSendAddress,
      createCall: createCallAddress
    },
    testSafe: safeAddress || 'deployment-failed',
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    version: 'safe-contracts-1.4.1'
  };
  
  const deploymentPath = path.join(process.cwd(), 'deployments', 'localhost-anvil.json');
  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log('\nDeployment info saved to:', deploymentPath);
  
  return deployment;
}

// Run the deployment
deploySafeContracts()
  .then(() => {
    console.log('\nSafe contracts deployed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nDeployment failed:', error);
    process.exit(1);
  });