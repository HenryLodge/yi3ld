import React, { useState, useRef } from 'react';
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
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { auth } from '../../FirebaseConfig';
import { PhoneAuthProvider } from 'firebase/auth';
import { setVerificationId } from '../services/auth';
import { formatPhoneNumber } from '../utils/utilFunctions';
import Logo from '../components/Logo';

type PhoneAuthScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'PhoneAuth'>;
};

export default function PhoneAuthScreen({ navigation }: PhoneAuthScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const recaptchaVerifier = useRef(null);

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const handleSendCode = async () => {
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    
    if (cleanedPhone.length !== 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    
    try {
      const formattedPhone = `+1${cleanedPhone}`;
      const phoneProvider = new PhoneAuthProvider(auth);
      
      const verificationId = await phoneProvider.verifyPhoneNumber(
        formattedPhone,
        recaptchaVerifier.current!
      );
      
      setVerificationId(verificationId);
      setLoading(false);
      navigation.navigate('VerifyCode', { phoneNumber });
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Error', error.message || 'Failed to send verification code');
      console.error('Send code error:', error);
    }
  };

  const isPhoneValid = phoneNumber.replace(/\D/g, '').length === 10;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={auth.app.options}
        attemptInvisibleVerification={false}
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>YieldWay</Text>
            <Logo></Logo>
          </View>
          <Text style={styles.subtitle}>
            F*ck banks, earn yield on your checking account
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="(555) 123-4567"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={handlePhoneChange}
            maxLength={14}
          />
          <TouchableOpacity
            style={[styles.button, (!isPhoneValid || loading) && styles.buttonDisabled]}
            onPress={handleSendCode}
            disabled={!isPhoneValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
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
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14.5,
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
});