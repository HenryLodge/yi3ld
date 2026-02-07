import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { formatPhoneNumberDisplay } from '../utils/utilFunctions';
import { Entypo } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Profile</Text>
          <View style={styles.triangleStack}>
            <Entypo name="triangle-down" size={42} color="#000" />
            <Entypo name="triangle-down" size={33} color="#9c9c9c" style={styles.triangleOverlay} />
          </View>
        </View>
        <Text style={styles.label}>First Name</Text>
        <Text style={styles.value}>{user?.firstName}</Text>
        <Text style={styles.label}>Last Name</Text>
        <Text style={styles.value}>{user?.lastName}</Text>
        <Text style={styles.label}>Phone Number</Text>
        <Text style={styles.value}>{formatPhoneNumberDisplay(user?.phoneNumber)}</Text>

        <TouchableOpacity style={styles.button} onPress={handleSignOut}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    paddingTop: 70,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
  },
  triangleStack: {
    position: 'relative',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -8,
    marginLeft: -3,
  },
  triangleOverlay: {
    position: 'absolute',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: '#000',
    marginBottom: 32,
  },
  button: {
    height: 56,
    backgroundColor: '#000',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});