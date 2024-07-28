export function arrayToHash(response: [number, ...Array<string | string[]>]): Record<string, string>[] {
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
}
