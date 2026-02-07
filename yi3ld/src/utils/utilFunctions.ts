export const formatPhoneNumber = (text: string) => {
  const cleaned = text.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
  if (match) {
    return !match[2]
      ? match[1]
      : `(${match[1]}) ${match[2]}${match[3] ? '-' + match[3] : ''}`;
  }
  return text;
};

export const formatPhoneNumberDisplay = (text: any) => {
  const countryCode = text.substring(0,2);
  const areaCode = text.substring(2,5);
  const middleThree = text.substring(5,8);
  const lastFour = text.substring(8,12)
  const fomattedNumber = countryCode + " (" + areaCode + ")-" + middleThree + "-" + lastFour;
  return fomattedNumber;
};