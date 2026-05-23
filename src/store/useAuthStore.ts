import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

type AuthState = {
  user: any | null;
  profile: Profile | null;
  isLoading: boolean;
  checkSession: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  checkSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (session?.user) {
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profile) {
          // Auto create profile as fallback if trigger failed
          const ref_code = Math.random().toString(36).substring(2, 8).toUpperCase();
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || 'User',
              role: session.user.email === 'admin@profreelancer.com' ? 'admin' : 'user',
              referral_code: ref_code
            })
            .select('*')
            .single();

          if (!insertError && newProfile) {
            profile = newProfile;
          }
        }

        set({ user: session.user, profile: profile as Profile, isLoading: false });
      } else {
        set({ user: null, profile: null, isLoading: false });
      }
    } catch (e) {
      console.error('Session check error', e);
      set({ user: null, profile: null, isLoading: false });
    }
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  }
}));

// Realtime subscriptions global handler (optional)
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
    useAuthStore.getState().checkSession();
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ user: null, profile: null });
  }
});
