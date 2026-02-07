import { getCountryByCode } from '../utils/countries';

export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  const rates: { [key: string]: { [key: string]: number } } = {
    'USD': { 'GBP': 0.79, 'EUR': 0.92, 'CAD': 1.36, 'MXN': 17.5, 'RUB': 92, 'CNY': 7.2, 'BRL': 5.0, 'AED': 3.67 },
    'GBP': { 'USD': 1.27, 'EUR': 1.17, 'CAD': 1.72, 'MXN': 22.15, 'RUB': 116, 'CNY': 9.11, 'BRL': 6.33, 'AED': 4.65 },
    'EUR': { 'USD': 1.09, 'GBP': 0.86, 'CAD': 1.48, 'MXN': 19.05, 'RUB': 100, 'CNY': 7.85, 'BRL': 5.45, 'AED': 4.00 },
    'CAD': { 'USD': 0.74, 'GBP': 0.58, 'EUR': 0.68, 'MXN': 12.87, 'RUB': 67.6, 'CNY': 5.29, 'BRL': 3.68, 'AED': 2.70 },
    'MXN': { 'USD': 0.057, 'GBP': 0.045, 'EUR': 0.052, 'CAD': 0.078, 'RUB': 5.26, 'CNY': 0.41, 'BRL': 0.29, 'AED': 0.21 },
    'RUB': { 'USD': 0.011, 'GBP': 0.0086, 'EUR': 0.01, 'CAD': 0.015, 'MXN': 0.19, 'CNY': 0.078, 'BRL': 0.054, 'AED': 0.040 },
    'CNY': { 'USD': 0.139, 'GBP': 0.110, 'EUR': 0.127, 'CAD': 0.189, 'MXN': 2.43, 'RUB': 12.8, 'BRL': 0.69, 'AED': 0.51 },
    'BRL': { 'USD': 0.20, 'GBP': 0.158, 'EUR': 0.183, 'CAD': 0.272, 'MXN': 3.5, 'RUB': 18.4, 'CNY': 1.44, 'AED': 0.73 },
    'AED': { 'USD': 0.272, 'GBP': 0.215, 'EUR': 0.25, 'CAD': 0.370, 'MXN': 4.77, 'RUB': 25, 'CNY': 1.96, 'BRL': 1.37 },
  };
  
  if (fromCurrency === toCurrency) return 1.0;
  
  if (rates[fromCurrency] && rates[fromCurrency][toCurrency]) {
    return rates[fromCurrency][toCurrency];
  }
  
  return 1.0;
}

export async function sendInternationalPayment(
  senderCountry: string,
  recipientCountry: string,
  amount: number,
  recipientWalletId: string
): Promise<{
  success: boolean;
  txHash: string;
  amountSent: number;
  amountReceived: number;
  exchangeRate: number;
  fee: number;
  settlementTime: number;
}> {
  try {
    console.log('Processing international transfer (Mock XRPL)');
    console.log(`From: ${senderCountry} → To: ${recipientCountry}`);
    console.log(`Amount: ${amount}`);
    
    const senderCurrency = getCountryByCode(senderCountry)?.currency || 'USD';
    const recipientCurrency = getCountryByCode(recipientCountry)?.currency || 'USD';
    
    const rate = await getExchangeRate(senderCurrency, recipientCurrency);
    const amountReceived = amount * rate;
    
    console.log(`Rate: 1 ${senderCurrency} = ${rate} ${recipientCurrency}`);
    console.log(`Recipient receives: ${amountReceived.toFixed(2)} ${recipientCurrency}`);
    
    const mockTxHash = Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('').toUpperCase();
    
    // simulate 3-second
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      success: true,
      txHash: mockTxHash,
      amountSent: amount,
      amountReceived: amountReceived,
      exchangeRate: rate,
      fee: 0.00001,
      settlementTime: 3.2
    };
    
  } catch (error: any) {
    console.error('❌ XRPL transfer error:', error);
    throw error;
  }
}


export async function getXRPLFee(): Promise<number> {
  return 0.00001; // Mock fee
}


export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rate: number
): number {
  if (fromCurrency === toCurrency) return amount;
  return amount * rate;
}