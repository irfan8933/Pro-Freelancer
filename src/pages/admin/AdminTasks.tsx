import React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Task } from '../../types';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState('0');
  const [category, setCategory] = useState('Facebook');
  const [customCategory, setCustomCategory] = useState('');
  const [link, setLink] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (data) setTasks(data as Task[]);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('tasks').insert({
        title,
        description,
        reward_points: parseFloat(reward),
        category: category === 'Custom' ? customCategory : category,
        link
      });
      if (error) throw error;
      toast.success("নতুন কাজ তৈরি করা হয়েছে");
      setIsCreating(false);
      resetForm();
      fetchTasks();
    } catch (err) {
      toast.error("তৈরি করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setReward('0'); setCategory('Facebook'); setCustomCategory(''); setLink('');
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await supabase.from('tasks').update({ is_active: !current }).eq('id', id);
    fetchTasks();
  };

  return (
    <div className="min-h-full bg-slate-950 pb-20">
      <div className="sticky top-0 bg-slate-950/80 backdrop-blur-md z-10 px-4 py-4 flex items-center justify-between border-b border-slate-900">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="p-2 bg-slate-900 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h2 className="font-bold text-lg">টাস্ক ম্যানেজমেন্ট</h2>
        </div>
        {!isCreating && (
          <button onClick={() => setIsCreating(true)} className="p-2 bg-blue-600 text-white rounded-full">
            <Plus size={20} />
          </button>
        )}
      </div>

      <div className="p-4">
        {isCreating ? (
          <form onSubmit={handleCreate} className="bg-slate-900 p-5 rounded-2xl flex flex-col gap-4 border border-slate-800">
            <h3 className="font-bold">নতুন কাজ তৈরি করুন</h3>
            <input type="text" placeholder="Title" required value={title} onChange={e=>setTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm" />
            <textarea placeholder="Description" required value={description} onChange={e=>setDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm" rows={3}/>
            <div className="flex gap-2">
              <input type="number" placeholder="Points Reward" required value={reward} onChange={e=>setReward(e.target.value)} className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm" />
              <div className="w-1/2 flex flex-col gap-2">
                <select 
                  value={category} 
                  onChange={e=>setCategory(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300 outline-none"
                >
                  <option value="Facebook">Facebook</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Instagram">Instagram</option>
                  <option value="TikTok">TikTok</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Custom">Custom...</option>
                </select>
                {category === 'Custom' && (
                  <input type="text" placeholder="Custom Category name" required value={customCategory} onChange={e=>setCustomCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm" />
                )}
              </div>
            </div>
            <input type="url" placeholder="External Link (optional)" value={link} onChange={e=>setLink(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm" />
            
            <div className="flex gap-3">
              <button type="button" onClick={() => setIsCreating(false)} className="flex-1 bg-slate-800 py-3 rounded-xl">বাতিল</button>
              <button type="submit" disabled={loading} className="flex-1 bg-blue-600 font-medium py-3 rounded-xl text-white">সেভ করুন</button>
            </div>
          </form>
        ) : loading ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="grid gap-4">
            {tasks.map(t => (
              <div key={t.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                <div>
                  <h4 className="font-bold">{t.title}</h4>
                  <p className="text-xs text-blue-400 mt-1">{t.reward_points} 🪙 | {t.category}</p>
                </div>
                <button 
                  onClick={() => handleToggleActive(t.id, t.is_active)}
                  className={`text-xs px-3 py-1.5 rounded-lg ${t.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-500'}`}
                >
                  {t.is_active ? 'Active' : 'Hidden'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
