
import { createClient } from '@supabase/supabase-js';
import { VercelRequest, VercelResponse } from '@vercel/node';

// این متغیرها توسط Vercel بعد از اتصال Supabase تزریق می‌شوند
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
      
      const { error } = await supabase
        .from('ccs_storage')
        .upsert({ id: RECORD_ID, data: newData });

      if (error) throw error;
      
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'متد غیرمجاز' });
  } catch (error: any) {
    console.error('Supabase Error:', error);
    return res.status(500).json({ error: 'خطا در ارتباط با بانک اطلاعاتی رایگان: ' + error.message });
  }
}
