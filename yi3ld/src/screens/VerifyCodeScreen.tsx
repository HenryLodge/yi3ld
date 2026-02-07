import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { useAuth } from '../hooks/useAuth';
import { verifyCode } from '../services/auth';
import { getUserFromFirestore } from '../services/auth';
import Logo from '../components/Logo';

type VerifyCodeScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'VerifyCode'>;
  route: RouteProp<AuthStackParamList, 'VerifyCode'>;
};

export default function VerifyCodeScreen({
  navigation,
  route,
}: VerifyCodeScreenProps) {
  const { phoneNumber } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit verification code');
      return;
    }

    setLoading(true);
    
    try {
      const response = await verifyCode(code);
      
      // Check if user already exists in Firestore
      const existingUser = await getUserFromFirestore(response.user.id);
      
      if (existingUser && existingUser.firstName && existingUser.lastName) {
        // User exists - sign them in directly
        console.log('Existing user found, signing in...');
        await signIn(existingUser, response.token);
      } else {
        // New user - navigate to name input
        console.log('New user, collecting name...');
        setLoading(false);
        navigation.navigate('ProfileInput', {
          phoneNumber,
          verificationData: response,
        });
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Error', error.message || 'Invalid verification code');
      console.error('Verify code error:', error);
    }
  };

  const handleResendCode = () => {
    navigation.goBack();
  };

  const isCodeValid = code.length === 6;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>verify</Text>
            <Logo></Logo>
          </View>
          <Text style={styles.subtitle}>
            we sent a code to {phoneNumber}
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, styles.codeInput]}
            placeholder="000000"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
            maxLength={6}
          />
          <TouchableOpacity
            style={[styles.button, (!isCodeValid || loading) && styles.buttonDisabled]}
            onPress={handleVerifyCode}
            disabled={!isCodeValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.linkText}>Change phone number</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.linkButton}
              onPress={handleResendCode}
              disabled={loading}
            >
              <Text style={styles.linkText}>Resend code</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    marginBottom: -10,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  triangleStack: {
    position: 'relative',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -18,
    marginLeft: -3,
  },
  triangleOverlay: {
    position: 'absolute',
  },
  form: {
    gap: 16,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fafafa',
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: '600',
  },
  button: {
    height: 56,
    backgroundColor: '#000',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -5,
  },
  linkButton: {
    paddingVertical: 12,
  },
  linkText: {
    color: '#666',
    fontSize: 14,
  },
});