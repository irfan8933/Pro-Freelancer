import React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminSettings() {
  const navigate = useNavigate();
  const [rate, setRate] = useState('');
  const [notice, setNotice] = useState('');
  const [noticeActive, setNoticeActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRate();
  }, []);

  const fetchRate = async () => {
    const { data } = await supabase.from('conversion_settings').select('*').eq('id', 1).single();
    if (data) {
      setRate(String(data.point_to_bdt_rate));
      setNotice(data.notice_text || '');
      setNoticeActive(data.notice_active || false);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('conversion_settings').update({ 
        point_to_bdt_rate: parseFloat(rate),
        notice_text: notice,
        notice_active: noticeActive
      }).eq('id', 1);
      if (error) throw error;
      toast.success("সেটিং আপডেট হয়েছে");
    } catch(err) {
      toast.error('সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-950 pb-20">
      <div className="sticky top-0 bg-slate-950/80 backdrop-blur-md z-10 px-4 py-4 flex items-center gap-3 border-b border-slate-900">
        <button onClick={() => navigate('/admin')} className="p-2 bg-slate-900 rounded-full hover:bg-slate-800 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-bold text-lg">সিস্টেম সেটিং</h2>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800">
              <h3 className="text-base font-bold text-slate-100 mb-4">পয়েন্ট টু টাকা কনভার্সন রেট</h3>
              <div className="mb-4">
                <label className="text-xs font-medium text-slate-400 mb-1 block">১ পয়েন্ট = কত টাকা?</label>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-slate-300">১ 🪙 = </span>
                  <input 
                    type="number" step="0.01" required 
                    value={rate} onChange={e=>setRate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-lg font-bold" 
                    placeholder="0.5"
                  />
                  <span className="text-xl font-bold text-slate-300">৳</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800">
              <h3 className="text-base font-bold text-slate-100 mb-4">গ্লোবাল নোটিশ (জরুরী আপডেট)</h3>
              
              <div className="flex items-center justify-between mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-sm font-bold text-slate-300">নোটিশ চালু করুন</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={noticeActive} onChange={e=>setNoticeActive(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block">নোটিশ বা বার্তার বিস্তারিত</label>
                <textarea 
                  value={notice} onChange={e=>setNotice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 resize-none h-24"
                  placeholder="ব্যবহারকারীদের জন্য জরুরী বার্তা..."
                />
              </div>
            </div>
            
            <button 
              type="submit" disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={20}/> : <><Save size={20}/> সেভ করুন</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
