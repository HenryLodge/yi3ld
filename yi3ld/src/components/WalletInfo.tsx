import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { getWalletBalance } from '../services/wallet';

export default function WalletInfo() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBalance();
  }, [user?.walletAddress]);

  const loadBalance = async () => {
    if (!user?.walletAddress) {
      setLoading(false);
      return;
    }

    try {
      const bal = await getWalletBalance(user.walletAddress);
      setBalance(bal);
    } catch (error) {
      console.error('Error loading balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    if (user?.walletAddress) {
      // Copy to clipboard (you'll need @react-native-clipboard/clipboard)
      Alert.alert('Copied!', 'Wallet address copied to clipboard');
    }
  };

  const viewOnExplorer = () => {
    const url = `https://sepolia.basescan.org/address/${user?.walletAddress}`;
    // Open URL (you'll need Linking from react-native)
    Alert.alert('View on Explorer', url);
  };

  if (!user?.walletAddress) {
    return (
      <View style={styles.container}>
        <Text style={styles.noWallet}>No wallet yet</Text>
        <Text style={styles.hint}>Create a yielding account to generate wallet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="wallet-outline" size={24} color="#000" />
        <Text style={styles.title}>Blockchain Wallet</Text>
      </View>

      <View style={styles.addressContainer}>
        <Text style={styles.label}>Address</Text>
        <View style={styles.addressRow}>
          <Text style={styles.address}>
            {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
          </Text>
          <TouchableOpacity onPress={copyAddress}>
            <Ionicons name="copy-outline" size={18} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.balanceContainer}>
        <Text style={styles.label}>Gas Balance</Text>
        <Text style={styles.balance}>
          {loading ? '...' : `${parseFloat(balance).toFixed(4)} ETH`}
        </Text>
      </View>

      <TouchableOpacity style={styles.explorerButton} onPress={viewOnExplorer}>
        <Ionicons name="open-outline" size={16} color="#666" />
        <Text style={styles.explorerText}>View on Explorer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  addressContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  address: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    fontFamily: 'monospace',
  },
  balanceContainer: {
    marginBottom: 12,
  },
  balance: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  explorerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  explorerText: {
    fontSize: 14,
    color: '#666',
  },
  noWallet: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  hint: {
    fontSize: 14,
    color: '#666',
  },
});