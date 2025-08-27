import { ethers, JsonRpcProvider, Contract, Wallet } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

async function deploySafeContracts() {
  console.log('Deploying Safe contracts to Anvil...');
  
  // Connect to Anvil
  const provider = new JsonRpcProvider('http://127.0.0.1:8545');
  
  // Use first Anvil account as deployer
  const deployerPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const wallet = new Wallet(deployerPrivateKey, provider);
  
  console.log('Deployer address:', wallet.address);
  
  // Load real Safe bytecodes
  const bytecodesPath = path.join(__dirname, '../real-safe-bytecodes.json');
  let bytecodes: any;
  
  if (fs.existsSync(bytecodesPath)) {
    bytecodes = JSON.parse(fs.readFileSync(bytecodesPath, 'utf8'));
  } else {
    console.error('Real Safe bytecodes not found. Run: npm run get-safe-bytecode');
    process.exit(1);
  }
  
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
  
  // Deploy MultiSend
  console.log('Deploying MultiSend...');
  const multiSendFactory = new ethers.ContractFactory([], bytecodes.MultiSend || bytecodes.SafeSingleton, wallet);
  const multiSend = await multiSendFactory.deploy();
  await multiSend.waitForDeployment();
  const multiSendAddress = await multiSend.getAddress();
  console.log('MultiSend deployed at:', multiSendAddress);
  
  // Deploy CreateCall
  console.log('Deploying CreateCall...');
  const createCallFactory = new ethers.ContractFactory([], bytecodes.CreateCall || bytecodes.SafeSingleton, wallet);
  const createCall = await createCallFactory.deploy();
  await createCall.waitForDeployment();
  const createCallAddress = await createCall.getAddress();
  console.log('CreateCall deployed at:', createCallAddress);
  
  // Create and test a Safe deployment
  console.log('\nDeploying test Safe...');
  const owners = [wallet.address];
  const threshold = 1;
  
  // Create initializer data
  const safeSingletonInterface = new ethers.Interface([
    'function setup(address[] calldata _owners, uint256 _threshold, address to, bytes calldata data, address fallbackHandler, address paymentToken, uint256 payment, address payable paymentReceiver) external'
  ]);
  
  const initializerData = safeSingletonInterface.encodeFunctionData('setup', [
    owners,
    threshold,
    '0x0000000000000000000000000000000000000000',
    '0x',
    '0x0000000000000000000000000000000000000000',
    '0x0000000000000000000000000000000000000000',
    0,
    '0x0000000000000000000000000000000000000000'
  ]);
  
  // Deploy Safe proxy
  const proxyFactoryContract = new Contract(
    proxyFactoryAddress,
    ['function createProxy(address _singleton, bytes memory initializer) public returns (address proxy)'],
    wallet
  );
  
  const createProxyFn = proxyFactoryContract.createProxy;
  if (!createProxyFn) {
    throw new Error('createProxy function not found');
  }
  const tx = await createProxyFn(safeSingletonAddress, initializerData);
  const receipt = await tx.wait();
  
  // Parse ProxyCreation event
  const proxyCreationEvent = receipt.logs.find((log: any) => {
    try {
      const iface = new ethers.Interface(['event ProxyCreation(address indexed proxy, address singleton)']);
      const parsed = iface.parseLog(log);
      return parsed?.name === 'ProxyCreation';
    } catch {
      return false;
    }
  });
  
  if (proxyCreationEvent) {
    const iface = new ethers.Interface(['event ProxyCreation(address indexed proxy, address singleton)']);
    const parsed = iface.parseLog(proxyCreationEvent);
    console.log('Test Safe deployed at:', parsed?.args.proxy);
  } else {
    console.error('ProxyCreation event not found!');
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
    testSafe: proxyCreationEvent ? 
      new ethers.Interface(['event ProxyCreation(address indexed proxy, address singleton)']).parseLog(proxyCreationEvent)?.args.proxy : 
      'deployment-failed',
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    version: 'safe-contracts-1.4.1'
  };
  
  const deploymentPath = path.join(__dirname, '../deployments/localhost-anvil.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log('\nDeployment info saved to:', deploymentPath);
  
  return deployment;
}

// Run if called directly
if (require.main === module) {
  deploySafeContracts()
    .then(() => {
      console.log('Safe contracts deployed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Deployment failed:', error);
      process.exit(1);
    });
}

export { deploySafeContracts };