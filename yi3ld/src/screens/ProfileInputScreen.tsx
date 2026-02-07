import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableWithoutFeedback,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { useAuth } from '../hooks/useAuth';
import { Entypo } from '@expo/vector-icons';
import { createUserInFirestore, createDefaultWaitingRoom } from '../services/auth';

type ProfileInputScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ProfileInput'>;
  route: RouteProp<AuthStackParamList, 'ProfileInput'>;
};

export default function ProfileInputScreen({ navigation, route }: ProfileInputScreenProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleContinue = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required', 'Please enter both first and last name');
      return;
    }

    setLoading(true);
    
    try {
      // Get phone number and verification data from route params
      const { phoneNumber, verificationData } = route.params;
      
      // Create user object with name
      const userData = {
        id: verificationData.user.id,
        phoneNumber: verificationData.user.phoneNumber,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };
      
      // 1. Create user document in Firestore
      await createUserInFirestore(userData);
      
      // 2. Create default waiting room account
      await createDefaultWaitingRoom(userData.id);
      
      // 3. Sign in with complete user data
      await signIn(userData, verificationData.token);
      
      console.log('User setup complete!');
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Error', error.message || 'Failed to complete registration');
      console.error('Name input error:', error);
    }
  };

  const isValid = firstName.trim().length > 0 && lastName.trim().length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Profile</Text>
              <View style={styles.triangleStack}>
                <Entypo name="triangle-down" size={42} color="#000" />
                <Entypo name="triangle-down" size={33} color="#9c9c9c" style={styles.triangleOverlay} />
              </View>
            </View>
            <Text style={styles.subtitle}>
              Enter your information
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                // placeholder="First"
                placeholderTextColor="#999"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                // placeholder="Last"
                placeholderTextColor="#999"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                (!isValid || loading) && styles.buttonDisabled,
              ]}
              onPress={handleContinue}
              disabled={!isValid || loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
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
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
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
    fontSize: 40,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: '#666',
    lineHeight: 24,
    fontWeight: '400',
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
    marginBottom: -5,
    marginLeft: 2,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 6,
    paddingHorizontal: 15,
    fontSize: 17,
    color: '#000',
    backgroundColor: '#fafafa',
    fontWeight: '500',
    marginBottom: -15,
  },
  button: {
    height: 56,
    backgroundColor: '#000',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  buttonDisabled: {
    backgroundColor: '#e5e5e5',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});