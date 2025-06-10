const { ethers } = require("hardhat");
const { writeFileSync, mkdirSync } = require("fs");
const { join } = require("path");

/**
 * Deploy mock Safe contracts for local testing
 */
async function main() {
  console.log("Deploying Safe contracts to local network...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy Safe Singleton (Mock version)
  console.log("\n1. Deploying Safe Singleton...");
  const SafeSingleton = await ethers.getContractFactory("MockSafeSingleton");
  const safeSingleton = await SafeSingleton.deploy();
  await safeSingleton.waitForDeployment();
  const singletonAddress = await safeSingleton.getAddress();
  console.log("Safe Singleton deployed to:", singletonAddress);

  // Deploy Safe Proxy Factory
  console.log("\n2. Deploying Safe Proxy Factory...");
  const SafeProxyFactory = await ethers.getContractFactory("MockSafeProxyFactory");
  const safeProxyFactory = await SafeProxyFactory.deploy(singletonAddress);
  await safeProxyFactory.waitForDeployment();
  const factoryAddress = await safeProxyFactory.getAddress();
  console.log("Safe Proxy Factory deployed to:", factoryAddress);

  // Verify deployments
  console.log("\n3. Verifying deployments...");
  const singletonContract = await ethers.getContractAt("MockSafeSingleton", singletonAddress);
  const name = await singletonContract.NAME();
  const version = await singletonContract.VERSION();
  console.log("Safe Singleton verified - Name:", name, "Version:", version);

  const factoryContract = await ethers.getContractAt("MockSafeProxyFactory", factoryAddress);
  const factorySingleton = await factoryContract.singleton();
  console.log("Safe Factory verified - Singleton:", factorySingleton);

  // Save deployment addresses
  const deployment = {
    network: "localhost",
    chainId: 31337,
    contracts: {
      safeSingleton: singletonAddress,
      safeProxyFactory: factoryAddress,
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  const deploymentPath = join(process.cwd(), "deployments", "localhost.json");
  try {
    mkdirSync(join(process.cwd(), "deployments"), { recursive: true });
  } catch (e) {
    // Directory already exists
  }
  writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  
  console.log("\n✅ Deployment complete!");
  console.log("Deployment info saved to:", deploymentPath);
  console.log("\nContract addresses:");
  console.log("- Safe Singleton:", singletonAddress);
  console.log("- Safe Proxy Factory:", factoryAddress);
  
  // Test Safe creation
  console.log("\n4. Testing Safe creation...");
  const testOwners = [deployer.address];
  const testThreshold = 1;
  
  // Create setup data
  const setupData = singletonContract.interface.encodeFunctionData("setup", [
    testOwners,
    testThreshold,
    ethers.ZeroAddress, // to
    "0x", // data
    ethers.ZeroAddress, // fallbackHandler
    ethers.ZeroAddress, // paymentToken
    0, // payment
    ethers.ZeroAddress, // paymentReceiver
  ]);

  // Create proxy
  const tx = await factoryContract.createProxy(singletonAddress, setupData);
  const receipt = await tx.wait();
  
  // Find the proxy creation event
  const event = receipt.logs.find((log) => {
    try {
      const decoded = factoryContract.interface.parseLog(log);
      return decoded && decoded.name === "ProxyCreation";
    } catch {
      return false;
    }
  });

  if (event) {
    const decoded = factoryContract.interface.parseLog(event);
    const proxyAddress = decoded.args.proxy;
    console.log("✅ Test Safe created at:", proxyAddress);
    
    // Verify the Safe
    const safeProxy = await ethers.getContractAt("MockSafeSingleton", proxyAddress);
    const owners = await safeProxy.getOwners();
    const threshold = await safeProxy.getThreshold();
    console.log("Safe owners:", owners);
    console.log("Safe threshold:", threshold.toString());
  }

  console.log("\n🎉 Local Safe deployment ready for testing!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });