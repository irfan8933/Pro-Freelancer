export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  balance: number;
  pending_balance: number;
  points: number;
  referral_code: string;
  invited_by: string | null;
  is_banned: boolean;
  avatar_url?: string | null;
  username?: string | null;
  created_at: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  reward_points: number;
  link: string;
  category: string;
  is_active: boolean;
  created_at: string;
};

export type Submission = {
  id: string;
  task_id: string;
  user_id: string;
  screenshot_url: string;
  note: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  task?: Task;
  user?: Profile;
};

export type DepositRequest = {
  id: string;
  user_id: string;
  amount: number;
  transaction_id: string;
  screenshot_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user?: Profile;
};

export type WithdrawRequest = {
  id: string;
  user_id: string;
  amount: number;
  bkash_number: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user?: Profile;
};

export type ConversionSetting = {
  id: number;
  point_to_bdt_rate: number;
  notice_text?: string;
  notice_active?: boolean;
};

export type PointLedger = {
  id: string;
  user_id: string;
  task_id: string | null;
  points: number;
  reason: string;
  created_at: string;
};
