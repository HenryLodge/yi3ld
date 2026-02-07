import { ethers } from 'ethers';
import { getUserWallet } from './wallet';

// Contract addresses from .env
const AAVE_POOL_ADDRESS = '0x07eA79F68B2B3df564D0A34F8e19D9B1e339814b';
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const AUSDC_ADDRESS = '0xf53B60F4006cab2b3C4688ce41fD5362427A2A66';

// Aave Pool ABI (only the functions we need)
const POOL_ABI = [
  "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
  "function withdraw(address asset, uint256 amount, address to) returns (uint256)",
];

// ERC20 ABI (for USDC approval and balance)
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

/**
 * Get provider (connection to blockchain)
 */
function getProvider(): ethers.JsonRpcProvider {
  const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL;
  if (!rpcUrl) {
    throw new Error('BASE_SEPOLIA_RPC_URL not found in .env');
  }
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Check USDC balance of wallet
 */
export async function getUSDCBalance(walletAddress: string): Promise<number> {
  try {
    const provider = getProvider();
    const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
    
    const balance = await usdcContract.balanceOf(walletAddress);
    
    // USDC has 6 decimals
    return parseFloat(ethers.formatUnits(balance, 6));
  } catch (error) {
    console.error('Error getting USDC balance:', error);
    throw error;
  }
}

/**
 * Check aUSDC balance (deposited in Aave)
 */
export async function getAaveBalance(walletAddress: string): Promise<number> {
  try {
    const provider = getProvider();
    const aUSDCContract = new ethers.Contract(AUSDC_ADDRESS, ERC20_ABI, provider);
    
    const balance = await aUSDCContract.balanceOf(walletAddress);
    
    // aUSDC also has 6 decimals
    return parseFloat(ethers.formatUnits(balance, 6));
  } catch (error) {
    console.error('Error getting Aave balance:', error);
    throw error;
  }
}

/**
 * Deposit USDC to Aave
 */
export async function depositToAave(
  userId: string,
  amount: number
): Promise<string> {
  try {
    console.log('🔵 Starting Aave deposit for amount:', amount);
    
    // Get user's wallet
    const wallet = await getUserWallet(userId);
    if (!wallet) {
      throw new Error('User wallet not found');
    }
    
    console.log('🔵 Using wallet:', wallet.address);
    
    // Check USDC balance
    const usdcBalance = await getUSDCBalance(wallet.address);
    console.log('🔵 USDC balance:', usdcBalance);
    
    if (usdcBalance < amount) {
      throw new Error(`Insufficient USDC. Have ${usdcBalance}, need ${amount}`);
    }
    
    // Convert amount to proper units (USDC has 6 decimals)
    const amountInUnits = ethers.parseUnits(amount.toString(), 6);
    console.log('🔵 Amount in units:', amountInUnits.toString());
    
    // Step 1: Approve Aave to spend USDC
    console.log('🔵 Step 1: Approving Aave to spend USDC...');
    const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet);
    
    const approveTx = await usdcContract.approve(AAVE_POOL_ADDRESS, amountInUnits);
    console.log('🔵 Approve tx sent:', approveTx.hash);
    
    const approveReceipt = await approveTx.wait();
    console.log('✅ Approve confirmed:', approveReceipt.hash);
    
    // Step 2: Deposit to Aave
    console.log('🔵 Step 2: Depositing to Aave...');
    const aavePool = new ethers.Contract(AAVE_POOL_ADDRESS, POOL_ABI, wallet);
    
    const depositTx = await aavePool.supply(
      USDC_ADDRESS,        // asset (USDC)
      amountInUnits,       // amount
      wallet.address,      // onBehalfOf (deposit for yourself)
      0                    // referralCode (0 = none)
    );
    console.log('🔵 Deposit tx sent:', depositTx.hash);
    
    const depositReceipt = await depositTx.wait();
    console.log('✅ Deposit confirmed:', depositReceipt.hash);
    
    // Step 3: Verify deposit worked
    const aaveBalance = await getAaveBalance(wallet.address);
    console.log('✅ New Aave balance:', aaveBalance);
    
    return depositReceipt.hash;
    
  } catch (error: any) {
    console.error('❌ Error depositing to Aave:', error);
    throw error;
  }
}

/**
 * Withdraw USDC from Aave
 */
export async function withdrawFromAave(
  userId: string,
  amount: number
): Promise<string> {
  try {
    console.log('🔵 Starting Aave withdrawal for amount:', amount);
    
    // Get user's wallet
    const wallet = await getUserWallet(userId);
    if (!wallet) {
      throw new Error('User wallet not found');
    }
    
    // Check Aave balance
    const aaveBalance = await getAaveBalance(wallet.address);
    console.log('🔵 Aave balance:', aaveBalance);
    
    if (aaveBalance < amount) {
      throw new Error(`Insufficient balance in Aave. Have ${aaveBalance}, need ${amount}`);
    }
    
    // Convert amount to proper units
    const amountInUnits = ethers.parseUnits(amount.toString(), 6);
    
    // Withdraw from Aave
    console.log('🔵 Withdrawing from Aave...');
    const aavePool = new ethers.Contract(AAVE_POOL_ADDRESS, POOL_ABI, wallet);
    
    const withdrawTx = await aavePool.withdraw(
      USDC_ADDRESS,        // asset
      amountInUnits,       // amount
      wallet.address       // to (send to yourself)
    );
    console.log('🔵 Withdraw tx sent:', withdrawTx.hash);
    
    const withdrawReceipt = await withdrawTx.wait();
    console.log('✅ Withdraw confirmed:', withdrawReceipt.hash);
    
    // Verify withdrawal worked
    const usdcBalance = await getUSDCBalance(wallet.address);
    console.log('✅ New USDC balance:', usdcBalance);
    
    return withdrawReceipt.hash;
    
  } catch (error: any) {
    console.error('❌ Error withdrawing from Aave:', error);
    throw error;
  }
}

/**
 * Get current Aave USDC supply APY
 * For demo: return mock value
 * For production: fetch from Aave API
 */
export async function getAaveAPY(poolId: string): Promise<number> {
  // For hackathon: return mock based on pool
  const mockAPYs: { [key: string]: number } = {
    'aave-eth-conservative': 3.5,
    'aave-base-balanced': 7.2,
    'morpho-aggressive': 9.8,
  };
  
  return mockAPYs[poolId] || 5.0;
  
  // For production, fetch real APY:
  // const response = await fetch('https://aave-api-v2.aave.com/data/...');
  // return response.liquidityRate;
}

/**
 * Transfer USDC from master wallet to user wallet
 * (For hackathon - sending test USDC to user wallets)
 */
export async function fundUserWallet(
  userWalletAddress: string,
  amount: number
): Promise<string> {
  try {
    console.log('🔵 Funding user wallet with', amount, 'USDC');
    
    // Get master wallet (from .env)
    const privateKey = process.env.TEST_WALLET_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('TEST_WALLET_PRIVATE_KEY not found');
    }
    
    const provider = getProvider();
    const masterWallet = new ethers.Wallet(privateKey, provider);
    
    // Create USDC contract instance
    const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, masterWallet);
    
    // Transfer USDC
    const amountInUnits = ethers.parseUnits(amount.toString(), 6);
    const tx = await usdcContract.transfer(userWalletAddress, amountInUnits);
    
    console.log('🔵 Transfer tx sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Transfer confirmed:', receipt.hash);
    
    return receipt.hash;
    
  } catch (error: any) {
    console.error('❌ Error funding wallet:', error);
    throw error;
  }
}