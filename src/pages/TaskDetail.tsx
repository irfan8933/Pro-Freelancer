import React from 'react';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Task, Submission } from '../types';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { PageTransition } from '../components/PageTransition';
import { ArrowLeft, ExternalLink, Image as ImageIcon, Loader2, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [task, setTask] = useState<Task | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchTaskDetails();
    }
  }, [id, user]);

  const fetchTaskDetails = async () => {
    // Fetch task
    const { data: taskData } = await supabase.from('tasks').select('*').eq('id', id).single();
    if (taskData) setTask(taskData as Task);

    // Fetch user's submission if any
    const { data: subData } = await supabase
      .from('submissions')
      .select('*')
      .eq('task_id', id)
      .eq('user_id', user?.id)
      .single();
      
    if (subData) setSubmission(subData as Submission);
    
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("স্ক্রিনশট আপলোড করুন!");
    if (!user || !task) return;

    setSubmitting(true);
    try {
      // 1. Upload logic
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `submissions/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('screenshots')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get public url
      const { data: { publicUrl } } = supabase.storage
        .from('screenshots')
        .getPublicUrl(filePath);

      // 3. Create submission record
      const { error: dbError } = await supabase.from('submissions').insert({
        task_id: task.id,
        user_id: user.id,
        screenshot_url: publicUrl,
        note: note
      });

      if (dbError) throw dbError;

      toast.success("কাজটি নিখুঁতভাবে জমা দেওয়া হয়েছে!");
      fetchTaskDetails();
    } catch (err: any) {
      toast.error(err.message || 'সাবমিট করতে সমস্যা হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-slate-500" /></div>;
  if (!task) return <div className="p-10 text-center">কাজ পাওয়া যায়নি</div>;

  return (
    <PageTransition>
    <div className="bg-slate-950 min-h-screen pb-20">
      <div className="sticky top-0 bg-slate-950/80 backdrop-blur-md z-10 px-4 py-4 flex items-center gap-3 border-b border-slate-900">
        <button onClick={() => navigate(-1)} className="p-2 bg-slate-900 rounded-full hover:bg-slate-800 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-bold text-lg truncate">কাজের বিবরণ</h2>
      </div>

      <div className="p-4 flex flex-col gap-6">
        {/* Custom Logo Header for branding */}
        <div className="flex justify-center mb-2">
          <img src="https://storage.googleapis.com/aistudio-user-uploads/62f6b3b5-3162-41f7-bc32-ea7d2999e46a.png" alt="Logo" className="w-12 h-12 rounded-full object-cover bg-white opacity-80" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm"
        >
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-xl font-bold text-slate-100">{task.title}</h1>
            <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-lg text-sm font-bold whitespace-nowrap">
              {task.reward_points} 🪙
            </span>
          </div>
          
          <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
            {task.description}
          </div>

          {task.link && (
            <a 
              href={task.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
            >
              কাজ শুরু করুন <ExternalLink size={18} />
            </a>
          )}
        </motion.div>

        {/* Submission Form / Status */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm"
        >
          
          {submission ? (
            <div className="text-center py-6">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-flex justify-center items-center w-20 h-20 rounded-full bg-slate-800 mb-4 shadow-lg"
              >
                {submission.status === 'pending' && <Clock size={40} className="text-yellow-500" />}
                {submission.status === 'approved' && <CheckCircle size={40} className="text-emerald-500" />}
                {submission.status === 'rejected' && <span className="text-4xl text-red-500">❌</span>}
              </motion.div>
              
              <h4 className="text-2xl font-black capitalize mb-2">
                {submission.status === 'pending' && <span className="text-yellow-500">পেন্ডিং আছে</span>}
                {submission.status === 'approved' && <span className="text-emerald-500">গৃহীত হয়েছে</span>}
                {submission.status === 'rejected' && <span className="text-red-500">বাতিল হয়েছে</span>}
              </h4>
              
              {submission.status === 'approved' && (
                <p className="text-slate-300 text-sm mt-2 font-medium bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                  Your task has been fully verified.<br/>Your task is complete.
                </p>
              )}
              {submission.status === 'pending' && (
                <p className="text-slate-400 text-sm mt-2">আপনার প্রমাণ অ্যাডমিন দ্বারা যাচাই করা হচ্ছে।</p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <h3 className="font-bold text-lg mb-2">প্রমাণ জমা দিন</h3>
              <div className="border-2 border-dashed border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center relative hover:bg-slate-800/50 transition-colors">
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <ImageIcon size={32} className="text-slate-500 mb-2" />
                <p className="font-medium text-sm text-slate-300">
                  {file ? file.name : 'স্ক্রিনশট নির্বাচন করুন'}
                </p>
                <p className="text-xs text-slate-500 mt-1">JPG, PNG (Max 5MB)</p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block">নোট (ঐচ্ছিক)</label>
                <textarea 
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="আপনার কোন মন্তব্য থাকলে লিখুন..."
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl flex justify-center items-center gap-2 transition-colors disabled:opacity-50 mt-2"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : 'সাবমিট করুন'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
    </PageTransition>
  );
}
