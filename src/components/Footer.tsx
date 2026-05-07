import React from 'react';
import { Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-bold text-lg whitespace-nowrap">
            <Shield className="text-primary w-5 h-5 shrink-0" />
            <span>PhiShield <span className="text-primary">AI</span></span>
          </div>
          <p className="text-xs text-muted-foreground w-full text-center md:text-right">
            © 2026 PhiShield AI. Protection against Phishing Attacks.
          </p>
        </div>
      </div>
    </footer>
  );
}
