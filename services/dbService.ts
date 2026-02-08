
import { DailyRecord } from '../types';

const LOCAL_STORAGE_KEY = 'ccs_v3_db';

export const dbService = {
  async loadData(): Promise<DailyRecord[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch('/api/data', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('Fetch error:', response.status, errData);
        return this.getLocalBackup();
      }

      const data = await response.json();
      if (data && Array.isArray(data)) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
      
      return this.getLocalBackup();
    } catch (error) {
      console.error('Database Load Error:', error);
      return this.getLocalBackup();
    }
  },

  async saveData(data: DailyRecord[]): Promise<boolean> {
    // ذخیره در لوکال استوریج به عنوان نسخه پشتیبان همیشگی
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));

    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server save failed:', response.status, errorText);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Cloud Save Network Error:', error);
      return false;
    }
  },

  getLocalBackup(): DailyRecord[] {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    return local ? JSON.parse(local) : [];
  }
};
