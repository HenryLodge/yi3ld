import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Entypo, Ionicons, FontAwesome6, FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { addMoneyToWaitingRoom, getUserAccounts, Account } from '../services/accounts';
import { getCountryByCode, formatCurrency } from '../utils/countries';

export default function DepositScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const waitingRoomAccount = accounts.find(acc => acc.type === 'waiting-room');
  const userCountry = getCountryByCode(user?.country || 'US');

  const fetchAccounts = async () => {
    if (!user?.id) return;
    
    try {
      const userAccounts = await getUserAccounts(user.id);
      
      // Sort accounts: waiting-room first, then by type
      const sortedAccounts = userAccounts.sort((a, b) => {
        if (a.type === 'waiting-room') return -1;
        if (b.type === 'waiting-room') return 1;
        return 0;
      });
      
      setAccounts(sortedAccounts);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAccounts();
  };

  useEffect(() => {
    fetchAccounts();
  }, [user?.id]);

  const formatBalance = (amount: number) => {
      if (!balanceVisible) return '••••••';
      
      if (userCountry) {
        return formatCurrency(amount, userCountry);
      }
      
      // Fallback
      return `$${amount.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`;
    };

  const temp = async () => {
    if (!user?.id) return;
    
    try {
      // Add $100 to waiting room
      await addMoneyToWaitingRoom(user.id, 100);
      console.log('Success', '$100 added to waiting room');
      // Refresh accounts to show new balance
      fetchAccounts();
    } catch (error: any) {
      console.log('Error', error.message || 'Failed to add money');
    }
  }

  const renderAccountDropdown = (account: Account) => {
    return (
      <View style={styles.dropdownContainer}>
        <View style={styles.dropdownContent}>
          <TouchableOpacity style={styles.dropdownRow} activeOpacity={0.6}>
            <FontAwesome name="bank" size={20} color="#000" />
            <Text style={styles.dropdownLabel}>From bank</Text>
            <Ionicons name="chevron-forward" size={20} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.dropdownRow} activeOpacity={0.6}>
            <Entypo name="credit-card" size={22} color="#000" />
            <Text style={styles.dropdownLabel}>Debit Card</Text>
            <Ionicons name="chevron-forward" size={20} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.dropdownRow} activeOpacity={0.6}>
            <FontAwesome6 name="money-check" size={19} color="#000" />
            <Text style={styles.dropdownLabel}>Cash check</Text>
            <Ionicons name="chevron-forward" size={20} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.dropdownRow} onPress={temp}>
            <Text style={styles.dropdownLabelDev}>dev add</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  fetchAccounts()
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Deposit</Text>
              <View style={styles.triangleStack}>
                <Entypo name="triangle-down" size={42} color="#000" />
                <Entypo name="triangle-down" size={33} color="#9c9c9c" style={styles.triangleOverlay} />
              </View>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.visibilityButton}
            onPress={() => setBalanceVisible(!balanceVisible)}
          >
            <Ionicons 
              name={balanceVisible ? "eye" : "eye-off"}
              size={22}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.deposit}>
          <View style={styles.depositCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Waiting Room Balance</Text>
            </View>

            <View>
              <Text style={styles.balanceText}>{formatBalance(waitingRoomAccount?.balance || 0)}</Text>
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.actionButton}
              activeOpacity={0.6}
              onPress={() => setShowDropdown(!showDropdown)}
              >
                <Ionicons name="swap-horizontal" size={18} color="#ffffff" />
                <Text style={styles.actionButtonText}>Transfer</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton} 
                activeOpacity={0.6}
                onPress={() => setShowDropdown(!showDropdown)}
              >
                <Ionicons name="add-circle-outline" size={18} color="#ffffff" />
                <Text style={styles.actionButtonText}>Add Money</Text>
              </TouchableOpacity>
            </View>
          </View>
          {showDropdown && waitingRoomAccount && renderAccountDropdown(waitingRoomAccount)}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 32,
    paddingTop: 70,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
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
  visibilityButton: {
    padding: 8,
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
  deposit: {
    paddingHorizontal: 32,
  },
  depositCard: {
    backgroundColor: '#fafafa',
    borderRadius: 7,
    padding: 20,
    marginBottom: 12,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  balanceText: {
    fontSize: 45,
    fontWeight: "500",
    color: '#000',
    marginBottom: 5,
  },
  dropdownContainer: {
    marginBottom: 12,
    marginTop: -23,
  },
  dropdownContent: {
    marginTop: 5,
    backgroundColor: "transparent",
    borderTopColor: 'transparent',
    borderTopEndRadius: 0,
    borderTopLeftRadius: 0,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    gap: 12,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dropdownLabel: {
    fontSize: 14,
    color: '#000000',
    paddingLeft: 12,
    flex: 1,
  },
  dropdownLabelDev: {
    fontSize: 10,
    color: '#b0b0b0',
    paddingLeft: 12,
    flex: 1,
  },
  dropdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  dropdownActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#141414',
    paddingVertical: 12,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});