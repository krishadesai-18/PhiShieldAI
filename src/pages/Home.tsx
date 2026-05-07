import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, History, ArrowRight, Zap, Target, BarChart3, AlertTriangle, Terminal, Globe, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const learnMoreRef = useRef<HTMLDivElement>(null);

  const scrollToLearnMore = () => {
    learnMoreRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-32 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-4xl mx-auto text-center"
        >
          <h1 className="text-6xl md:text-7xl font-bold mb-8 tracking-tight leading-[1.1]">
            Digital Identity <br />
            <span className="text-primary bg-clip-text">Fortified by AI</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 leading-relaxed max-w-2xl mx-auto">
            PhiShield AI leverages advanced computer vision to decapitate phishing attacks 
            before they reach your credentials. Modern security for the modern web.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link to="/dashboard" className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                Go to Dashboard <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <Link to="/login" className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                Get Secured <ArrowRight className="w-5 h-5" />
              </Link>
            )}
            <button 
              onClick={scrollToLearnMore}
              className="px-8 py-4 bg-card/50 backdrop-blur-md border border-border text-foreground rounded-xl font-bold hover:bg-muted transition-all"
            >
              Learn More
            </button>
          </div>
        </motion.div>
      </section>

      {/* Learn More Detailed Sections */}
      <div ref={learnMoreRef} className="container mx-auto px-4 space-y-32">
        {/* Statistics Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <StatBox label="Phishing Volume" value="1.2B" sub="Attacks blocked monthly" />
          <StatBox label="AI Accuracy" value="99.8%" sub="On Zero-Day vulnerabilities" />
          <StatBox label="Detection Speed" value="~2.4s" sub="Average scan duration" />
        </section>

        {/* Why it Matters Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight">Why Phishing Detection <br />Matters Today ?</h2>
            <div className="space-y-6 text-muted-foreground">
              <p>In the age of AI-generated content, phishing emails have become indistinguishable from legitimate communications. Traditional filters aren't enough.</p>
              <ul className="space-y-4 font-medium">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-primary" /></div>
                  90% of data breaches start with a phishing email
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-primary" /></div>
                  Financial losses exceed $12B annually globally
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-primary" /></div>
                  Credential theft leads to total organizational takeover
                </li>
              </ul>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-2xl group-hover:bg-primary/20 transition-all" />
            <div className="p-8 bg-card border border-border rounded-2xl relative shadow-xl">
              <div className="space-y-4">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: '85%' }}
                    className="h-full bg-red-500"
                  />
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span>UNPROTECTED RISK</span>
                  <span className="text-red-500 font-bold">CRITICAL</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: '12%' }}
                    className="h-full bg-primary"
                  />
                </div>
                <div className="flex justify-between text-xs font-mono text-primary">
                  <span>WITH PHISHIELD AI</span>
                  <span className="font-bold">SECURED</span>
                </div>
              </div>

            </div>
          </div>
        </section>

      </div>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-32 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 rounded-[4rem] -z-10 rotate-1 shadow-inner" />
        <h2 className="text-4xl font-bold mb-6">Ready to secure your communications?</h2>
        <p className="max-w-xl mx-auto text-muted-foreground mb-10 text-lg">
          Join thousands of professionals who trust PhiShield AI for their daily safety audit.
        </p>
      </section>
    </div>
  );
}

function StatBox({ label, value, sub }: { label: string, value: string, sub: string }) {
  return (
    <div className="group p-8 bg-card border border-border rounded-2xl text-center hover:border-primary transition-all">
      <h3 className="text-4xl font-bold text-primary mb-2 tracking-tight group-hover:scale-110 transition-transform">
        <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>{value}</motion.span>
      </h3>
      <p className="font-bold text-sm uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
