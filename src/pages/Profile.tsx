import React from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield, ShieldAlert, Key, Globe } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
        <div className="h-32 bg-gradient-to-r from-primary/20 to-accent/20 relative">
          <div className="absolute -bottom-12 left-8">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              className="w-24 h-24 rounded-2xl border-4 border-card shadow-lg" 
              alt="Avatar" 
            />
          </div>
        </div>
        
        <div className="pt-16 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">{user.displayName}</h1>
            <p className="text-muted-foreground flex items-center gap-1">
              <Mail className="w-4 h-4" />
              {user.email}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <SettingsItem 
              icon={<Shield className="w-5 h-5 text-primary" />}
              title="Account Security"
              description="Your account is protected by Google Identity Services."
              status="Level 2 Secure"
            />
            <SettingsItem 
              icon={<Globe className="w-5 h-5 text-primary" />}
              title="Geolocation Privacy"
              description="Analysis servers are located in asia-southeast1."
              status="Compliant"
            />
            <SettingsItem 
              icon={<Key className="w-5 h-5 text-primary" />}
              title="API Access"
              description="Manage tokens for external security integrations."
              status="Developer Only"
            />
          </div>

          <div className="mt-8 pt-8 border-t border-border flex justify-between items-center">
            <div className="flex items-center gap-2 text-emerald-500 font-semibold">
              <ShieldAlert className="w-5 h-5" />
              Protection Active
            </div>
            <button className="text-sm font-medium text-muted-foreground hover:text-foreground underline">
              View Privacy Audit
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SettingsItem({ icon, title, description, status }: { icon: React.ReactNode, title: string, description: string, status: string }) {
  return (
    <div className="flex items-start justify-between p-4 bg-muted/20 border border-border/50 rounded-xl hover:bg-muted/30 transition-colors">
      <div className="flex gap-4">
        <div className="mt-1">{icon}</div>
        <div>
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">
        {status}
      </div>
    </div>
  );
}
