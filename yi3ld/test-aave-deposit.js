// const { ethers } = require('ethers');
// const { initializeApp } = require('firebase/app');
// const { getFirestore, doc, getDoc } = require('firebase/firestore');
// require('dotenv').config();

// // Firebase config
// const firebaseConfig = {
//   apiKey: "AIzaSyCgW-ZX4UgYsl6I0VLNxAOx2MT8tGtfqQY",
//   authDomain: "thtesting-edbc0.firebaseapp.com",
//   projectId: "thtesting-edbc0",
//   storageBucket: "thtesting-edbc0.firebasestorage.app",
//   messagingSenderId: "48129433997",
//   appId: "1:48129433997:web:591b3f6b38dca3f8de1dc4"
// };

// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);

// // Contract addresses
// const AAVE_POOL_ADDRESS = '0x07eA79F68B2B3df564D0A34F8e19D9B1e339814b';
// const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
// const AUSDC_ADDRESS = '0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB';

// // ABIs
// const POOL_ABI = [
//   "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
//   "function withdraw(address asset, uint256 amount, address to) returns (uint256)",
// ];

// const ERC20_ABI = [
//   "function approve(address spender, uint256 amount) returns (bool)",
//   "function balanceOf(address account) view returns (uint256)",
//   "function allowance(address owner, address spender) view returns (uint256)",
// ];

// async function testAaveDeposit() {
//   console.log('\n🧪 Testing Aave Deposit Flow\n');
//   console.log('='.repeat(50));
  
//   const testUserId = 'fMgOzqjnfNXP3BgC3alphG3djqE3';
//   const testAmount = 10; // $10 USDC
  
//   try {
//     // Get user's wallet from Firebase
//     const userRef = doc(db, 'users', testUserId);
//     const userDoc = await getDoc(userRef);
    
//     if (!userDoc.exists()) {
//       throw new Error('User not found');
//     }
    
//     const userData = userDoc.data();
//     const userWalletAddress = userData.walletAddress;
//     const encryptedPrivateKey = userData.encryptedPrivateKey;
    
//     if (!userWalletAddress || !encryptedPrivateKey) {
//       throw new Error('User has no wallet');
//     }
    
//     // Decrypt private key
//     const privateKey = Buffer.from(encryptedPrivateKey, 'base64').toString('utf8');
    
//     // Create wallet instance
//     const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL);
//     const userWallet = new ethers.Wallet(privateKey, provider);
    
//     console.log('User wallet:', userWallet.address);
    
//     // Step 1: Check balances BEFORE
//     console.log('\n📊 BEFORE DEPOSIT:');
//     console.log('-'.repeat(50));
    
//     const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
//     const aUSDCContract = new ethers.Contract(AUSDC_ADDRESS, ERC20_ABI, provider);
    
//     const usdcBefore = await usdcContract.balanceOf(userWallet.address);
//     const aaveBefore = await aUSDCContract.balanceOf(userWallet.address);
    
//     console.log('USDC balance:', ethers.formatUnits(usdcBefore, 6));
//     console.log('Aave balance:', ethers.formatUnits(aaveBefore, 6));
    
//     // Step 2: Approve Aave to spend USDC
//     console.log('\n💰 DEPOSITING TO AAVE:');
//     console.log('-'.repeat(50));
//     console.log('Depositing', testAmount, 'USDC...');
    
//     const amountInUnits = ethers.parseUnits(testAmount.toString(), 6);
    
//     console.log('🔵 Step 1: Approving Aave to spend USDC...');
//     const usdcWithSigner = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, userWallet);
    
//     const approveTx = await usdcWithSigner.approve(AAVE_POOL_ADDRESS, amountInUnits);
//     console.log('🔵 Approve tx sent:', approveTx.hash);
//     await approveTx.wait();
//     console.log('✅ Approve confirmed!');
    
//     // Step 3: Deposit to Aave
//     console.log('🔵 Step 2: Depositing to Aave...');
//     const aavePool = new ethers.Contract(AAVE_POOL_ADDRESS, POOL_ABI, userWallet);
    
//     const depositTx = await aavePool.supply(
//       USDC_ADDRESS,
//       amountInUnits,
//       userWallet.address,
//       0
//     );
//     console.log('🔵 Deposit tx sent:', depositTx.hash);
    
//     const depositReceipt = await depositTx.wait();
//     console.log('✅ Deposit confirmed!');
//     console.log('🔗 View on explorer:');
//     console.log(`   https://sepolia.basescan.org/tx/${depositReceipt.hash}`);
    
//     // Step 4: Check balances AFTER
//     console.log('\n📊 AFTER DEPOSIT:');
//     console.log('-'.repeat(50));
    
//     const usdcAfter = await usdcContract.balanceOf(userWallet.address);
//     const aaveAfter = await aUSDCContract.balanceOf(userWallet.address);
    
//     console.log('USDC balance:', ethers.formatUnits(usdcAfter, 6));
//     console.log('Aave balance:', ethers.formatUnits(aaveAfter, 6));
    
//     // Summary
//     console.log('\n📈 SUMMARY:');
//     console.log('-'.repeat(50));
//     const usdcChange = parseFloat(ethers.formatUnits(usdcBefore, 6)) - parseFloat(ethers.formatUnits(usdcAfter, 6));
//     const aaveChange = parseFloat(ethers.formatUnits(aaveAfter, 6)) - parseFloat(ethers.formatUnits(aaveBefore, 6));
    
//     console.log('USDC change:', usdcChange.toFixed(2), '(should decrease)');
//     console.log('Aave change:', aaveChange.toFixed(2), '(should increase)');
//     console.log('✅ Deposit successful!');
//     console.log('\n🎉 Your money is now earning yield in Aave!');
//     console.log('💰 Current APY: ~7%');
//     console.log('\n');
    
//     process.exit(0);
    
//   } catch (error) {
//     console.error('\n❌ Test failed:', error.message);
//     if (error.error) {
//       console.error('Error details:', error.error);
//     }
//     console.error('\nFull error:', error);
//     process.exit(1);
//   }
// }

// testAaveDeposit();












const { ethers } = require('ethers');
require('dotenv').config();

// Contract addresses
const AAVE_POOL_ADDRESS = '0x07eA79F68B2B3df564D0A34F8e19D9B1e339814b';
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const AUSDC_ADDRESS = '0xf53B60F4006cab2b3C4688ce41fD5362427A2A66';

// ABIs
const POOL_ABI = [
  "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
  "function withdraw(address asset, uint256 amount, address to) returns (uint256)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
];

async function testAaveDeposit() {
  console.log('\n🧪 Testing Aave Deposit Flow\n');
  console.log('='.repeat(50));
  
  const testAmount = 10; // $10 USDC
  
  // PASTE the private key for the user wallet here
  // You can get this from Firebase Console manually:
  // 1. Go to users collection
  // 2. Find user ZAcvPSBVNNRmPJRhDnN1LrLMP0x2
  // 3. Copy the encryptedPrivateKey field
  // 4. Decode it: echo "BASE64_STRING" | base64 -d
  // OR just use your test wallet for now
  
  const userPrivateKey = "0x965afbea3798b73e946e72ad586f3d8979fda2a1fa2ddff8a2d0a4460d4704f9";
  
  try {
    const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL);
    const userWallet = new ethers.Wallet(userPrivateKey, provider);
    
    console.log('Using wallet:', userWallet.address);
    
    // Step 1: Check balances BEFORE
    console.log('\n📊 BEFORE DEPOSIT:');
    console.log('-'.repeat(50));
    
    const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
    const aUSDCContract = new ethers.Contract(AUSDC_ADDRESS, ERC20_ABI, provider);
    
    const usdcBefore = await usdcContract.balanceOf(userWallet.address);
    const aaveBefore = await aUSDCContract.balanceOf(userWallet.address);
    // const aaveBefore = 0;
    
    console.log('USDC balance:', ethers.formatUnits(usdcBefore, 6));
    console.log('Aave balance:', ethers.formatUnits(aaveBefore, 6));
    
    const usdcAmount = parseFloat(ethers.formatUnits(usdcBefore, 6));
    if (usdcAmount < testAmount) {
      throw new Error(`Not enough USDC. Have ${usdcAmount}, need ${testAmount}`);
    }
    
    // Step 2: Approve Aave
    console.log('\n💰 DEPOSITING TO AAVE:');
    console.log('-'.repeat(50));
    console.log('Depositing', testAmount, 'USDC...');
    
    const amountInUnits = ethers.parseUnits(testAmount.toString(), 6);
    
    console.log('🔵 Step 1: Approving Aave to spend USDC...');
    const usdcWithSigner = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, userWallet);
    
    const approveTx = await usdcWithSigner.approve(AAVE_POOL_ADDRESS, amountInUnits);
    console.log('🔵 Approve tx sent:', approveTx.hash);
    await approveTx.wait();
    console.log('✅ Approve confirmed!');
    
    // Step 3: Deposit to Aave
    console.log('🔵 Step 2: Depositing to Aave...');
    const aavePool = new ethers.Contract(AAVE_POOL_ADDRESS, POOL_ABI, userWallet);
    
    const depositTx = await aavePool.supply(
      USDC_ADDRESS,
      amountInUnits,
      userWallet.address,
      0
    );
    console.log('🔵 Deposit tx sent:', depositTx.hash);
    
    const depositReceipt = await depositTx.wait();
    console.log('✅ Deposit confirmed!');
    console.log('🔗 View on explorer:');
    console.log(`   https://sepolia.basescan.org/tx/${depositReceipt.hash}`);
    
    // Step 4: Check balances AFTER
    console.log('\n📊 AFTER DEPOSIT:');
    console.log('-'.repeat(50));
    
    const usdcAfter = await usdcContract.balanceOf(userWallet.address);
    const aaveAfter = await aUSDCContract.balanceOf(userWallet.address);
    
    console.log('USDC balance:', ethers.formatUnits(usdcAfter, 6));
    console.log('Aave balance:', ethers.formatUnits(aaveAfter, 6));
    
    // Summary
    console.log('\n📈 SUMMARY:');
    console.log('-'.repeat(50));
    const usdcChange = parseFloat(ethers.formatUnits(usdcBefore, 6)) - parseFloat(ethers.formatUnits(usdcAfter, 6));
    const aaveChange = parseFloat(ethers.formatUnits(aaveAfter, 6)) - parseFloat(ethers.formatUnits(aaveBefore, 6));
    
    console.log('USDC decreased by:', usdcChange.toFixed(2));
    console.log('Aave increased by:', aaveChange.toFixed(2));
    console.log('✅ Deposit successful!');
    console.log('\n🎉 Your money is now earning yield in Aave!');
    console.log('💰 Current APY: ~7%');
    console.log('🔗 View your position:');
    console.log(`   https://staging.aave.com/`);
    console.log('\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.data) {
      console.error('Error data:', error.data);
    }
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testAaveDeposit();