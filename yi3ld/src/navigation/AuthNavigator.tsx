import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PhoneAuthScreen from '../screens/PhoneAuthScreen';
import VerifyCodeScreen from '../screens/VerifyCodeScreen';
import ProfileInputScreen from '../screens/ProfileInputScreen';

export type AuthStackParamList = {
  PhoneAuth: undefined;
  VerifyCode: { phoneNumber: string };
  ProfileInput: { phoneNumber: string, verificationData: any };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
      <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
      <Stack.Screen name="ProfileInput" component={ProfileInputScreen} />
    </Stack.Navigator>
  );
}