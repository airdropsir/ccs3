
import { createClient } from '@supabase/supabase-js';
import { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // بررسی وجود متغیرهای محیطی
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ 
      error: 'تنظیمات Supabase (URL یا Key) در ورسل انجام نشده است. لطفاً Environment Variables را چک کنید.' 
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const RECORD_ID = 'main_records';

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('ccs_storage')
        .select('data')
        .eq('id', RECORD_ID)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return res.status(200).json(data?.data || []);
    }

    if (req.method === 'POST') {
      const newData = req.body;
      
      // لاگ برای عیب‌یابی در کنسول ورسل
      console.log('Attempting to save data length:', Array.isArray(newData) ? newData.length : 'unknown');

      const { error } = await supabase
        .from('ccs_storage')
        .upsert({ id: RECORD_ID, data: newData });

      if (error) {
        console.error('Supabase Upsert Error:', error);
        throw error;
      }
      
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'متد غیرمجاز' });
  } catch (error: any) {
    console.error('API Handler Error:', error);
    return res.status(500).json({ 
      error: 'خطا در ارتباط با دیتابیس: ' + (error.message || 'خطای ناشناخته'),
      details: error.hint || ''
    });
  }
}
