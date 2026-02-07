import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { transferBetweenYieldAccounts, getYieldTransferPreview } from '../services/yieldTransfer';
import { findUserByPhone } from '../services/internationalTransfer';
import { getUserAccounts, Account } from '../services/accounts';
import { formatPhoneNumber } from '../utils/utilFunctions';
import { getPoolById } from '../utils/yieldPools';

export default function SendToYieldAccountScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const { account } = route.params; // The sender's account
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  const pool = getPoolById(account.poolId);

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
    
    if (recipient) {
      setRecipient(null);
      setPreview(null);
    }
  };

  const handleFindRecipient = async () => {
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    
    if (cleanedPhone.length !== 10) {
      return;
    }

    setSearching(true);
    try {
      const formattedPhone = `+1${cleanedPhone}`;
      const foundUser = await findUserByPhone(formattedPhone);
      
      if (!foundUser) {
        return;
      }
      
      if (foundUser.id === user?.id) {
        return;
      }
      
      setRecipient(foundUser);
      
      // Get transfer preview
      const previewData = await getYieldTransferPreview(account.id, foundUser.id);
      setPreview(previewData);
      
      console.log('✅ Recipient found:', foundUser.firstName);
      console.log('   Preview:', previewData);
      
    } catch (error: any) {
    } finally {
      setSearching(false);
    }
  };

  const handleSend = async () => {
    const sendAmount = parseFloat(amount);
    
    if (isNaN(sendAmount) || sendAmount <= 0) {
      return;
    }
    
    if (!recipient) {
      return;
    }
    
    if (sendAmount > account.balance) {
      return;
    }

    setLoading(true);
    try {
      const result = await transferBetweenYieldAccounts({
        senderId: user!.id,
        recipientId: recipient.id,
        senderAccountId: account.id,
        amount: sendAmount
      });
      
      let message = `Sent $${sendAmount.toFixed(2)} from your ${account.name} to ${recipient.firstName}'s ${pool?.name}`;
      
      if (result.accountCreated) {
        message += `\n\n✨ Created a new ${pool?.name} for ${recipient.firstName}!`;
      }
      
    } catch (error: any) {
    } finally {
      setLoading(false);
    }
  };

  const sendAmountNumber = parseFloat(amount) || 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send from {account.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.accountInfoCard}>
          <Text style={styles.accountInfoLabel}>Sending from</Text>
          <Text style={styles.accountInfoName}>{account.name}</Text>
          <View style={styles.accountInfoRow}>
            <Text style={styles.accountInfoDetail}>{pool?.protocol}</Text>
            <Text style={styles.accountInfoDot}>•</Text>
            <Text style={styles.accountInfoDetail}>{account.apy}% APY</Text>
          </View>
          <Text style={styles.accountInfoBalance}>
            Available: ${account.balance.toFixed(2)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipient</Text>
          <View style={styles.phoneInputContainer}>
            <TextInput
              style={styles.phoneInput}
              placeholder="(555) 123-4567"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              maxLength={14}
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleFindRecipient}
              disabled={searching}
            >
              {searching ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="search" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {recipient && (
            <View style={styles.recipientCard}>
              <View style={styles.recipientInfo}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {recipient.firstName[0]}{recipient.lastName[0]}
                  </Text>
                </View>
                <View style={styles.recipientDetails}>
                  <Text style={styles.recipientName}>
                    {recipient.firstName} {recipient.lastName}
                  </Text>
                  {preview?.willCreateAccount ? (
                    <View style={styles.createBadge}>
                      <Ionicons name="add-circle" size={14} color="#4CAF50" />
                      <Text style={styles.createText}>
                        Will create {pool?.name}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.recipientAccount}>
                      Has {preview?.recipientAccountName}
                    </Text>
                  )}
                </View>
              </View>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            </View>
          )}
        </View>

        {recipient && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amount</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
              <TouchableOpacity 
                style={styles.maxButton}
                onPress={() => setAmount(account.balance.toString())}
              >
                <Text style={styles.maxButtonText}>
                  Max: ${account.balance.toFixed(2)}
                </Text>
              </TouchableOpacity>
            </View>

            {sendAmountNumber > 0 && (
              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>Transfer Summary</Text>
                
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>You send</Text>
                  <Text style={styles.previewValue}>
                    ${sendAmountNumber.toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>They receive</Text>
                  <Text style={styles.previewValue}>
                    ${sendAmountNumber.toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Account type</Text>
                  <Text style={styles.previewValue}>{pool?.name}</Text>
                </View>
                
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Continues earning</Text>
                  <Text style={[styles.previewValue, styles.apyGreen]}>
                    {account.apy}% APY
                  </Text>
                </View>
                
                {preview?.willCreateAccount && (
                  <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={18} color="#666" />
                    <Text style={styles.infoText}>
                      {recipient.firstName} will get a new {pool?.name} account created automatically
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {recipient && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!amount || sendAmountNumber <= 0 || loading) && styles.sendButtonDisabled
            ]}
            onPress={handleSend}
            disabled={!amount || sendAmountNumber <= 0 || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>
                Send ${sendAmountNumber.toFixed(2)}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
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
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  accountInfoCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    padding: 16,
    marginBottom: 24,
  },
  accountInfoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  accountInfoName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  accountInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  accountInfoDetail: {
    fontSize: 14,
    color: '#666',
  },
  accountInfoDot: {
    fontSize: 14,
    color: '#666',
  },
  accountInfoBalance: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  phoneInput: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 6,
    paddingHorizontal: 16,
    fontSize: 17,
    color: '#000',
    backgroundColor: '#fafafa',
  },
  searchButton: {
    width: 56,
    height: 56,
    backgroundColor: '#000',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipientCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    padding: 16,
    marginTop: 12,
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  recipientDetails: {
    flex: 1,
  },
  recipientName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  recipientAccount: {
    fontSize: 14,
    color: '#666',
  },
  createBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  createText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 33,
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
  maxButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  maxButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  previewCard: {
    backgroundColor: '#fafafa',
    borderRadius: 6,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 15,
    color: '#666',
  },
  previewValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  apyGreen: {
    color: '#4CAF50',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sendButton: {
    height: 56,
    backgroundColor: '#000',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e5e5e5',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});