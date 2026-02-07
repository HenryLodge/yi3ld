import { db } from '../../FirebaseConfig';
import { doc, getDoc, updateDoc, increment, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { sendInternationalPayment, getExchangeRate } from './xrpl';
import { getUserFromFirestore } from './auth';
import { getUserAccounts, Account } from './accounts';

export interface InternationalTransferParams {
  senderId: string;
  recipientId: string;
  amount: number;
}

/**
 * Send money internationally from one user's waiting room to another's
 */
export async function sendInternational(
  params: InternationalTransferParams
): Promise<{
  txHash: string;
  amountSent: number;
  amountReceived: number;
  exchangeRate: number;
}> {
  const { senderId, recipientId, amount } = params;
  
  try {
    console.log('🌍 Starting international transfer');
    
    // Step 1: Get sender info
    const sender = await getUserFromFirestore(senderId);
    if (!sender) throw new Error('Sender not found');
    
    const senderCountry = sender.country || 'US';
    const senderCurrency = sender.currency || 'USD';
    
    // Step 2: Get recipient info
    const recipient = await getUserFromFirestore(recipientId);
    if (!recipient) throw new Error('Recipient not found');
    
    const recipientCountry = recipient.country || 'US';
    const recipientCurrency = recipient.currency || 'USD';
    
    console.log(`   Sender: ${sender.firstName} (${senderCountry}, ${senderCurrency})`);
    console.log(`   Recipient: ${recipient.firstName} (${recipientCountry}, ${recipientCurrency})`);
    
    // Step 3: Get sender's waiting room
    const { getUserAccounts } = require('./accounts');
    const senderAccounts = await getUserAccounts(senderId);
    const senderWaitingRoom = senderAccounts.find((acc: Account) => acc.type === 'waiting-room');
    
    if (!senderWaitingRoom) {
      throw new Error('Sender has no waiting room');
    }
    
    if (senderWaitingRoom.balance < amount) {
      throw new Error(`Insufficient balance. Have ${senderWaitingRoom.balance}, need ${amount}`);
    }
    
    // Step 4: Get recipient's waiting room
    const recipientAccounts = await getUserAccounts(recipientId);
    const recipientWaitingRoom = recipientAccounts.find((acc: Account) => acc.type === 'waiting-room');
    
    if (!recipientWaitingRoom) {
      throw new Error('Recipient has no waiting room');
    }
    
    // Step 5: Send via XRPL
    console.log('🔵 Processing payment via XRP Ledger...');
    const xrplResult = await sendInternationalPayment(
      senderCountry,
      recipientCountry,
      amount,
      recipientId
    );
    
    console.log('✅ XRPL payment complete');
    console.log(`   Sent: ${amount} ${senderCurrency}`);
    console.log(`   Received: ${xrplResult.amountReceived} ${recipientCurrency}`);
    console.log(`   Fee: $${xrplResult.fee}`);
    console.log(`   Time: ${xrplResult.settlementTime} seconds`);
    
    // Step 6: Update sender's waiting room (deduct in their currency)
    const senderWaitingRoomRef = doc(db, 'accounts', senderWaitingRoom.id);
    await updateDoc(senderWaitingRoomRef, {
      balance: increment(-amount),
      lastUpdated: serverTimestamp()
    });
    
    // Step 7: Update recipient's waiting room (add in their currency)
    const recipientWaitingRoomRef = doc(db, 'accounts', recipientWaitingRoom.id);
    await updateDoc(recipientWaitingRoomRef, {
      balance: increment(xrplResult.amountReceived),
      lastUpdated: serverTimestamp()
    });
    
    // Step 8: Record transaction
    await addDoc(collection(db, 'transactions'), {
      senderId,
      senderName: `${sender.firstName} ${sender.lastName}`,
      recipientId,
      recipientName: `${recipient.firstName} ${recipient.lastName}`,
      type: 'international_transfer',
      amountSent: amount,
      currencySent: senderCurrency,
      amountReceived: xrplResult.amountReceived,
      currencyReceived: recipientCurrency,
      exchangeRate: xrplResult.exchangeRate,
      xrplTxHash: xrplResult.txHash,
      fee: xrplResult.fee,
      settlementTime: xrplResult.settlementTime,
      timestamp: serverTimestamp(),
      status: 'completed'
    });
    
    console.log('✅ International transfer complete!');
    
    return {
      txHash: xrplResult.txHash,
      amountSent: amount,
      amountReceived: xrplResult.amountReceived,
      exchangeRate: xrplResult.exchangeRate
    };
    
  } catch (error: any) {
    console.error('❌ International transfer failed:', error);
    throw error;
  }
}

/**
 * Find user by phone number (for sending to contacts)
 */
export async function findUserByPhone(phoneNumber: string): Promise<any | null> {
  try {
    const { collection, query, where, getDocs } = require('firebase/firestore');
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const userDoc = querySnapshot.docs[0];
    return {
      id: userDoc.id,
      ...userDoc.data()
    };
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}