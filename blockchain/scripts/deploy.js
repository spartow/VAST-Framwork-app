const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Deploying VAST Blockchain contracts...');

  // Deploy RuleRegistry
  const RuleRegistry = await hre.ethers.getContractFactory('RuleRegistry');
  const ruleRegistry = await RuleRegistry.deploy();
  await ruleRegistry.waitForDeployment();
  const ruleRegistryAddress = await ruleRegistry.getAddress();
  console.log('RuleRegistry deployed to:', ruleRegistryAddress);

  // Deploy AnchorRegistry
  const AnchorRegistry = await hre.ethers.getContractFactory('AnchorRegistry');
  const anchorRegistry = await AnchorRegistry.deploy();
  await anchorRegistry.waitForDeployment();
  const anchorRegistryAddress = await anchorRegistry.getAddress();
  console.log('AnchorRegistry deployed to:', anchorRegistryAddress);

  // Register default rule
  const defaultRid = 'vast-default-rules-v1';
  const defaultHash = hre.ethers.keccak256(
    hre.ethers.toUtf8Bytes('vast-default-rules-v1-init')
  );
  
  await ruleRegistry.registerRule(
    defaultRid,
    defaultHash,
    false, // not locked
    true,  // mutable
    2      // threshold
  );
  console.log('Default rule registered:', defaultRid);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployedAt: new Date().toISOString(),
    contracts: {
      RuleRegistry: ruleRegistryAddress,
      AnchorRegistry: anchorRegistryAddress,
    },
    defaultRule: defaultRid,
  };

  const deployedPath = path.join(__dirname, '..', 'deployed.json');
  fs.writeFileSync(deployedPath, JSON.stringify(deploymentInfo, null, 2));
  console.log('Deployment info saved to:', deployedPath);

  // Also save to src for app consumption
  const srcDeployedPath = path.join(
    __dirname, 
    '..', 
    '..', 
    'src', 
    'core', 
    'blockchain', 
    'deployed.json'
  );
  fs.writeFileSync(srcDeployedPath, JSON.stringify(deploymentInfo, null, 2));
  console.log('Deployment info copied to src:', srcDeployedPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
