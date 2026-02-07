import { auth } from '../../FirebaseConfig';
import { 
  PhoneAuthProvider,
  signInWithCredential
} from 'firebase/auth';

let verificationId: string | null = null;

export const setVerificationId = (id: string) => {
  verificationId = id;
};

export const verifyCode = async (code: string) => {
  try {
    if (!verificationId) {
      throw new Error('No verification ID available');
    }
    
    const credential = PhoneAuthProvider.credential(verificationId, code);
    const result = await signInWithCredential(auth, credential);
    
    return {
      user: {
        id: result.user.uid,
        phoneNumber: result.user.phoneNumber || '',
      },
      token: await result.user.getIdToken(),
    };
  } catch (error) {
    console.error('Error verifying code:', error);
    throw error;
  }
};






import { db } from '../../FirebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createAccount } from './accounts';
import { getUserAccounts } from './accounts';

export interface UserData {
  id: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  currency?: string;
  currencySymbol?: string;
  createdAt?: any;
}

// Check if user exists in Firestore
export const getUserFromFirestore = async (userId: string): Promise<UserData | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data(),
      } as UserData;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user from Firestore:', error);
    throw error;
  }
};

// Create user in Firestore
export const createUserInFirestore = async (userData: UserData): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userData.id);
    
    await setDoc(userRef, {
      phoneNumber: userData.phoneNumber,
      firstName: userData.firstName,
      lastName: userData.lastName,
      country: userData.country || 'US',
      currency: userData.currency || 'USD',
      currencySymbol: userData.currencySymbol || '$',
      createdAt: serverTimestamp(),
    });
    
    console.log('User created in Firestore:', userData.id);
  } catch (error) {
    console.error('Error creating user in Firestore:', error);
    throw error;
  }
};

// Create default waiting room account
export const createDefaultWaitingRoom = async (userId: string): Promise<void> => {
  try {
    // First check if user already has a waiting room
    const accounts = await getUserAccounts(userId);
    const hasWaitingRoom = accounts.some(acc => acc.type === 'waiting-room');
    
    if (hasWaitingRoom) {
      console.log('User already has a waiting room account');
      return;
    }
    
    await createAccount({
      userId: userId,
      name: 'Waiting Room',
      type: 'waiting-room',
      balance: 0,
      apy: 0,
    });
    
    console.log('Default waiting room created for user:', userId);
  } catch (error) {
    console.error('Error creating waiting room:', error);
    throw error;
  }
};