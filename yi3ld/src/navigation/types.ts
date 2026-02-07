import { Account } from "../services/accounts";

export type DashboardStackParamList = {
  DashboardHome: undefined;
  OpenAccount: undefined;
  DepositScreen: undefined;
  SendMoney: undefined;
  SendToYieldAccount: { account: Account };
  DevFunding: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Deposit: undefined;
  Profile: undefined;
};