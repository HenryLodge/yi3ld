import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { getUserAccounts, Account } from '../services/accounts';
import { fundUserWallet } from '../services/aave';
import { depositToAave } from '../services/aave';
import { getPoolById } from '../utils/yieldPools';

type DevFundingScreenProps = {
  navigation: any;
};

export default function DevFundingScreen({ navigation }: DevFundingScreenProps) {
  const { user } = useAuth();
  const [yieldAccounts, setYieldAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'amount' | 'processing' | 'success'>('select');
  const [txHashes, setTxHashes] = useState<{ fund?: string; deposit?: string }>({});

  useEffect(() => {
    loadYieldAccounts();
  }, []);

  const loadYieldAccounts = async () => {
    if (!user?.id) return;
    
    try {
      const accounts = await getUserAccounts(user.id);
      const yielding = accounts.filter((acc: Account) => acc.type !== 'waiting-room');
      setYieldAccounts(yielding);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const handleSelectAccount = (account: Account) => {
    setSelectedAccount(account);
    setStep('amount');
  };

  const handleFundAndDeposit = async () => {
    if (!selectedAccount || !user?.walletAddress) return;
    
    const fundAmount = parseFloat(amount);
    
    if (isNaN(fundAmount) || fundAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    setStep('processing');
    
    try {
      // Step 1: Send USDC from dev wallet to user wallet
      console.log('💰 Step 1: Sending USDC from dev wallet...');
      const fundTxHash = await fundUserWallet(user.walletAddress, fundAmount);
      console.log('✅ USDC sent:', fundTxHash);
      
      setTxHashes(prev => ({ ...prev, fund: fundTxHash }));
      
      // Wait a bit for transaction to propagate
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Step 2: Deposit to Aave
      console.log('💰 Step 2: Depositing to Aave...');
      const depositTxHash = await depositToAave(user.id, fundAmount);
      console.log('✅ Deposited to Aave:', depositTxHash);
      
      setTxHashes(prev => ({ ...prev, deposit: depositTxHash }));
      
      // Step 3: Update Firebase account balance
      const { updateDoc, doc, increment, serverTimestamp } = require('firebase/firestore');
      const { db } = require('../../FirebaseConfig');
      
      const accountRef = doc(db, 'accounts', selectedAccount.id);
      await updateDoc(accountRef, {
        balance: increment(fundAmount),
        initialDeposit: increment(fundAmount),
        lastSynced: serverTimestamp()
      });
      
      console.log('✅ Firebase updated');
      
      setStep('success');
      
    } catch (error: any) {
      console.error('❌ Funding error:', error);
      Alert.alert('Error', error.message || 'Funding failed');
      setStep('amount');
    } finally {
      setLoading(false);
    }
  };

  const pool = selectedAccount ? getPoolById(selectedAccount.poolId || '') : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🧪 Dev Funding</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {step === 'select' && (
          <>
            <Text style={styles.title}>Select Account to Fund</Text>
            <Text style={styles.subtitle}>
              This will send USDC from your dev wallet and deposit to Aave
            </Text>

            <View style={styles.accountsList}>
              {yieldAccounts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No yield accounts yet</Text>
                  <Text style={styles.emptySubtext}>Create one first</Text>
                </View>
              ) : (
                yieldAccounts.map((account) => {
                  const accountPool = getPoolById(account.poolId || '');
                  return (
                    <TouchableOpacity
                      key={account.id}
                      style={styles.accountCard}
                      onPress={() => handleSelectAccount(account)}
                    >
                      <View style={styles.accountIcon}>
                        <Text style={styles.accountIconText}>{accountPool?.icon || '💰'}</Text>
                      </View>
                      <View style={styles.accountInfo}>
                        <Text style={styles.accountName}>{account.name}</Text>
                        <Text style={styles.accountDetails}>
                          {account.protocol} • {account.apy}% APY
                        </Text>
                        <Text style={styles.accountBalance}>
                          Current: ${account.balance.toFixed(2)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </>
        )}

        {step === 'amount' && selectedAccount && (
          <>
            <TouchableOpacity 
              style={styles.backLink}
              onPress={() => setStep('select')}
            >
              <Ionicons name="arrow-back" size={16} color="#666" />
              <Text style={styles.backLinkText}>Back to accounts</Text>
            </TouchableOpacity>

            <View style={styles.selectedAccountCard}>
              <Text style={styles.selectedLabel}>Funding</Text>
              <Text style={styles.selectedName}>{selectedAccount.name}</Text>
              <Text style={styles.selectedDetails}>
                {pool?.protocol} • {pool?.chain} • {selectedAccount.apy}% APY
              </Text>
            </View>

            <View style={styles.amountSection}>
              <Text style={styles.label}>Amount (USDC)</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                  autoFocus
                />
              </View>
              
              <View style={styles.quickAmounts}>
                {[10, 50, 100, 500].map((quickAmount) => (
                  <TouchableOpacity
                    key={quickAmount}
                    style={styles.quickAmountButton}
                    onPress={() => setAmount(quickAmount.toString())}
                  >
                    <Text style={styles.quickAmountText}>${quickAmount}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {parseFloat(amount) > 0 && (
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>What will happen:</Text>
                <View style={styles.infoStep}>
                  <Text style={styles.stepNumber}>1</Text>
                  <Text style={styles.stepText}>
                    Send {amount} USDC from dev wallet to your wallet
                  </Text>
                </View>
                <View style={styles.infoStep}>
                  <Text style={styles.stepNumber}>2</Text>
                  <Text style={styles.stepText}>
                    Approve & deposit to Aave {pool?.protocol}
                  </Text>
                </View>
                <View style={styles.infoStep}>
                  <Text style={styles.stepNumber}>3</Text>
                  <Text style={styles.stepText}>
                    Update {selectedAccount.name} balance
                  </Text>
                </View>
                <View style={styles.infoStep}>
                  <Text style={styles.stepNumber}>4</Text>
                  <Text style={styles.stepText}>
                    Start earning {selectedAccount.apy}% APY immediately
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.fundButton, (!amount || loading) && styles.fundButtonDisabled]}
              onPress={handleFundAndDeposit}
              disabled={!amount || loading}
            >
              <Text style={styles.fundButtonText}>
                Fund & Deposit ${parseFloat(amount || '0').toFixed(2)}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'processing' && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.processingTitle}>Processing Transaction</Text>
            <Text style={styles.processingSubtitle}>
              Sending USDC and depositing to Aave...
            </Text>
            
            {txHashes.fund && (
              <View style={styles.txStep}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.txStepText}>USDC sent to wallet</Text>
              </View>
            )}
            
            {txHashes.deposit && (
              <View style={styles.txStep}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.txStepText}>Deposited to Aave</Text>
              </View>
            )}
            
            <Text style={styles.processingNote}>This may take 30-60 seconds</Text>
          </View>
        )}

        {step === 'success' && (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            <Text style={styles.successTitle}>Funding Complete!</Text>
            <Text style={styles.successSubtitle}>
              ${parseFloat(amount).toFixed(2)} USDC deposited to {selectedAccount?.name}
            </Text>

            <View style={styles.txLinksContainer}>
              <Text style={styles.txLinksTitle}>Transactions:</Text>
              
              {txHashes.fund && (
                <TouchableOpacity
                  style={styles.txLink}
                  onPress={() => Linking.openURL(`https://sepolia.basescan.org/tx/${txHashes.fund}`)}
                >
                  <Ionicons name="open-outline" size={16} color="#666" />
                  <Text style={styles.txLinkText}>1. USDC Transfer</Text>
                </TouchableOpacity>
              )}
              
              {txHashes.deposit && (
                <TouchableOpacity
                  style={styles.txLink}
                  onPress={() => Linking.openURL(`https://sepolia.basescan.org/tx/${txHashes.deposit}`)}
                >
                  <Ionicons name="open-outline" size={16} color="#666" />
                  <Text style={styles.txLinkText}>2. Aave Deposit</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.successActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setStep('select');
                  setSelectedAccount(null);
                  setAmount('');
                  setTxHashes({});
                }}
              >
                <Text style={styles.secondaryButtonText}>Fund Another</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.primaryButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    lineHeight: 22,
  },
  accountsList: {
    gap: 12,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  accountIconText: {
    fontSize: 24,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  accountDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  accountBalance: {
    fontSize: 13,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  backLinkText: {
    fontSize: 15,
    color: '#666',
  },
  selectedAccountCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  selectedLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  selectedName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  selectedDetails: {
    fontSize: 15,
    color: '#666',
  },
  amountSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '600',
    color: '#000',
    paddingVertical: 16,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  infoCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000',
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    lineHeight: 24,
  },
  fundButton: {
    height: 56,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fundButtonDisabled: {
    backgroundColor: '#e5e5e5',
  },
  fundButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  processingTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    marginTop: 24,
    marginBottom: 8,
  },
  processingSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  txStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  txStepText: {
    fontSize: 15,
    color: '#000',
  },
  processingNote: {
    fontSize: 14,
    color: '#999',
    marginTop: 24,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginTop: 24,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  txLinksContainer: {
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  txLinksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  txLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  txLinkText: {
    fontSize: 14,
    color: '#666',
  },
  successActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  primaryButton: {
    flex: 1,
    height: 56,
    backgroundColor: '#000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    height: 56,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});