'use client'

import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { log } from '@/utils/logger'
import { debounce } from 'lodash'

interface AuthContextType {
  user: ExtendedUser | null
  userPlan: 'free' | 'pro'
  credits: number
  loading: boolean
  isCountingDown: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (data: SignUpData) => Promise<any>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (data: UpdateProfileData) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  addCredits: (minutes: number) => Promise<void>
  useCredits: (seconds: number) => Promise<void>
  checkCreditsAndPlan: () => Promise<void>
  startCreditCycle: () => void
  stopCreditCycle: () => void
  finalizeCreditCycle: (secondsUsed: number) => Promise<void>
}

interface UserProfile {
  user_id: string
  email: string
  name: string
  plan_type: 'free' | 'pro'
  daily_credits_reset: string
  phone: string
}

// Definir interface extendida do User
interface ExtendedUser extends User {
  name?: string;
  phone?: string;
  dateOfBirth?: string;
  credits_amount: number;
  plan_type: 'free' | 'pro';
  daily_credits_reset: string;
}

interface SignUpData {
  email: string
  password: string
  name: string
  phone: string
  dateOfBirth: string
}

interface UpdateProfileData {
  name: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const shouldFetchRef = useRef<boolean>(true);
  const supabase = createClient();

  // Inicialização do auth - apenas no login
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetchUserData(); // Busca inicial
        }
        
        // Configurar listener apenas para mudanças de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
          console.log('Auth state changed:', event);
          if (event === 'SIGNED_IN') {
            await fetchUserData(); // Busca no login
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setUserPlan('free');
            setCredits(0);
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Erro na inicialização:', error);
      }
    };

    initializeAuth();
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        console.error('Erro na sessão:', sessionError);
        setUser(null);
        setCredits(0);
        setUserPlan('free');
        setLoading(false);
        return;
      }

      // Buscar dados do usuário do public.user_profiles
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (profileError || !userProfile) {
        console.error('Erro ao buscar perfil:', profileError);
        setLoading(false);
        return;
      }

      console.log('Dados do perfil recebidos:', userProfile);

      // Garantir que os créditos sejam um número
      const creditsAmount = Number(userProfile.credits_amount) || 1800;
      
      // Atualizar user com dados do perfil
      const updatedUser = {
        ...session.user,
        name: userProfile.name || '',
        phone: userProfile.phone || '',
        dateOfBirth: userProfile.date_of_birth || '',
        credits_amount: creditsAmount,
        plan_type: userProfile.plan_type || 'free',
        daily_credits_reset: userProfile.daily_credits_reset || new Date().toISOString()
      } as ExtendedUser;

      setUser(updatedUser);
      setUserPlan(userProfile.plan_type || 'free');
      setCredits(creditsAmount);
      
      console.log('Estados atualizados:', {
        user: updatedUser,
        plan: userProfile.plan_type,
        credits: creditsAmount
      });

    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      setUser(null);
      setCredits(0);
      setUserPlan('free');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Função para buscar dados apenas se não estiver em um ciclo
  const safeFetchUserData = useCallback(async () => {
    if (!shouldFetchRef.current) {
      console.log('Busca de dados pausada durante ciclo de uso');
      return;
    }
    await fetchUserData();
  }, [fetchUserData]);

  // Atualizar dados a cada minuto e em mudanças de rota
  useEffect(() => {
    if (!user) return;

    // Atualizar a cada 1 minuto
    const interval = setInterval(() => {
      if (shouldFetchRef.current) {
        console.log('Atualizando dados do usuário (intervalo de 1 minuto)');
        safeFetchUserData();
      }
    }, 60000);

    // Atualizar em mudanças de rota
    const handleRouteChange = () => {
      if (user && shouldFetchRef.current) {
        console.log('Rota alterada, atualizando dados do usuário');
        safeFetchUserData();
      }
    };

    // Atualizar no refresh da página
    const handleVisibilityChange = () => {
      if (!document.hidden && user && shouldFetchRef.current) {
        console.log('Página visível novamente (refresh), atualizando dados do usuário');
        safeFetchUserData();
      }
    };

    window.addEventListener('popstate', handleRouteChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('popstate', handleRouteChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, safeFetchUserData]);

  const signUp = useCallback(async (data: SignUpData) => {
    try {
      if (!data.email || !data.password) {
        throw new Error('Email e senha são obrigatórios')
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            phone: data.phone,
            dateOfBirth: data.dateOfBirth
          }
        }
      })

      if (signUpError) {
        throw signUpError
      }

      if (!authData.user) {
        throw new Error('Usuário não foi criado')
      }

      return authData.user
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      throw error
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email ou senha incorretos')
        }
        throw error
      }

      if (data.user) {
        setLoading(true); // Indica que está carregando
        await fetchUserData(); // Busca os dados do usuário
        console.log('Login realizado, dados atualizados'); // Log para debug
      }
    } catch (error: any) {
      log.error('Erro no login:', error)
      throw error
    }
  }, [supabase, fetchUserData]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    stopCreditCycle()
  }, [supabase])

  const addCredits = useCallback(async (minutes: number) => {
    if (!user) throw new Error('Usuário não autenticado')

    const { error } = await supabase.rpc('auth.add_credits', { 
      p_user_id: user.id, 
      p_minutes: minutes 
    })

    if (error) throw error
    await fetchUserData()
  }, [user, supabase, fetchUserData])

  const updateProfile = useCallback(async (data: UpdateProfileData) => {
    if (!user) throw new Error('Usuário não autenticado')
    
    const { data: currentUser, error: getUserError } = await supabase.auth.getUser()
    if (getUserError) throw getUserError

    const { error } = await supabase.auth.updateUser({
      data: {
        ...currentUser.user.user_metadata,
        name: data.name
      }
    })
    
    if (error) throw error
    await fetchUserData()
  }, [user, supabase, fetchUserData])

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ 
      password: password
    })
    if (error) throw error
  }, [supabase])

  // Atualizar créditos em tempo real
  const updateCredits = useCallback(async (newCredits: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ credits_amount: newCredits })
        .eq('user_id', user.id);

      if (error) throw error;
      
      setCredits(newCredits);
      await fetchUserData(); // Recarregar dados após atualização
    } catch (error) {
      console.error('Erro ao atualizar créditos:', error);
    }
  }, [user, supabase, fetchUserData]);

  const useCredits = useCallback(async (seconds: number) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const newCredits = Math.max(credits - seconds, 0);
      await updateCredits(newCredits);
    } catch (error) {
      console.error('Erro ao usar créditos:', error);
      throw error;
    }
  }, [user, credits, updateCredits]);

  const startCreditCycle = useCallback(() => {
    if (credits > 0 && !isCountingDown) {
      console.log('Iniciando ciclo, pausando busca de dados');
      shouldFetchRef.current = false; // Pausa a busca de dados
      setIsCountingDown(true);
      // Apenas atualiza o estado local durante a gravação
      intervalRef.current = setInterval(() => {
        setCredits(prevCredits => {
          if (prevCredits > 0) {
            return prevCredits - 1;
          }
          stopCreditCycle();
          return 0;
        });
      }, 1000);
    }
  }, [credits, isCountingDown]);

  const stopCreditCycle = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    console.log('Ciclo interrompido, retomando busca de dados');
    shouldFetchRef.current = true; // Retoma a busca de dados
    setIsCountingDown(false);
  }, []);

  // Função para finalizar o ciclo e atualizar no banco
  const finalizeCreditCycle = useCallback(async (secondsUsed: number) => {
    if (!user) return;
    
    try {
      stopCreditCycle(); // Garante que a contagem local parou
      
      // Calcula os créditos restantes
      const remainingCredits = Math.max(credits - secondsUsed, 0);
      
      // Atualiza no banco
      const { error } = await supabase
        .from('user_profiles')
        .update({ credits_amount: remainingCredits })
        .eq('user_id', user.id);

      if (error) throw error;

      // Busca os dados atualizados após o ciclo
      console.log('Ciclo finalizado, buscando dados atualizados');
      shouldFetchRef.current = true; // Garante que a busca está habilitada
      await fetchUserData();
      
      console.log('Ciclo finalizado, créditos atualizados:', remainingCredits);
    } catch (error) {
      console.error('Erro ao finalizar ciclo:', error);
      // Em caso de erro, recarrega os dados do usuário para garantir consistência
      shouldFetchRef.current = true; // Garante que a busca está habilitada
      await fetchUserData();
    }
  }, [user, credits, supabase, fetchUserData, stopCreditCycle]);

  const checkCreditsAndPlan = useCallback(async () => {
    if (!user) return;

    try {
      await fetchUserData();
    } catch (error) {
      log.error('Erro ao verificar créditos:', error);
    }
  }, [user, fetchUserData]);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  }, [])

  const value = {
    user,
    userPlan,
    credits,
    loading,
    isCountingDown,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    updatePassword,
    addCredits,
    useCredits,
    checkCreditsAndPlan,
    startCreditCycle,
    stopCreditCycle,
    finalizeCreditCycle
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

