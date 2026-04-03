import React, { useState } from 'react';
import { supabase } from '../services/supabase';
// import { motion } from 'motion/react';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Logo } from './Logo';
import { cn } from '../lib/utils';

interface AuthProps {
  onSuccess: (user: any) => void;
}

export function Auth({ onSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!url || !key) {
        const missing = [];
        if (!url) missing.push("VITE_SUPABASE_URL");
        if (!key) missing.push("VITE_SUPABASE_ANON_KEY");
        setError(`Supabase no está configurado. Faltan variables: ${missing.join(", ")}. Asegúrate de añadirlas en el panel de Secrets de AI Studio.`);
      } else if (!url.startsWith('https://')) {
        setError("La URL de Supabase no es válida. Debe empezar por 'https://'. Revisa el panel de Secrets.");
      } else {
        setError("Error al inicializar Supabase. Revisa que las claves en el panel de Secrets sean correctas.");
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Iniciando proceso de autenticación para:", email);
      
      // Add a timeout to the auth request
      const authPromise = isLogin 
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } },
          });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("TIMEOUT_ERROR")), 15000)
      );

      const result = await Promise.race([authPromise, timeoutPromise]) as any;

      if (result instanceof Error && result.message === "TIMEOUT_ERROR") {
        throw new Error("La conexión con Supabase ha tardado demasiado. Verifica tu conexión a internet o si el proyecto de Supabase está activo.");
      }

      const { data, error } = result;

      if (error) {
        console.error("Error en auth:", error);
        throw error;
      }
      
      if (!data.user && !data.session && isLogin) {
        throw new Error("No se pudo iniciar sesión. Revisa tus credenciales.");
      }

      console.log("Autenticación exitosa:", data.user?.id);
      
      if (data.user) {
        if (!isLogin) {
          console.log("Intentando crear perfil en la tabla 'profiles'...");
          try {
            const { error: profileError } = await supabase.from('profiles').upsert({
              id: data.user.id,
              email: data.user.email,
              name: name,
              created_at: new Date().toISOString()
            });
            
            if (profileError) {
              console.error("Error creando perfil:", profileError);
            }
          } catch (pErr) {
            console.error("Excepción creando perfil:", pErr);
          }
        }
        onSuccess(data.user);
      }
    } catch (err: any) {
      console.error("Error capturado en handleAuth:", err);
      setError(err.message || "Ocurrió un error durante la autenticación.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    // Simulate a demo user
    onSuccess({
      id: 'demo-user-id',
      email: 'demo@deensnap.app',
      user_metadata: {
        full_name: 'Usuario Demo'
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
      
      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-10">
          <Logo size={100} className="mb-8" />
          <h1 className="text-4xl font-bold font-display tracking-tight mb-2">DeenSnap</h1>
          <p className="text-white/40 font-medium text-center">
            {isLogin ? 'Inicia sesión para continuar' : 'Crea tu cuenta para empezar'}
          </p>
        </div>

        <div className="glass-card p-8 rounded-[2.5rem] border-white/5 shadow-2xl">
          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input 
                    type="text" 
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-16 rounded-2xl premium-gradient font-bold text-white shadow-[0_20px_40px_rgba(16,185,129,0.2)] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Entrar' : 'Registrarse'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-4 items-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-medium text-white/40 hover:text-white transition-colors"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-2 text-white/20">
          <div className="flex items-center gap-2">
            <Sparkles size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Inteligencia Halal V3.0</span>
          </div>
          <div className="text-[8px] opacity-50">
            Supabase: {supabase ? 'Conectado' : 'No configurado'}
          </div>
        </div>
      </div>
    </div>
  );
}
