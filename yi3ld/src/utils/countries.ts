export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
}

export const SUPPORTED_COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', currencySymbol: '$' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', currencySymbol: 'C$' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', currency: 'MXN', currencySymbol: 'MX$' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', currency: 'RUB', currencySymbol: '₽' },
  { code: 'GB', name: 'England', flag: '🇬🇧', currency: 'GBP', currencySymbol: '£' },
  { code: 'CN', name: 'China', flag: '🇨🇳', currency: 'CNY', currencySymbol: '¥' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', currency: 'BRL', currencySymbol: 'R$' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', currency: 'AED', currencySymbol: 'د.إ' },
];

export const getCountryByCode = (code: string): Country | undefined => {
  return SUPPORTED_COUNTRIES.find(c => c.code === code);
};

export const formatCurrency = (amount: number, country: Country): string => {
  return `${country.currencySymbol}${amount.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};