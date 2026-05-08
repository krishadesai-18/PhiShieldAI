import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, AlertCircle, Loader2, X, Lock, Eye, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

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
    <div className="w-full flex justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-[400px]"
      >
        <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50" />
          
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
              <Shield className="w-10 h-10" />
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight mb-2">Identity Lock</h2>
            <p className="text-muted-foreground text-[11px] leading-relaxed px-4">
              Sign in to access your secure security center and manage threat intelligence.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-bold flex items-center gap-2 overflow-hidden"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button 
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full py-3.5 px-6 bg-foreground text-background font-bold rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-foreground/5 disabled:opacity-50 text-sm"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 grayscale-0" />
                <span>Sign in with Google</span>
              </>
            )}
          </button>
          
          <div className="mt-8 pt-6 border-t border-border/50">
            <div className="flex justify-center gap-5 mb-3">
              <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/40">Secure</div>
              <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/40">Private</div>
              <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/40">Automated</div>
            </div>
            <p className="text-[9px] text-center text-muted-foreground leading-relaxed">
              By authenticating, you confirm your authorization to access organizational security data and agree to the 
              <button 
                onClick={() => setShowPrivacy(true)}
                className="text-primary hover:underline mx-1 focus:outline-none"
              >
                Privacy Protocol
              </button>.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Privacy Protocol Modal */}
      <AnimatePresence>
        {showPrivacy && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-card border border-border w-full max-w-lg rounded-[2rem] shadow-2xl p-8 relative overflow-hidden"
            >
              <button 
                onClick={() => setShowPrivacy(false)}
                className="absolute top-6 right-6 p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Privacy Protocol</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Security Standards</p>
                </div>
              </div>

              <div className="space-y-6">
                <ProtocolItem 
                  icon={<Lock className="w-4 h-4" />}
                  title="Zero-Knowledge Infrastructure"
                  description="All analyzed data remains within our secure isolated environment and is purged after 24 hours of investigation."
                />
                <ProtocolItem 
                  icon={<Eye className="w-4 h-4" />}
                  title="Identity Anonymization"
                  description="Our AI models process visual data through anonymization layers, removing personally identifiable headers before deep analysis."
                />
                <ProtocolItem 
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  title="Authorization Scoping"
                  description="Access is restricted to authorized personnel. Every security audit is tracked with immutable security logs."
                />
              </div>

              <button 
                onClick={() => setShowPrivacy(false)}
                className="w-full mt-8 py-3 bg-primary text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Close Protocol
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProtocolItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex gap-4 p-4 bg-muted/30 rounded-2xl border border-border/50">
      <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-primary shrink-0 border border-border/50">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-bold mb-1">{title}</h4>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

