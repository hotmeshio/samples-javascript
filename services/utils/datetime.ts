import Moment from 'moment';

export function unixTimestamp(date: Date | null): number | null {
  if (!date) return null;
  return Moment(date).unix();
}

export function dateTimestamp(date: Date | null): string | null {
  if (!date) return null;
  return Moment(date).format('YYYYMMDD');
}
