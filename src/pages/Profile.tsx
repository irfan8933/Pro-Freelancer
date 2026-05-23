import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { User, Copy, LogOut, ShieldAlert, Edit3, Save, X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { PageTransition } from '../components/PageTransition';

export default function Profile() {
  const { profile, signOut } = useAuthStore();
  const [submissions, setSubmissions] = useState<any[]>([]);

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    full_name: '',
    username: '',
    phone: '',
    avatar_url: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchSubmissions();
      setEditData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        phone: profile.phone || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  const fetchSubmissions = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('submissions')
      .select('*, tasks(title, reward_points)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setSubmissions(data);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editData.full_name,
          username: editData.username,
          phone: editData.phone,
          avatar_url: editData.avatar_url
        })
        .eq('id', profile.id);
      
      if (error) throw error;
      toast.success('প্রোফাইল আপডেট হয়েছে!');
      await useAuthStore.getState().checkSession(); // Refresh profile in store
      setIsEditing(false);
    } catch (err: any) {
      toast.error('আপডেট করতে সমস্যা হয়েছে: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      toast.success("রেফারেল কোড কপি করা হয়েছে!");
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (!profile) return null;

  return (
    <PageTransition>
    <div className="p-4 flex flex-col gap-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-sm relative">
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
          >
            <Edit3 size={16} className="text-slate-300" />
          </button>
        ) : (
          <button 
            onClick={() => setIsEditing(false)}
            className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
          >
            <X size={16} className="text-slate-300" />
          </button>
        )}

        <div className="mx-auto w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-4 border-4 border-slate-800 shadow-xl overflow-hidden relative group">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User size={40} className="text-slate-500" />
          )}
        </div>
        
        {!isEditing ? (
          <>
            <h2 className="text-2xl font-bold text-slate-100">{profile.full_name}</h2>
            <p className="text-slate-400 text-sm mt-1">@{profile.username || 'user'} • {profile.phone || 'Phone N/A'}</p>
            <p className="text-slate-500 text-xs mt-1">{profile.email}</p>
            
            {profile.role === 'admin' && (
              <span className="inline-flex items-center gap-1 mt-3 bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <ShieldAlert size={14} /> Admin
              </span>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-3 mt-4 text-left">
            <div>
              <label className="text-xs text-slate-400 font-medium ml-1 block mb-1">পুরো নাম</label>
              <input type="text" value={editData.full_name} onChange={e=>setEditData({...editData, full_name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm" placeholder="Full Name"/>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium ml-1 block mb-1">ইউজারনেম</label>
              <input type="text" value={editData.username} onChange={e=>setEditData({...editData, username: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm" placeholder="Username"/>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium ml-1 block mb-1">ফোন নাম্বার</label>
              <input type="text" value={editData.phone} onChange={e=>setEditData({...editData, phone: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm" placeholder="Phone Number"/>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium ml-1 block mb-1">ছবি (URL)</label>
              <div className="relative">
                <input type="text" value={editData.avatar_url} onChange={e=>setEditData({...editData, avatar_url: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm" placeholder="https://..."/>
                <ImageIcon size={16} className="absolute left-3 top-2.5 text-slate-500" />
              </div>
            </div>
            <button 
              onClick={handleSaveProfile}
              disabled={saving}
              className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              {saving ? 'সংরক্ষণ হচ্ছে...' : <><Save size={18}/> সেভ করুন</>}
            </button>
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-400 mb-4 px-2">আপনার রেফারেল কোড</h3>
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <span className="font-mono text-xl font-bold tracking-widest text-emerald-400">{profile.referral_code}</span>
          <button onClick={handleCopy} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
            <Copy size={18} className="text-slate-300" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-3 px-2">
          বন্ধুদের ইনভাইট করে বোনাস পান। আপনার কোড শেয়ার করুন।
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-400 mb-4 px-2">সাবমিশন অ্যালার্ট (শেষ ৫টি)</h3>
        {submissions.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-4">কোন সাবমিশন নেই</p>
        ) : (
          <div className="flex flex-col gap-3">
            {submissions.map((sub, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm text-slate-200 truncate w-40">{sub.tasks?.title}</h4>
                  <p className="text-xs text-blue-400 font-medium mt-1">পুরস্কার: {sub.tasks?.reward_points} 🪙</p>
                </div>
                <div>
                  {sub.status === 'pending' && <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[10px] px-2 py-1 rounded-md font-bold">পেন্ডিং</span>}
                  {sub.status === 'approved' && <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] px-2 py-1 rounded-md font-bold">সফল</span>}
                  {sub.status === 'rejected' && <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] px-2 py-1 rounded-md font-bold">বাতিল</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button 
        onClick={handleLogout}
        className="mt-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-red-400 font-medium py-4 rounded-2xl flex justify-center items-center gap-2 transition-colors"
      >
        <LogOut size={20} /> লগ আউট করুন
      </button>
    </div>
    </PageTransition>
  );
}
