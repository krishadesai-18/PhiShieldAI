import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { User, Mail, Sun, Moon, Check, Edit2, Loader2 } from 'lucide-react';

export default function Profile() {
  const { user, updateDisplayName } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!user) return null;

  const handleUpdateName = async () => {
    if (newName.trim() === user.displayName) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await updateDisplayName(newName.trim());
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto"
    >
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="h-32 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5" />
        
        <div className="px-8 pb-12">
          <div className="relative -mt-12 mb-8 flex justify-between items-end">
            <div className="relative group">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                className="w-24 h-24 rounded-2xl border-4 border-card shadow-xl object-cover" 
                alt="Avatar" 
              />
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <p className="text-[10px] text-white font-bold uppercase tracking-widest">Google Auth</p>
              </div>
            </div>

            <button 
              onClick={toggleTheme}
              className="p-3 bg-muted/50 hover:bg-muted border border-border rounded-2xl transition-all"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-primary" />}
            </button>
          </div>

          <div className="space-y-8">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
                Display Name
              </label>
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <div className="flex-grow flex gap-2">
                    <input 
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-grow bg-muted/50 border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      placeholder="Enter your name"
                      autoFocus
                    />
                    <button 
                      onClick={handleUpdateName}
                      disabled={isSaving}
                      className="p-2 bg-primary text-primary-foreground rounded-xl hover:scale-105 transition-transform disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-xl font-bold tracking-tight">{user.displayName}</h1>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1 opacity-60">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
                Email Address
              </label>
              <div className="flex items-center gap-2 p-4 bg-muted/30 border border-border/50 rounded-2xl">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{user.email}</span>
              </div>
            </div>

            <div className="pt-8 border-t border-border">
              <div className="flex items-center justify-center text-xs text-muted-foreground font-mono">
                <span>Account Status: Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
