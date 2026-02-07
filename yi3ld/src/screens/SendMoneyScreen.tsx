import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { sendInternational, findUserByPhone } from '../services/internationalTransfer';
import { getExchangeRate } from '../services/xrpl';
import { getCountryByCode, formatCurrency } from '../utils/countries';
import { formatPhoneNumber } from '../utils/utilFunctions';

export default function SendMoneyScreen({ navigation }: any) {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState<any>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const userCountry = getCountryByCode(user?.country || 'US');

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
    
    // Reset recipient when phone changes
    if (recipient) {
      setRecipient(null);
      setExchangeRate(1);
    }
  };

  const handleFindRecipient = async () => {
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    
    if (cleanedPhone.length !== 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    setSearching(true);
    try {
      const formattedPhone = `+1${cleanedPhone}`;
      const foundUser = await findUserByPhone(formattedPhone);
      
      if (!foundUser) {
        Alert.alert('Not Found', 'This phone number is not registered with YieldWay');
        return;
      }
      
      if (foundUser.id === user?.id) {
        Alert.alert('Error', 'You cannot send money to yourself');
        return;
      }
      
      setRecipient(foundUser);
      
      // Get exchange rate
      const rate = await getExchangeRate(
        user?.currency || 'USD',
        foundUser.currency || 'USD'
      );
      setExchangeRate(rate);
      
      console.log('✅ Recipient found:', foundUser.firstName, foundUser.lastName);
      console.log('   Country:', foundUser.country);
      console.log('   Currency:', foundUser.currency);
      console.log('   Exchange rate:', rate);
      
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSearching(false);
    }
  };

  const handleSend = async () => {
    const sendAmount = parseFloat(amount);
    
    if (isNaN(sendAmount) || sendAmount <= 0) {
      Alert.alert('Invalid Amount');
      return;
    }
    
    if (!recipient) {
      Alert.alert('Please search for a recipient first');
      return;
    }

    setLoading(true);
    try {
      const result = await sendInternational({
        senderId: user!.id,
        recipientId: recipient.id,
        amount: sendAmount
      });
      
      const recipientCurrency = getCountryByCode(recipient.country);
      
      Alert.alert(
        'Transfer Complete! 🎉',
        `Sent ${userCountry?.currencySymbol}${sendAmount.toFixed(2)} to ${recipient.firstName}\n` +
        `They received ${recipientCurrency?.currencySymbol}${result.amountReceived.toFixed(2)}\n\n` +
        `⚡ Settlement: 3.5 seconds\n` +
        `💰 Fee: $0.00001\n` +
        `🔗 Powered by XRP Ledger`,
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
      
    } catch (error: any) {
      Alert.alert('Transfer Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendAmountNumber = parseFloat(amount) || 0;
  const receiveAmount = sendAmountNumber * exchangeRate;
  const recipientCurrency = recipient ? getCountryByCode(recipient.country) : null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Money</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
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
                <Text style={styles.recipientFlag}>{getCountryByCode(recipient.country)?.flag}</Text>
                <View style={styles.recipientDetails}>
                  <Text style={styles.recipientName}>
                    {recipient.firstName} {recipient.lastName}
                  </Text>
                  <Text style={styles.recipientCountry}>
                    {getCountryByCode(recipient.country)?.name} • {recipient.currency}
                  </Text>
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
                <Text style={styles.currencySymbol}>{userCountry?.currencySymbol}</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
            </View>

            {sendAmountNumber > 0 && (
              <View style={styles.conversionCard}>
                <View style={styles.conversionRow}>
                  <View style={styles.conversionSide}>
                    <Text style={styles.conversionLabel}>You send</Text>
                    <Text style={styles.conversionAmount}>
                      {userCountry?.currencySymbol}{sendAmountNumber.toFixed(2)}
                    </Text>
                    <Text style={styles.conversionCurrency}>{user?.currency}</Text>
                  </View>

                  <Ionicons name="arrow-forward" size={24} color="#666" />

                  <View style={styles.conversionSide}>
                    <Text style={styles.conversionLabel}>They receive</Text>
                    <Text style={styles.conversionAmount}>
                      {recipientCurrency?.currencySymbol}{receiveAmount.toFixed(2)}
                    </Text>
                    <Text style={styles.conversionCurrency}>{recipient.currency}</Text>
                  </View>
                </View>

                <View style={styles.conversionDivider} />

                <View style={styles.conversionDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Exchange Rate</Text>
                    <Text style={styles.detailValue}>
                      1 {user?.currency} = {exchangeRate.toFixed(4)} {recipient.currency}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transfer Fee</Text>
                    <Text style={styles.detailValue}>$0.00001</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Settlement Time</Text>
                    <Text style={styles.detailValue}>~3 seconds</Text>
                  </View>
                </View>

                <View style={styles.xrplBadge}>
                  <Text style={styles.xrplText}>⚡ Powered by XRP Ledger</Text>
                </View>
              </View>
            )}

            <View style={styles.comparisonCard}>
              <Text style={styles.comparisonTitle}>vs Traditional Banks</Text>
              <View style={styles.comparisonRow}>
                <View style={styles.comparisonItem}>
                  <Text style={styles.comparisonLabel}>Our Fee</Text>
                  <Text style={styles.comparisonValue}>$0.00001</Text>
                </View>
                <View style={styles.comparisonItem}>
                  <Text style={styles.comparisonLabel}>Bank Fee</Text>
                  <Text style={[styles.comparisonValue, styles.expensive]}>$25-50</Text>
                </View>
              </View>
              <View style={styles.comparisonRow}>
                <View style={styles.comparisonItem}>
                  <Text style={styles.comparisonLabel}>Our Time</Text>
                  <Text style={styles.comparisonValue}>3 seconds</Text>
                </View>
                <View style={styles.comparisonItem}>
                  <Text style={styles.comparisonLabel}>Bank Time</Text>
                  <Text style={[styles.comparisonValue, styles.expensive]}>3-5 days</Text>
                </View>
              </View>
            </View>
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
                Send {userCountry?.currencySymbol}{sendAmountNumber.toFixed(2)}
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
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 17,
    color: '#000',
    backgroundColor: '#fafafa',
  },
  searchButton: {
    width: 56,
    height: 56,
    backgroundColor: '#000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipientCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  recipientFlag: {
    fontSize: 32,
  },
  recipientDetails: {
    flex: 1,
  },
  recipientName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  recipientCountry: {
    fontSize: 14,
    color: '#666',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    paddingHorizontal: 16,
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
  conversionCard: {
    backgroundColor: '#fafafa',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    marginBottom: 16,
  },
  conversionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  conversionSide: {
    flex: 1,
    alignItems: 'center',
  },
  conversionLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  conversionAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  conversionCurrency: {
    fontSize: 14,
    color: '#666',
  },
  conversionDivider: {
    height: 1,
    backgroundColor: '#e5e5e5',
    marginBottom: 16,
  },
  conversionDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  xrplBadge: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    alignItems: 'center',
  },
  xrplText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  comparisonCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
  },
  comparisonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  expensive: {
    color: '#F44336',
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
    borderRadius: 12,
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