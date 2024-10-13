import numeral from 'numeral';

export const formatNumber = (number: number | string) => {
  if (typeof number === 'string') {
    number = parseFloat(number);
  }

  if (isNaN(number)) {
    return '-';
  }

  if (number === 0) {
    return '0';
  }

  if (number >= 1) {
    if (number > 99999) {
      return numeral(number).format('0.[0]a');
    }
    if (number > 9999) {
      return numeral(number).format('0.[00]a');
    }
    return numeral(number).format('0.[00]');
  }
  if (number < 0.0001) {
    return '<0.0001';
  }
  if (number < 0.001) {
    return numeral(number).format('0.0[0000]');
  }
  if (number < 1) {
    return numeral(number).format('0.00[00]');
  }

  return numeral(number).format('0.[00]');
};
