const { ethers } = require('ethers');
require('dotenv').config();

async function checkBaseAave() {
  console.log('\n🔍 Checking Base Sepolia for Aave\n');
  
  const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL);
  
  // Let's try to find if these contracts exist
  const possiblePoolAddresses = [
    '0xe20fCBdBfFC4Dd138cE8b2E6FBb6CB49777ad64D', // From search
    '0xccEa5C65f6d4F465B71501418b88FBe4e7071283', // From docs
    '0x07eA79F68B2B3df564D0A34F8e19D9B1e339814b', // Previous attempt
  ];
  
  console.log('Testing possible Pool addresses...\n');
  
  for (const address of possiblePoolAddresses) {
    try {
      console.log(`Testing: ${address}`);
      
      // Check if contract exists (has code)
      const code = await provider.getCode(address);
      
      if (code === '0x') {
        console.log('  ❌ No contract at this address\n');
        continue;
      }
      
      console.log('  ✅ Contract exists!');
      console.log('  Code length:', code.length, 'bytes');
      
      // Try to call a basic function
      const POOL_ABI = ["function ADDRESSES_PROVIDER() view returns (address)"];
      const contract = new ethers.Contract(address, POOL_ABI, provider);
      
      try {
        const providerAddr = await contract.ADDRESSES_PROVIDER();
        console.log('  ✅ ADDRESSES_PROVIDER:', providerAddr);
        console.log('  🎉 THIS IS THE POOL ADDRESS!\n');
        
        // This is the one!
        console.log('=' .repeat(60));
        console.log('USE THIS ADDRESS:');
        console.log(`AAVE_POOL_ADDRESS="${address}"`);
        console.log('=' .repeat(60));
        
        return address;
        
      } catch (e) {
        console.log('  ⚠️  Pool function call failed:', e.message.substring(0, 100));
      }
      
      console.log('');
      
    } catch (error) {
      console.log('  ❌ Error:', error.message.substring(0, 100), '\n');
    }
  }
  
  console.log('❌ Could not find working Pool address on Base Sepolia');
  console.log('\n💡 Recommendation: Base Sepolia Aave might not be fully deployed yet.');
  console.log('   For hackathon, use Ethereum Sepolia (guaranteed to work)\n');
  
  process.exit(1);
}

checkBaseAave();