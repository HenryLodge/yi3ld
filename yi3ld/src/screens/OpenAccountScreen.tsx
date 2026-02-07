import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { createYieldAccount } from '../services/accounts';
import Logo from '../components/Logo';

type OpenAccountScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const accountTypes = [
  {
    id: 'aave-eth-conservative',
    name: 'AAVE USDC',
    description: 'Maximum security with Ethereum mainnet',
    features: ['4.52% APY', 'Highest security', 'Instant withdrawals'],
    icon: 'shield-outline',
  },
  {
    id: 'aave-base-balanced',
    name: 'Sentora PYUSD',
    description: 'Best balance of yield and security',
    features: ['6.48% APY', 'Low fees', 'Coinbase-backed'],
    icon: 'speedometer-outline',
  },
  {
    id: 'morpho-aggressive',
    name: 'Elemental USDC Turbo',
    description: 'Maximum yield with peer-to-peer matching',
    features: ['9.2% APY', 'Highest returns', 'Growing protocol'],
    icon: 'rocket-outline',
  },
];

export default function OpenAccountScreen({ navigation }: OpenAccountScreenProps) {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'details' | 'confirm'>('select');
  const [accountName, setAccountName] = useState('');
  const [initialDeposit, setInitialDeposit] = useState('');
  const [loading, setLoading] = useState(false);
  
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [step]);

  const handleSelectType = (typeId: string) => {
    setSelectedType(typeId);
    const selectedAccount = accountTypes.find(t => t.id === typeId);
    setAccountName(selectedAccount?.name || '');
    setStep('details');
  };

  const handleContinueToConfirm = () => {
    if (!accountName.trim()) {
      Alert.alert('Required', 'Please enter an account name');
      return;
    }
    
    const deposit = parseFloat(initialDeposit);
    if (isNaN(deposit) || deposit < 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid initial deposit amount');
      return;
    }

    setStep('confirm');
  };

  const handleCreateAccount = async () => {
    console.log('🔵 handleCreateAccount called');
    
    if (!user?.id || !selectedType) {
      console.log('❌ Missing user ID or selected type');
      return;
    }

    setLoading(true);
    try {
      const deposit = parseFloat(initialDeposit) || 0;
      
      console.log('🔵 Calling createYieldAccount with:', {
        userId: user.id,
        name: accountName.trim(),
        poolId: selectedType,
        deposit
      });
      
      const accountId = await createYieldAccount(
        user.id,
        accountName.trim(),
        selectedType,
        deposit
      );

      console.log('✅ Account created with ID:', accountId);
      navigation.goBack();

    } catch (error: any) {
      console.error('❌ Create account error:', error);
      Alert.alert('Error', error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const renderSelectStep = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      {/* <Text style={styles.stepTitle}>Choose Account Type</Text> */}
      <View style={styles.titleRow}>
        <Text style={styles.stepTitle}>Choose Account Type</Text>
        <Logo />
      </View>
      <Text style={styles.stepSubtitle}>Select the type of account you'd like to open</Text>

      <View style={styles.accountTypesList}>
        {accountTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={styles.accountTypeCard}
            onPress={() => handleSelectType(type.id)}
            activeOpacity={0.7}
          >
            <View style={styles.accountTypeHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name={type.icon as any} size={24} color="#000" />
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
            <Text style={styles.accountTypeName}>{type.name}</Text>
            <Text style={styles.accountTypeDescription}>{type.description}</Text>
            <View style={styles.featuresList}>
              {type.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#000000" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  const renderDetailsStep = () => {
    const selectedAccountType = accountTypes.find(t => t.id === selectedType);
    
    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={styles.titleRow}>
          <Text style={styles.stepTitle}>Account Details</Text>
          <Logo />
        </View>
        <Text style={styles.stepSubtitle}>Customize your {selectedAccountType?.name}</Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Account Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., My Savings"
              placeholderTextColor="#999"
              value={accountName}
              onChangeText={setAccountName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Initial Deposit</Text>
            <View style={styles.currencyInputWrapper}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={[styles.input, styles.currencyInput]}
                placeholder="0.00"
                placeholderTextColor="#999"
                value={initialDeposit}
                onChangeText={setInitialDeposit}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setStep('select')}
            >
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleContinueToConfirm}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderConfirmStep = () => {
    const selectedAccountType = accountTypes.find(t => t.id === selectedType);
    const deposit = parseFloat(initialDeposit) || 0;

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={styles.stepTitle}>Confirm Details</Text>
        <Text style={styles.stepSubtitle}>Review your account information</Text>

        <View style={styles.confirmCard}>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Account Type</Text>
            <Text style={styles.confirmValue}>{selectedAccountType?.name}</Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Account Name</Text>
            <Text style={styles.confirmValue}>{accountName}</Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Initial Deposit</Text>
            <Text style={styles.confirmValue}>
              ${deposit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>APY</Text>
            <Text style={styles.confirmValue}>{selectedAccountType?.features[0]}</Text>
          </View>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setStep('details')}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleCreateAccount}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Open Account</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 'select' && renderSelectStep()}
        {step === 'details' && renderDetailsStep()}
        {step === 'confirm' && renderConfirmStep()}
      </ScrollView>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 32,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  accountTypesList: {
    gap: 16,
  },
  accountTypeCard: {
    backgroundColor: '#fafafa',
    borderRadius: 7,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  accountTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  accountTypeName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  accountTypeDescription: {
    fontSize: 15,
    color: '#666',
    marginBottom: 16,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#000',
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 6,
    paddingHorizontal: 16,
    fontSize: 17,
    color: '#000',
    backgroundColor: '#fafafa',
    fontWeight: '500',
  },
  currencyInputWrapper: {
    position: 'relative',
  },
  currencySymbol: {
    position: 'absolute',
    left: 16,
    top: 18,
    fontSize: 17,
    fontWeight: '500',
    color: '#000',
    zIndex: 1,
  },
  currencyInput: {
    paddingLeft: 32,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  primaryButton: {
    flex: 1,
    height: 56,
    backgroundColor: '#000',
    borderRadius: 6,
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
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#e5e5e5',
  },
  confirmCard: {
    backgroundColor: '#fafafa',
    borderRadius: 6,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    gap: 16,
    marginBottom: 24,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmLabel: {
    fontSize: 15,
    color: '#666',
  },
  confirmValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});