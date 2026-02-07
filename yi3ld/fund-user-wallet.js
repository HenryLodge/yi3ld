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
// const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// // ERC20 ABI
// const ERC20_ABI = [
//   "function transfer(address to, uint256 amount) returns (bool)",
//   "function balanceOf(address account) view returns (uint256)",
// ];

// async function fundUser() {
//   console.log('\n💸 Funding User Wallet\n');
  
//   const testUserId = 'fMgOzqjnfNXP3BgC3alphG3djqE3';
  
//   try {
//     // Get user's wallet address from Firebase
//     const userRef = doc(db, 'users', testUserId);
//     const userDoc = await getDoc(userRef);
    
//     if (!userDoc.exists()) {
//       throw new Error('User not found');
//     }
    
//     const userWalletAddress = userDoc.data().walletAddress;
    
//     if (!userWalletAddress) {
//       throw new Error('User has no wallet! Create a yielding account first.');
//     }
    
//     console.log('User wallet:', userWalletAddress);
//     console.log('User ID:', testUserId);
    
//     // Get master wallet from .env
//     const privateKey = process.env.TEST_WALLET_PRIVATE_KEY;
//     const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL;
    
//     if (!privateKey || !rpcUrl) {
//       throw new Error('Missing TEST_WALLET_PRIVATE_KEY or BASE_SEPOLIA_RPC_URL in .env');
//     }
    
//     const provider = new ethers.JsonRpcProvider(rpcUrl);
//     const masterWallet = new ethers.Wallet(privateKey, provider);
    
//     console.log('Master wallet:', masterWallet.address);
    
//     // Check master wallet balances
//     const masterETH = await provider.getBalance(masterWallet.address);
//     console.log('Master ETH:', ethers.formatEther(masterETH));
    
//     const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
//     const masterUSDC = await usdcContract.balanceOf(masterWallet.address);
//     console.log('Master USDC:', ethers.formatUnits(masterUSDC, 6));
    
//     // Step 1: Send gas (ETH) to user wallet
//     console.log('\n1️⃣ Sending 0.01 ETH for gas...');
//     const gasTx = await masterWallet.sendTransaction({
//       to: userWalletAddress,
//       value: ethers.parseEther('0.01')
//     });
//     console.log('🔵 Gas tx sent:', gasTx.hash);
//     await gasTx.wait();
//     console.log('✅ Gas sent!');
    
//     // Step 2: Send USDC to user wallet
//     console.log('\n2️⃣ Sending 10 USDC...');
//     const usdcContractWithSigner = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, masterWallet);
    
//     const usdcAmount = ethers.parseUnits('10', 6); // 10 USDC
//     const usdcTx = await usdcContractWithSigner.transfer(userWalletAddress, usdcAmount);
//     console.log('🔵 USDC tx sent:', usdcTx.hash);
//     await usdcTx.wait();
//     console.log('✅ USDC sent!');
    
//     // Step 3: Verify
//     console.log('\n✅ User wallet is now funded!');
//     console.log('🔗 View wallet:');
//     console.log(`   https://sepolia.basescan.org/address/${userWalletAddress}`);
    
//     // Check new balances
//     const userETH = await provider.getBalance(userWalletAddress);
//     const userUSDC = await usdcContract.balanceOf(userWalletAddress);
    
//     console.log('\n📊 User wallet now has:');
//     console.log('   ETH:', ethers.formatEther(userETH));
//     console.log('   USDC:', ethers.formatUnits(userUSDC, 6));
    
//     process.exit(0);
    
//   } catch (error) {
//     console.error('❌ Error:', error.message);
//     console.error('Full error:', error);
//     process.exit(1);
//   }
// }

// fundUser();









const { ethers } = require('ethers');
require('dotenv').config();

// Contract address
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// ERC20 ABI
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
];

async function fundUser() {
  console.log('\n💸 Funding User Wallet\n');
  
  // HARDCODE the user wallet address (from your Firebase/logs)
  const userWalletAddress = '0x7313D47a5D0bEeCab59D6178Aa7c62454A968f1c';
  
  try {
    console.log('User wallet:', userWalletAddress);
    
    // Get master wallet from .env
    const privateKey = process.env.TEST_WALLET_PRIVATE_KEY;
    const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL;
    
    if (!privateKey || !rpcUrl) {
      throw new Error('Missing TEST_WALLET_PRIVATE_KEY or BASE_SEPOLIA_RPC_URL in .env');
    }
    
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const masterWallet = new ethers.Wallet(privateKey, provider);
    
    console.log('Master wallet:', masterWallet.address);
    
    // Check master wallet balances
    const masterETH = await provider.getBalance(masterWallet.address);
    console.log('Master ETH:', ethers.formatEther(masterETH));
    
    const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
    const masterUSDC = await usdcContract.balanceOf(masterWallet.address);
    console.log('Master USDC:', ethers.formatUnits(masterUSDC, 6));
    
    if (parseFloat(ethers.formatEther(masterETH)) < 0.02) {
      console.log('⚠️  Warning: Master wallet is low on ETH');
    }
    
    if (parseFloat(ethers.formatUnits(masterUSDC, 6)) < 10) {
      throw new Error('Master wallet needs more USDC! Go to Aave faucet.');
    }
    
    // Step 1: Send gas (ETH) to user wallet
    console.log('\n1️⃣ Sending 0.01 ETH for gas...');
    const gasTx = await masterWallet.sendTransaction({
      to: userWalletAddress,
      value: ethers.parseEther('0.01')
    });
    console.log('🔵 Gas tx sent:', gasTx.hash);
    await gasTx.wait();
    console.log('✅ Gas sent!');
    
    // Step 2: Send USDC to user wallet
    console.log('\n2️⃣ Sending 10 USDC...');
    const usdcContractWithSigner = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, masterWallet);
    
    const usdcAmount = ethers.parseUnits('10', 6);
    const usdcTx = await usdcContractWithSigner.transfer(userWalletAddress, usdcAmount);
    console.log('🔵 USDC tx sent:', usdcTx.hash);
    await usdcTx.wait();
    console.log('✅ USDC sent!');
    
    // Verify
    console.log('\n✅ User wallet is now funded!');
    console.log('🔗 View wallet:');
    console.log(`   https://sepolia.basescan.org/address/${userWalletAddress}`);
    
    const userETH = await provider.getBalance(userWalletAddress);
    const userUSDC = await usdcContract.balanceOf(userWalletAddress);
    
    console.log('\n📊 User wallet now has:');
    console.log('   ETH:', ethers.formatEther(userETH));
    console.log('   USDC:', ethers.formatUnits(userUSDC, 6));
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

fundUser();