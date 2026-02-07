import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { Entypo, Ionicons } from '@expo/vector-icons';
import { getUserAccounts, Account } from '../services/accounts';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { getCountryByCode, formatCurrency } from '../utils/countries';

// Define the navigation types
type DashboardStackParamList = {
  DashboardHome: undefined;
  OpenAccount: undefined;
};

type DashboardScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<DashboardStackParamList, 'DashboardHome'>,
  BottomTabNavigationProp<any>
>;

type DashboardScreenProps = {
  navigation: DashboardScreenNavigationProp;
};

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const { user } = useAuth();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);
  
  const waitingRoomAccount = accounts.find(acc => acc.type === 'waiting-room');
  const yieldingAccounts = accounts.filter(acc => acc.type !== 'waiting-room');
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

  useEffect(() => {
    fetchAccounts();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAccounts();
  };

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

  const formatAPY = (amount: number) => {
    return balanceVisible 
      ? `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '••••••';
  };

  const getAccountSubtext = (account: Account) => {
    if (account.type === 'waiting-room') {
      return `${formatAPY(account.apy || 0) || 0}% APY`;
    }
    return account.accountNumber;
  };

  const toggleAccountExpand = (accountId: string) => {
    setExpandedAccountId(expandedAccountId === accountId ? null : accountId);
  };

  const renderAccountDropdown = (account: Account) => {
    return (
      <View style={styles.dropdownContainer}>
        <View style={styles.dropdownContent}>
          <View style={styles.dropdownRow}>
            <Text style={styles.dropdownLabel}>Account Type</Text>
            <Text style={styles.dropdownValue}>{account.type}</Text>
          </View>
          <View style={styles.dropdownRow}>
            <Text style={styles.dropdownLabel}>Balance</Text>
            <Text style={styles.dropdownValue}>{formatBalance(account.balance)}</Text>
          </View>
          {account.type == 'waiting-room' && (
            <View style={styles.dropdownRow}>
              <Text style={styles.dropdownLabel}>APY</Text>
              <Text style={styles.dropdownValue}>{account.apy}%</Text>
            </View>
          )}
          {account.type != 'waiting-room' && (
            <View style={styles.dropdownRow}>
              <Text style={styles.dropdownLabel}>APY</Text>
              <Text style={styles.dropdownValue}>{account.apy}%</Text>
            </View>
          )}
          {account.type != 'waiting-room' && (
            <View style={styles.dropdownRow}>
              <Text style={styles.dropdownLabel}>Earned</Text>
              <Text style={styles.dropdownValue}>not impl</Text>
            </View>
          )}
          
          {account.type === 'waiting-room' ? (
            <View style={styles.dropdownActions}>
              <TouchableOpacity style={styles.actionButton} activeOpacity={0.6}>
                <Ionicons name="swap-horizontal" size={18} color="#ffffff" />
                <Text style={styles.actionButtonText}>Transfer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} activeOpacity={0.6} onPress={() => navigation.navigate('DepositScreen')}>
                <Ionicons name="add-circle-outline" size={18} color="#ffffff" />
                <Text style={styles.actionButtonText}>Add Money</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.dropdownActions}>
              <TouchableOpacity style={styles.actionButton} activeOpacity={0.6}>
                <Ionicons name="swap-horizontal" size={18} color="#ffffff" />
                <Text style={styles.actionButtonText}>Transfer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  fetchAccounts();
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
              <Text style={styles.title}>Dashboard</Text>
              <View style={styles.triangleStack}>
                <Entypo name="triangle-down" size={42} color="#000" />
                <Entypo name="triangle-down" size={33} color="#9c9c9c" style={styles.triangleOverlay} />
              </View>
            </View>
            <Text style={styles.subtitle}>Hello, {user?.firstName}</Text>
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

        <View style={styles.accountsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Accounts</Text>
          </View>

          {/* Waiting Room Card */}
          {waitingRoomAccount && (
            <View>
              <TouchableOpacity 
                style={styles.accountCardWaitingRoom}
                activeOpacity={0.7}
                onPress={() => toggleAccountExpand(waitingRoomAccount.id)}
              >
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>Waiting Room</Text>
                  <Text style={styles.accountNumber}>
                    {formatAPY(waitingRoomAccount.apy || 0)}% APY
                  </Text>
                </View>
                <View style={styles.accountRight}>
                  <Text style={styles.accountBalance}>
                    {formatBalance(waitingRoomAccount.balance || 0)}
                  </Text>
                  <Ionicons 
                    name={expandedAccountId === waitingRoomAccount.id ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#999" 
                  />
                </View>
              </TouchableOpacity>
              {expandedAccountId === waitingRoomAccount.id && renderAccountDropdown(waitingRoomAccount)}
            </View>
          )}

          {/* Yielding Accounts Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Yielding Accounts</Text>
            <TouchableOpacity onPress={() => navigation.navigate('OpenAccount')}>
              <Ionicons name="add-circle-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000" />
            </View>
          ) : yieldingAccounts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No yielding accounts yet</Text>
              <Text style={styles.emptySubtext}>Add account to get started</Text>
            </View>
          ) : (
            yieldingAccounts.map((account) => (
              <View key={account.id}>
                <TouchableOpacity 
                  style={styles.accountCard}
                  activeOpacity={0.7}
                  onPress={() => toggleAccountExpand(account.id)}
                >
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>{account.name}</Text>
                    <Text style={styles.accountNumber}>{getAccountSubtext(account)}</Text>
                  </View>
                  <View style={styles.accountRight}>
                    <Text style={styles.accountBalance}>
                      {formatBalance(account.balance)}
                    </Text>
                    <Ionicons 
                      name={expandedAccountId === account.id ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#999" 
                    />
                  </View>
                </TouchableOpacity>
                {expandedAccountId === account.id && renderAccountDropdown(account)}
              </View>
            ))
          )}
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
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    fontSize: 22,
    fontWeight: '600',
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
  accountsSection: {
    paddingHorizontal: 32,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 35,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  accountCard: {
    backgroundColor: '#fafafa',
    borderRadius: 6,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  accountCardWaitingRoom: {
    backgroundColor: '#f0f0f0',
    borderRadius: 7,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 14,
    color: '#666',
  },
  accountRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountBalance: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dropdownLabel: {
    fontSize: 14,
    color: '#666',
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