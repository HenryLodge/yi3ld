const { ethers } = require('ethers');
require('dotenv').config();

async function findAddresses() {
  console.log('\n🔍 Finding Base Sepolia Aave Addresses\n');
  
  const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL);
  
  // Pool Addresses Provider (confirmed from search results)
  const PROVIDER_ADDRESS = '0xe20fCBdBfFC4Dd138cE8b2E6FBb6CB49777ad64D';
  
  const PROVIDER_ABI = [
    "function getPool() view returns (address)",
    "function getPoolDataProvider() view returns (address)",
  ];
  
  try {
    console.log('Pool Addresses Provider:', PROVIDER_ADDRESS);
    
    const provider_contract = new ethers.Contract(PROVIDER_ADDRESS, PROVIDER_ABI, provider);
    
    // Get the actual Pool address
    console.log('\n🔵 Querying Pool address...');
    const poolAddress = await provider_contract.getPool();
    console.log('✅ Pool Address:', poolAddress);
    
    // Get Data Provider
    console.log('\n🔵 Querying Data Provider...');
    const dataProvider = await provider_contract.getPoolDataProvider();
    console.log('✅ Data Provider:', dataProvider);
    
    // Now query the Data Provider for reserve data
    const DATA_PROVIDER_ABI = [
      "function getReserveTokensAddresses(address asset) view returns (address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress)"
    ];
    
    // Try common USDC addresses on Base Sepolia
    const POSSIBLE_USDC_ADDRESSES = [
      '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
    ];
    
    const dataProviderContract = new ethers.Contract(dataProvider, DATA_PROVIDER_ABI, provider);
    
    console.log('\n🔵 Looking for USDC reserve...');
    
    for (const usdcAddress of POSSIBLE_USDC_ADDRESSES) {
      try {
        console.log(`\nTrying USDC at: ${usdcAddress}`);
        const tokens = await dataProviderContract.getReserveTokensAddresses(usdcAddress);
        
        if (tokens.aTokenAddress !== ethers.ZeroAddress) {
          console.log('✅ FOUND USDC RESERVE!');
          console.log('   USDC Address:', usdcAddress);
          console.log('   aUSDC Address:', tokens.aTokenAddress);
          console.log('   Stable Debt:', tokens.stableDebtTokenAddress);
          console.log('   Variable Debt:', tokens.variableDebtTokenAddress);
          
          console.log('\n📋 SUMMARY - Use These Addresses:');
          console.log('=' .repeat(60));
          console.log(`AAVE_POOL_ADDRESS="${poolAddress}"`);
          console.log(`USDC_ADDRESS="${usdcAddress}"`);
          console.log(`AUSDC_ADDRESS="${tokens.aTokenAddress}"`);
          console.log('=' .repeat(60));
          
          break;
        }
      } catch (error) {
        console.log(`   ❌ Not found at this address`);
      }
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

findAddresses();