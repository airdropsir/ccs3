
import { DailyRecord } from '../types';

const LOCAL_STORAGE_KEY = 'ccs_v3_db';

export const dbService = {
  async loadData(): Promise<DailyRecord[]> {
    try {
      // استفاده از سیگنال تایم‌اوت برای جلوگیری از معطل ماندن در شبکه‌های ضعیف
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/data', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('API Endpoint not found. Running in local mode.');
        } else {
          throw new Error(`Server responded with ${response.status}`);
        }
        return this.getLocalBackup();
      }

      const data = await response.json();
      // آپدیت کردن بک‌آپ محلی با آخرین دیتای دریافتی از ابر
      if (data && Array.isArray(data)) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
      
      return this.getLocalBackup();
    } catch (error) {
      console.error('Database Sync Error:', error);
      return this.getLocalBackup();
    }
  },

  async saveData(data: DailyRecord[]): Promise<boolean> {
    // اول همیشه ذخیره در لوکال برای اطمینان
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));

    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch (error) {
      console.error('Cloud Save Error:', error);
      return false;
    }
  },

  getLocalBackup(): DailyRecord[] {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    return local ? JSON.parse(local) : [];
  }
};
