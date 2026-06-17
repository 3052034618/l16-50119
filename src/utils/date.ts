import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

export const formatDate = (
  date: string | Date | undefined,
  format = 'YYYY-MM-DD'
): string => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

export const formatDateTime = (
  date: string | Date | undefined,
  format = 'YYYY-MM-DD HH:mm:ss'
): string => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

export const isExpiringSoon = (expiryDate: string, days = 30): boolean => {
  const expiry = dayjs(expiryDate);
  const now = dayjs();
  return expiry.diff(now, 'day') <= days && expiry.diff(now, 'day') > 0;
};

export const isExpired = (expiryDate: string): boolean => {
  return dayjs(expiryDate).isBefore(dayjs());
};

export const daysUntilExpiry = (expiryDate: string): number => {
  return dayjs(expiryDate).diff(dayjs(), 'day');
};

export const addDays = (date: string | Date, days: number): string => {
  return dayjs(date).add(days, 'day').format('YYYY-MM-DD');
};

export const today = (): string => {
  return dayjs().format('YYYY-MM-DD');
};

export const now = (): string => {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
};

export default dayjs;
