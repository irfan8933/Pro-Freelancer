import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Ban, DollarSign, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [isAdd, setIsAdd] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  };

  const handleToggleBan = async (id: string, is_banned: boolean) => {
    try {
      const { error } = await supabase.from('profiles').update({ is_banned: !is_banned }).eq('id', id);
      if (error) throw error;
      toast.success(!is_banned ? 'ব্যান করা হয়েছে' : 'উন্মুক্ত করা হয়েছে');
      fetchUsers();
    } catch(err) {
      toast.error('সমস্যা হয়েছে');
    }
  };

  const handleBalanceAction = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return toast.error('সঠিক এমাউন্ট দিন');
    if (!selectedUser) return;
    
    setActionLoading(true);
    let newBalance = Number(selectedUser.balance);
    if (isAdd) {
      newBalance += Number(amount);
    } else {
      newBalance -= Number(amount);
      if (newBalance < 0) newBalance = 0;
    }

    try {
      const { error } = await supabase.from('profiles').update({ balance: newBalance }).eq('id', selectedUser.id);
      if (error) throw error;
      toast.success('ব্যালেন্স আপডেট সফল');
      setSelectedUser(null);
      setAmount('');
      fetchUsers();
    } catch(err) {
      toast.error('ব্যালেন্স আপডেট ব্যর্থ');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-950 pb-20">
      <div className="sticky top-0 bg-slate-950/80 backdrop-blur-md z-10 px-4 py-4 flex items-center gap-3 border-b border-slate-900">
        <button onClick={() => navigate('/admin')} className="p-2 bg-slate-900 rounded-full hover:bg-slate-800 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-bold text-lg">ইউজার ম্যানেজমেন্ট</h2>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="grid gap-3">
            {users.map(u => (
              <div key={u.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <img src={u.avatar_url || 'https://storage.googleapis.com/aistudio-user-uploads/62f6b3b5-3162-41f7-bc32-ea7d2999e46a.png'} alt="user" className="w-12 h-12 rounded-full object-cover bg-white" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-200">{u.full_name} {u.role === 'admin' && <span className="px-2 py-0.5 ml-2 bg-red-500/20 text-red-500 text-[10px] rounded-lg">ADMIN</span>}</h4>
                      <p className="text-xs text-slate-400">@{u.username || 'user'}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                      <p className="text-xs text-slate-400 font-mono mt-1">{u.phone}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                  <p className="text-xs font-bold text-emerald-400">৳{u.balance} <span className="text-slate-500 mx-1">|</span> {u.points} pts</p>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setSelectedUser(u); setIsAdd(true); setAmount(''); }}
                      className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg text-xs font-bold transition-colors"
                    >
                      + ৳
                    </button>
                    <button 
                      onClick={() => { setSelectedUser(u); setIsAdd(false); setAmount(''); }}
                      className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded-lg text-xs font-bold transition-colors"
                    >
                      - ৳
                    </button>
                    {u.role !== 'admin' && (
                      <button 
                        onClick={() => handleToggleBan(u.id, u.is_banned)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${u.is_banned ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-red-500 hover:text-white'}`}
                      >
                        {u.is_banned ? 'ব্যানড' : 'ব্যান করুন'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-slate-800">
            <h3 className="font-bold text-lg mb-1">{isAdd ? 'ব্যালেন্স যুক্ত করুন' : 'ব্যালেন্স কাটুন'}</h3>
            <p className="text-sm text-slate-400 mb-4">{selectedUser.full_name}-এর অ্যাকাউন্টে পরিবর্তন</p>
            
            <div className="mb-4">
              <input 
                type="number" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="এমাউন্ট দিন"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none"
              />
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setSelectedUser(null)}
                className="flex-1 py-3 bg-slate-800 rounded-xl font-medium"
              >
                বাতিল
              </button>
              <button 
                onClick={handleBalanceAction}
                disabled={actionLoading}
                className="flex-1 py-3 bg-blue-600 rounded-xl font-bold text-white flex justify-center items-center"
              >
                {actionLoading ? <Loader2 className="animate-spin" size={20} /> : 'কনফার্ম'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
