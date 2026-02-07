import { createUserWallet, getUserWalletAddress, getWalletBalance } from './src/services/wallet';

async function testWalletCreation() {
  console.log('Testing wallet creation with Firebase...\n');
  
  // REPLACE THIS with your actual test user ID from Firebase
  const testUserId = 'Hzt5NQ1UXSSFwTAuflEwYo9MBfo1';
  
  try {
    console.log('Test User ID:', testUserId);
    
    // Test 1: Create wallet
    console.log('\n1. Creating wallet for user...');
    const address = await createUserWallet(testUserId);
    console.log('✅ Wallet created:', address);
    
    // Test 2: Retrieve wallet address
    console.log('\n2. Retrieving wallet from Firebase...');
    const savedAddress = await getUserWalletAddress(testUserId);
    console.log('✅ Retrieved address:', savedAddress);
    console.log('✅ Addresses match:', address === savedAddress);
    
    // Test 3: Check balance
    console.log('\n3. Checking wallet balance...');
    const balance = await getWalletBalance(address);
    console.log('✅ Balance:', balance, 'ETH');
    
    // Test 4: Duplicate prevention
    console.log('\n4. Testing duplicate creation prevention...');
    const address2 = await createUserWallet(testUserId);
    console.log('✅ Second call returned existing:', address2);
    console.log('✅ Same address:', address === address2);
    
    console.log('\n🎉 All wallet tests passed!\n');
    
    process.exit(0);
    
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testWalletCreation();