import type { Session } from '@supabase/supabase-js';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

import { unregisterPush } from '@/features/notifications/push';

import { fetchProfile, type Profile } from './api';

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  /** 氏名・電話が入っている（予約できる） */
  isRegistered: boolean;
  /** セッション、またはそのユーザーのプロフィールを読み込み中 */
  loading: boolean;
  refreshProfile: () => Promise<Profile | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

/** どのユーザーのプロフィールを読み終えたか。ログイン直後の「読み込み前」を区別するため */
type LoadedProfile = { userId: string; profile: Profile | null };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [loaded, setLoaded] = useState<LoadedProfile | null>(null);
  // メールアドレスの変更などでユーザーが更新されたらプロフィールを取り直す
  const [userVersion, setUserVersion] = useState(0);

  const userId = session?.user.id;

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setSessionReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      setSessionReady(true);
      if (event === 'USER_UPDATED') setUserVersion((v) => v + 1);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    fetchProfile(userId)
      .catch(() => null)
      .then((profile) => {
        if (active) setLoaded({ userId, profile });
      });
    return () => {
      active = false;
    };
  }, [userId, userVersion]);

  const refreshProfile = useCallback(async () => {
    if (!userId) return null;
    const profile = await fetchProfile(userId);
    setLoaded({ userId, profile });
    return profile;
  }, [userId]);

  const signOut = useCallback(async () => {
    // この端末に別の人の通知が届かないよう、先に端末トークンを外す
    await unregisterPush().catch(() => {});
    await supabase.auth.signOut();
  }, []);

  // 別のユーザーの読み込み結果は使わない
  const profile = userId && loaded?.userId === userId ? loaded.profile : null;
  const loading = !sessionReady || (!!userId && loaded?.userId !== userId);

  const value: AuthState = {
    session,
    profile,
    isRegistered: isProfileComplete(profile),
    loading,
    refreshProfile,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth は AuthProvider の中で使う');
  return value;
}

/** 氏名・電話が入っているか */
export function isProfileComplete(profile: Profile | null): boolean {
  return !!profile && profile.name !== '' && profile.phone !== '';
}
