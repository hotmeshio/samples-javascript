import Moment from 'moment';

export const unixTimestamp = (date: Date | null): number | null => {
  if (!date) return null;
  return Moment(date).unix();
};

export const dateTimestamp =(date: Date | null): string | null => {
  if (!date) return null;
  return Moment(date).format('YYYYMMDD');
};

export const testCount = (base: number, exponent: number, type?: string): number => {
  if (type === 'batch') {
    return base * exponent;
  } else if (base === 1) {
    return exponent;
  }
  return (Math.pow(base, exponent) - 1) / (base - 1);
};

export const arrayToHash = (response: [number, ...Array<string | string[]>]): Record<string, string>[] => {
  const results: Record<string, string>[] = [];

  for (let i = 1; i < response.length; i++) { // ignore count
    const row = response[i];
    const result: Record<string, string> = {};
    if (Array.isArray(row)) { // Check if row is an array
      for (let j = 0; j < row.length; j += 2) {
        const key = row[j];
        const value = row[j + 1];
        result[key] = value;
      }
    }
    results.push(result);
  }
  return results;
};


/**
 * Safely serialize order data for storage in Redis
 * @param obj
 */
export const safeData = (obj: Record<string, any>) => {
  return Object.keys(obj).reduce((acc, key: string) => {
    if (obj[key] !== undefined && obj[key] !== null) {
      acc[key as string] = obj[key].toString();
    }
    return acc;
  }, {} as Record<string, any>);
};
