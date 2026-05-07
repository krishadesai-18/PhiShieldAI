import React from 'react';
import { motion } from 'motion/react';
import { Shield, Mail, Lock, History, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto py-20 text-center"
    >
      <div className="mb-8 flex justify-center">
        <div className="p-4 bg-primary/10 rounded-full">
          <Shield className="w-16 h-16 text-primary" />
        </div>
      </div>
      <h1 className="text-5xl font-bold mb-6 tracking-tight">
        Protect Your Inbox with <span className="text-primary text-primary-shadow">PhishShield AI</span>
      </h1>
      <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
        Next-generation phishing detection powered by Gemini Vision. 
        Analyze emails for hidden threats, suspicious links, and deceptive language instantly.
      </p>
      
      <div className="flex gap-4 justify-center">
        {user ? (
          <Link to="/dashboard" className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-all">
            Go to Dashboard
          </Link>
        ) : (
          <Link to="/login" className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-all">
            Get Started
          </Link>
        )}
        <button className="px-8 py-3 bg-card border border-border text-foreground rounded-lg font-semibold hover:bg-card/80 transition-all">
          Learn More
        </button>
      </div>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard 
          icon={<Mail className="w-6 h-6" />}
          title="Image Analysis"
          description="Upload email screenshots or PDFs. Our AI scans the visual layout for impersonation cues."
        />
        <FeatureCard 
          icon={<Lock className="w-6 h-6" />}
          title="Secure by Design"
          description="Your data is protected with Firebase Security Rules and enterprise-grade encryption."
        />
        <FeatureCard 
          icon={<History className="w-6 h-6" />}
          title="Threat Tracking"
          description="Monitor your safety history over time. Identify patterns in attacks targeting your organization."
        />
      </div>
    </motion.div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 bg-card border border-border rounded-xl text-left hover:border-primary/50 transition-colors">
      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
