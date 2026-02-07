import { db } from '../../FirebaseConfig';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  increment,
  serverTimestamp 
} from 'firebase/firestore';

export interface Account {
  id: string;
  userId: string;
  name: string;
  accountNumber: string;
  balance: number;
  type: 'checking' | 'savings' | 'waiting-room';
  apy?: number;
  createdAt: Date;
}

export const getUserAccounts = async (userId: string): Promise<Account[]> => {
  try {
    const accountsRef = collection(db, 'accounts');
    const q = query(accountsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const accounts: Account[] = [];
    querySnapshot.forEach((doc) => {
      accounts.push({
        id: doc.id,
        ...doc.data(),
      } as Account);
    });
    
    return accounts;
  } catch (error) {
    console.error('Error fetching accounts:', error);
    throw error;
  }
};

export const getAccountById = async (accountId: string): Promise<Account | null> => {
  try {
    const accountRef = doc(db, 'accounts', accountId);
    const accountDoc = await getDoc(accountRef);
    
    if (accountDoc.exists()) {
      return {
        id: accountDoc.id,
        ...accountDoc.data(),
      } as Account;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching account:', error);
    throw error;
  }
};

// Generate a random account number
const generateAccountNumber = (): string => {
  const lastFour = Math.floor(1000 + Math.random() * 9000);
  return `•••• ${lastFour}`;
};

export interface CreateAccountParams {
  userId: string;
  name: string;
  type: 'checking' | 'savings' | 'waiting-room';
  balance: number;
  apy?: number;
}

export const createAccount = async (params: CreateAccountParams): Promise<string> => {
  try {
    const accountData = {
      userId: params.userId,
      name: params.name,
      accountNumber: params.type === 'waiting-room' ? '' : generateAccountNumber(),
      balance: params.balance,
      type: params.type,
      apy: params.apy || 0,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'accounts'), accountData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
};





// TEST FUNCTIONS
export const addMoneyToWaitingRoom = async (userId: string, amount: number): Promise<void> => {
  try {
    // Find the user's waiting room account
    const accountsRef = collection(db, 'accounts');
    const q = query(
      accountsRef, 
      where('userId', '==', userId),
      where('type', '==', 'waiting-room')
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('No waiting room account found');
    }
    
    // Get the first (should be only) waiting room account
    const waitingRoomDoc = querySnapshot.docs[0];
    const accountRef = doc(db, 'accounts', waitingRoomDoc.id);
    
    // Update the balance using Firebase increment
    await updateDoc(accountRef, {
      balance: increment(amount),
      updatedAt: serverTimestamp(),
    });
    
    console.log(`Added $${amount} to waiting room balance`);
  } catch (error) {
    console.error('Error adding money to waiting room:', error);
    throw error;
  }
};