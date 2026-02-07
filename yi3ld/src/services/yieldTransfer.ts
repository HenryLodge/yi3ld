import { db } from '../../FirebaseConfig';
import { doc, getDoc, updateDoc, increment, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { getUserFromFirestore } from './auth';
import { getUserAccounts, Account, createYieldAccount } from './accounts';
import { getPoolById } from '../utils/yieldPools';

export interface YieldTransferParams {
  senderId: string;
  recipientId: string;
  senderAccountId: string;
  amount: number;
}

/**
 * Transfer money from one user's yielding account to another user's yielding account
 * Creates the account type if recipient doesn't have it
 */
export async function transferBetweenYieldAccounts(
  params: YieldTransferParams
): Promise<{
  txHash: string;
  amountSent: number;
  recipientAccountId: string;
  accountCreated: boolean;
}> {
  const { senderId, recipientId, senderAccountId, amount } = params;
  
  try {
    console.log('💸 Starting yield account transfer');
    
    // Step 1: Get sender info
    const sender = await getUserFromFirestore(senderId);
    if (!sender) throw new Error('Sender not found');
    
    // Step 2: Get recipient info
    const recipient = await getUserFromFirestore(recipientId);
    if (!recipient) throw new Error('Recipient not found');
    
    console.log(`   Sender: ${sender.firstName} ${sender.lastName}`);
    console.log(`   Recipient: ${recipient.firstName} ${recipient.lastName}`);
    
    // Step 3: Get sender's account
    const senderAccountRef = doc(db, 'accounts', senderAccountId);
    const senderAccountSnap = await getDoc(senderAccountRef);
    
    if (!senderAccountSnap.exists()) {
      throw new Error('Sender account not found');
    }
    
    const senderAccount = { id: senderAccountSnap.id, ...senderAccountSnap.data() } as Account;
    
    // Check sender has enough balance
    if (senderAccount.balance < amount) {
      throw new Error(`Insufficient balance. Have $${senderAccount.balance}, need $${amount}`);
    }
    
    console.log(`   From account: ${senderAccount.name} (${senderAccount.poolId})`);
    console.log(`   Amount: $${amount}`);
    
    // Step 4: Check if recipient has matching account type
    const recipientAccounts = await getUserAccounts(recipientId);
    let recipientAccount = recipientAccounts.find(
      (acc: Account) => acc.poolId === senderAccount.poolId && acc.type !== 'waiting-room'
    );
    
    let accountCreated = false;
    
    // Step 5: If recipient doesn't have this account type, create it
    if (!recipientAccount) {
      console.log('🔵 Recipient doesn\'t have matching account, creating...');
      
      const pool = getPoolById(senderAccount.poolId!);
      if (!pool) throw new Error('Invalid pool');
      
      const newAccountId = await createYieldAccount(
        recipientId,
        `${pool.name}`, // Auto-name it
        senderAccount.poolId!,
        0 // Start with 0 balance
      );
      
      // Get the newly created account
      const newAccountSnap = await getDoc(doc(db, 'accounts', newAccountId));
      recipientAccount = { id: newAccountSnap.id, ...newAccountSnap.data() } as Account;
      
      accountCreated = true;
      console.log('✅ Created new account for recipient:', newAccountId);
    } else {
      console.log(`   To account: ${recipientAccount.name}`);
    }
    
    // Step 6: Update sender's account (deduct)
    await updateDoc(senderAccountRef, {
      balance: increment(-amount),
      lastUpdated: serverTimestamp()
    });
    console.log('✅ Deducted from sender');
    
    // Step 7: Update recipient's account (add)
    const recipientAccountRef = doc(db, 'accounts', recipientAccount.id);
    await updateDoc(recipientAccountRef, {
      balance: increment(amount),
      initialDeposit: increment(amount), // Track this as a deposit
      lastUpdated: serverTimestamp()
    });
    console.log('✅ Added to recipient');
    
    // Step 8: Record transaction
    const mockTxHash = 'YT' + Date.now().toString(36) + Math.random().toString(36).substring(2);
    
    await addDoc(collection(db, 'transactions'), {
      senderId,
      senderName: `${sender.firstName} ${sender.lastName}`,
      senderAccountId: senderAccount.id,
      senderAccountName: senderAccount.name,
      recipientId,
      recipientName: `${recipient.firstName} ${recipient.lastName}`,
      recipientAccountId: recipientAccount.id,
      recipientAccountName: recipientAccount.name,
      type: 'yield_account_transfer',
      amount,
      poolId: senderAccount.poolId,
      protocol: senderAccount.protocol,
      accountCreated,
      txHash: mockTxHash,
      timestamp: serverTimestamp(),
      status: 'completed'
    });
    
    console.log('✅ Yield transfer complete!');
    
    return {
      txHash: mockTxHash,
      amountSent: amount,
      recipientAccountId: recipientAccount.id,
      accountCreated
    };
    
  } catch (error: any) {
    console.error('❌ Yield transfer failed:', error);
    throw error;
  }
}

/**
 * Get transfer preview info
 */
export async function getYieldTransferPreview(
  senderAccountId: string,
  recipientId: string
): Promise<{
  recipientHasMatchingAccount: boolean;
  recipientAccountName?: string;
  willCreateAccount: boolean;
  accountToCreate?: string;
}> {
  try {
    // Get sender's account
    const senderAccountSnap = await getDoc(doc(db, 'accounts', senderAccountId));
    if (!senderAccountSnap.exists()) {
      throw new Error('Sender account not found');
    }
    
    const senderAccount = senderAccountSnap.data() as Account;
    
    // Get recipient's accounts
    const recipientAccounts = await getUserAccounts(recipientId);
    const matchingAccount = recipientAccounts.find(
      (acc: Account) => acc.poolId === senderAccount.poolId
    );
    
    if (matchingAccount) {
      return {
        recipientHasMatchingAccount: true,
        recipientAccountName: matchingAccount.name,
        willCreateAccount: false
      };
    } else {
      const pool = getPoolById(senderAccount.poolId!);
      return {
        recipientHasMatchingAccount: false,
        willCreateAccount: true,
        accountToCreate: pool?.name
      };
    }
    
  } catch (error) {
    console.error('Error getting preview:', error);
    throw error;
  }
}