import { Buffer } from 'buffer';
import { ethers } from 'ethers';
import { db } from '../../FirebaseConfig';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// Encryption key - in production, use proper KMS
// For hackathon, this is acceptable with clear documentation
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || 'hackathon-demo-key-change-in-production';

/**
 * Simple encryption for demo purposes
 * ⚠️ PRODUCTION: Replace with AWS KMS or similar
 */
function encryptPrivateKey(privateKey: string): string {
  // For hackathon: Base64 encode (NOT SECURE for production)
  return Buffer.from(privateKey).toString('base64');
}

function decryptPrivateKey(encryptedKey: string): string {
  // For hackathon: Base64 decode
  return Buffer.from(encryptedKey, 'base64').toString('utf8');
}

/**
 * Generate a new Ethereum wallet
 */
export function generateWallet(): { address: string; privateKey: string } {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

/**
 * Create wallet for user (called when they create first yielding account)
 */
export async function createUserWallet(userId: string): Promise<string> {
  try {
    // Check if user already has a wallet
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    
    // If wallet already exists, return it
    if (userData.walletAddress) {
      console.log('User already has wallet:', userData.walletAddress);
      return userData.walletAddress;
    }
    
    // Generate new wallet
    const { address, privateKey } = generateWallet();
    console.log('Generated new wallet:', address);
    
    // Encrypt private key
    const encryptedKey = encryptPrivateKey(privateKey);
    
    // Store in Firebase
    await updateDoc(userRef, {
      walletAddress: address,
      encryptedPrivateKey: encryptedKey,
      walletCreatedAt: new Date(),
    });
    
    console.log('✅ Wallet created and saved for user:', userId);
    return address;
    
  } catch (error) {
    console.error('Error creating wallet:', error);
    throw error;
  }
}

/**
 * Get user's wallet address
 */
export async function getUserWalletAddress(userId: string): Promise<string | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    return userDoc.data().walletAddress || null;
  } catch (error) {
    console.error('Error getting wallet address:', error);
    return null;
  }
}

/**
 * Get user's wallet (with private key)
 * ⚠️ Use carefully - private keys should be handled securely
 */
export async function getUserWallet(userId: string): Promise<ethers.Wallet | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    
    if (!userData.encryptedPrivateKey) {
      throw new Error('User has no wallet');
    }
    
    // Decrypt private key
    const privateKey = decryptPrivateKey(userData.encryptedPrivateKey);
    
    // Create wallet instance
    const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    return wallet;
    
  } catch (error) {
    console.error('Error getting wallet:', error);
    return null;
  }
}

/**
 * Get wallet balance (in ETH)
 */
export async function getWalletBalance(address: string): Promise<string> {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL);
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error getting balance:', error);
    return '0';
  }
}

/**
 * Check if wallet needs gas (has less than 0.001 ETH)
 */
export async function needsGas(address: string): Promise<boolean> {
  const balance = await getWalletBalance(address);
  return parseFloat(balance) < 0.001;
}