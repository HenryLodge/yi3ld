import { db } from '../../FirebaseConfig';
import { collection, query, where, getDocs, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getAllAavePositions } from './aave';
import { createYieldAccount, Account } from './accounts';
import { getPoolById } from '../utils/yieldPools';

/**
 * Detect and sync yielding accounts based on wallet holdings
 */
export async function detectAndSyncYieldAccounts(userId: string): Promise<{
  accountsCreated: number;
  accountsUpdated: number;
}> {
  try {
    console.log('🔍 Detecting yield accounts for user:', userId);
    
    // Get user's wallet address
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }
    
    const walletAddress = userSnap.data().walletAddress;
    
    if (!walletAddress) {
      console.log('⚠️  User has no wallet yet');
      return { accountsCreated: 0, accountsUpdated: 0 };
    }
    
    // Get all Aave positions from blockchain
    const positions = await getAllAavePositions(walletAddress);
    
    if (positions.length === 0) {
      console.log('No active positions found');
      return { accountsCreated: 0, accountsUpdated: 0 };
    }
    
    // Get user's existing accounts
    const accountsRef = collection(db, 'accounts');
    const q = query(accountsRef, where('userId', '==', userId));
    const accountsSnap = await getDocs(q);
    
    const existingAccounts: Account[] = [];
    accountsSnap.forEach(doc => {
      existingAccounts.push({ id: doc.id, ...doc.data() } as Account);
    });
    
    let accountsCreated = 0;
    let accountsUpdated = 0;
    
    // For each position found on-chain
    for (const position of positions) {
      // Check if user already has this account type in Firebase
      const existingAccount = existingAccounts.find(
        (acc: Account) => acc.poolId === position.poolId && acc.type !== 'waiting-room'
      );
      
      if (existingAccount) {
        // Account exists - update balance to match blockchain
        console.log(`🔄 Updating ${existingAccount.name} balance to ${position.balance}`);
        
        const accountRef = doc(db, 'accounts', existingAccount.id);
        await updateDoc(accountRef, {
          balance: position.balance,
          lastSynced: serverTimestamp()
        });
        
        accountsUpdated++;
      } else {
        // Account doesn't exist - create it
        const pool = getPoolById(position.poolId);
        if (!pool) {
          console.log(`⚠️  Unknown pool: ${position.poolId}`);
          continue;
        }
        
        console.log(`✨ Creating new account: ${pool.name} with $${position.balance}`);
        
        await createYieldAccount(
          userId,
          pool.name,
          position.poolId,
          position.balance
        );
        
        accountsCreated++;
      }
    }
    
    console.log(`✅ Detection complete: ${accountsCreated} created, ${accountsUpdated} updated`);
    
    return { accountsCreated, accountsUpdated };
    
  } catch (error) {
    console.error('Error detecting accounts:', error);
    throw error;
  }
}