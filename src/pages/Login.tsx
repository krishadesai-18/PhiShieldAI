import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="max-w-md mx-auto py-20 px-4"
    >
      <div className="bg-card border border-border rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50" />
        
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary shadow-inner">
            <Shield className="w-12 h-12" />
          </div>
        </div>
        
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold tracking-tight mb-3">Identity Lock</h2>
          <p className="text-muted-foreground text-sm leading-relaxed px-4">
            Sign in to access your secure forensic console and manage threat intelligence.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold flex items-center gap-3 overflow-hidden"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button 
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full py-4 px-6 bg-foreground text-background font-bold rounded-2xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-foreground/10 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 grayscale-0" />
              <span>Sign in with Google</span>
            </>
          )}
        </button>
        
        <div className="mt-12 pt-8 border-t border-border/50">
          <div className="flex justify-center gap-6 mb-4">
            <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/40">Secure</div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/40">Private</div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/40">Forensic</div>
          </div>
          <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
            By authenticating, you confirm your authorization to access organizational security data and agree to the 
            <span className="text-primary hover:underline cursor-pointer mx-1">Privacy Protocol</span>.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
