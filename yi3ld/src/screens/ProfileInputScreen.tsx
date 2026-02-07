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
  Modal,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { useAuth } from '../hooks/useAuth';
import { Entypo, Ionicons } from '@expo/vector-icons';
import { createUserInFirestore, createDefaultWaitingRoom } from '../services/auth';
import { SUPPORTED_COUNTRIES, Country } from '../utils/countries';

type ProfileInputScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ProfileInput'>;
  route: RouteProp<AuthStackParamList, 'ProfileInput'>;
};

export default function ProfileInputScreen({ navigation, route }: ProfileInputScreenProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(SUPPORTED_COUNTRIES[0]); // Default US
  const [showCountryPicker, setShowCountryPicker] = useState(false);
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
      const { phoneNumber, verificationData } = route.params;
      
      const userData = {
        id: verificationData.user.id,
        phoneNumber: verificationData.user.phoneNumber,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        country: selectedCountry.code,
        currency: selectedCountry.currency,
        currencySymbol: selectedCountry.currencySymbol,
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
              <Text style={styles.title}>profile</Text>
              <View style={styles.triangleStack}>
                <Entypo name="triangle-down" size={42} color="#000" />
                <Entypo name="triangle-down" size={33} color="#9c9c9c" style={styles.triangleOverlay} />
              </View>
            </View>
            <Text style={styles.subtitle}>
              enter your information
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>first name</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor="#999"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>last name</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor="#999"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>country</Text>
              <TouchableOpacity
                style={styles.countrySelector}
                onPress={() => setShowCountryPicker(true)}
              >
                <View style={styles.countryContent}>
                  <Text style={styles.flagText}>{selectedCountry.flag}</Text>
                  <Text style={styles.countryText}>{selectedCountry.name}</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
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

          {/* Country Picker Modal */}
          <Modal
            visible={showCountryPicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowCountryPicker(false)}
          >
            <TouchableWithoutFeedback onPress={() => setShowCountryPicker(false)}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Select Country</Text>
                      <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                        <Ionicons name="close" size={24} color="#000" />
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.countryList}>
                      {SUPPORTED_COUNTRIES.map((country) => (
                        <TouchableOpacity
                          key={country.code}
                          style={[
                            styles.countryItem,
                            selectedCountry.code === country.code && styles.countryItemSelected
                          ]}
                          onPress={() => {
                            setSelectedCountry(country);
                            setShowCountryPicker(false);
                          }}
                        >
                          <View style={styles.countryItemContent}>
                            <Text style={styles.countryItemFlag}>{country.flag}</Text>
                            <View style={styles.countryItemInfo}>
                              <Text style={styles.countryItemName}>{country.name}</Text>
                              <Text style={styles.countryItemCurrency}>
                                {country.currency} ({country.currencySymbol})
                              </Text>
                            </View>
                          </View>
                          {selectedCountry.code === country.code && (
                            <Ionicons name="checkmark-circle" size={24} color="#000" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
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
  countrySelector: {
    height: 56,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 6,
    paddingHorizontal: 15,
    backgroundColor: '#fafafa',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -15,
  },
  countryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flagText: {
    fontSize: 28,
  },
  countryText: {
    fontSize: 17,
    color: '#000',
    fontWeight: '500',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  countryList: {
    paddingTop: 8,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  countryItemSelected: {
    backgroundColor: '#fafafa',
  },
  countryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  countryItemFlag: {
    fontSize: 32,
  },
  countryItemInfo: {
    flex: 1,
  },
  countryItemName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  countryItemCurrency: {
    fontSize: 14,
    color: '#666',
  },
});
