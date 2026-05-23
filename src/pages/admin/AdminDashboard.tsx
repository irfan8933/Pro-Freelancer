import { Link } from 'react-router-dom';
import { Users, FileText, CheckCircle, HandCoins, Settings, Activity } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="p-4 flex flex-col gap-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">অ্যাডমিন ড্যাশবোর্ড</h1>
        <p className="text-slate-400 text-sm">প্ল্যাটফর্ম পরিচালনা করুন</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <AdminCard to="/admin/tasks" icon={<Activity className="text-blue-500" size={28}/>} label="টাস্ক ম্যানেজমেন্ট" />
        <AdminCard to="/admin/submissions" icon={<CheckCircle className="text-emerald-500" size={28}/>} label="সাবমিশন চেক" />
        <AdminCard to="/admin/finances" icon={<HandCoins className="text-yellow-500" size={28}/>} label="ডিপোজিট ও উইথড্র" />
        <AdminCard to="/admin/users" icon={<Users className="text-indigo-500" size={28}/>} label="ইউজার অ্যাডমিন" />
        <AdminCard to="/admin/settings" icon={<Settings className="text-slate-400" size={28}/>} label="সিস্টেম সেটিং" />
      </div>
    </div>
  );
}

function AdminCard({ to, icon, label }: any) {
  return (
    <Link to={to} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 hover:bg-slate-800 transition-colors text-center shadow-sm">
      <div className="bg-slate-950 p-4 rounded-full border border-slate-800">
        {icon}
      </div>
      <span className="font-medium text-sm text-slate-200">{label}</span>
    </Link>
  );
}
