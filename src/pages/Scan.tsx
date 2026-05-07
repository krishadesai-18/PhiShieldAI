import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { Upload, Shield, AlertTriangle, CheckCircle, Loader2, X, FileText, ChevronRight, FileDown } from 'lucide-react';
import { analyzeEmailImage } from '../lib/genai';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import ReactMarkdown from 'react-markdown';
import { generateSecurityPDF } from '../lib/pdf';

interface ScanResult {
  verdict: 'Phishing' | 'Safe' | 'Suspicious';
  confidence: number;
  analysis: string;
  subject: string;
  riskIndicators: string[];
}

interface ScanItem {
  id: string;
  file: File;
  preview: string;
  loading: boolean;
  result: ScanResult | null;
  error: string | null;
}

export default function Scan() {
  const { user } = useAuth();
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [activeScanId, setActiveScanId] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Limit to 5 files total in queue
    const remainingSlots = 5 - scans.length;
    const filesToAdd = acceptedFiles.slice(0, Math.max(0, remainingSlots));

    const newScans: ScanItem[] = filesToAdd.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      loading: false,
      result: null,
      error: null
    }));

    setScans(prev => [...prev, ...newScans]);
    if (newScans.length > 0 && (!activeScanId || scans.length === 0)) {
      setActiveScanId(newScans[0].id);
    }
  }, [scans, activeScanId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    multiple: true
  });

  const removeScan = (id: string) => {
    setScans(prev => {
      const filtered = prev.filter(s => s.id !== id);
      // Clean up URL object
      const removed = prev.find(s => s.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
    if (activeScanId === id) {
      setActiveScanId(null);
    }
  };

  const scanSingleImage = async (id: string) => {
    const scan = scans.find(s => s.id === id);
    if (!scan || scan.loading || scan.result) return;

    setScans(prev => prev.map(s => s.id === id ? { ...s, loading: true, error: null } : s));

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(scan.file);
      });
      
      const base64 = await base64Promise;
      const analysis = await analyzeEmailImage(base64, scan.file.type);
      
      // Use the AI's verdict directly
      const finalVerdict = analysis.verdict;
      const updatedAnalysis = { ...analysis, verdict: finalVerdict };
      
      setScans(prev => prev.map(s => s.id === id ? { ...s, result: updatedAnalysis, loading: false } : s));

      // Save to Firestore
      const path = 'scans';
      try {
        await addDoc(collection(db, path), {
          userId: user?.uid,
          imageURL: '(Batch scan image)',
          imageName: updatedAnalysis.subject || scan.file.name,
          status: 'completed',
          verdict: finalVerdict,
          confidence: updatedAnalysis.confidence,
          analysis: updatedAnalysis.analysis,
          riskIndicators: updatedAnalysis.riskIndicators,
          timestamp: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    } catch (err) {
      console.error(err);
      setScans(prev => prev.map(s => s.id === id ? { ...s, loading: false, error: "Analysis failed. Please try again." } : s));
    }
  };

  const scanAll = () => {
    const pendingScans = scans.filter(s => !s.result && !s.loading);
    pendingScans.forEach(scan => {
      scanSingleImage(scan.id);
    });
  };

  const activeScan = scans.find(s => s.id === activeScanId);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto"
    >
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2 tracking-tight">PhiShield AI Scanner</h1>
        </div>
        {scans.length > 0 && (
          <button 
            onClick={scanAll}
            disabled={scans.every(s => s.result || s.loading)}
            className="px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <Shield className="w-5 h-5" />
            Scan All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Management */}
        <div className="lg:col-span-4 space-y-6">
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
            } ${scans.length >= 5 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center">
              <Upload className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-sm font-bold mb-2 uppercase tracking-tight">
                {scans.length >= 5 ? 'Batch Limit Reached' : 'Upload (max. 5)'}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">PNG, JPG, JPEG</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Live Queue</h3>
              <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-full">{scans.length}/5</span>
            </div>
            
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {scans.map((scan) => (
                  <motion.div
                    key={scan.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className={`group relative flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                      activeScanId === scan.id ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5' : 'border-border bg-card/30 hover:bg-card'
                    }`}
                    onClick={() => setActiveScanId(scan.id)}
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border/50">
                      <img src={scan.preview} className="w-full h-full object-cover" alt="Thumb" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-bold truncate pr-6">{scan.file.name}</p>
                      <div className="flex items-center gap-2">
                        {scan.loading ? (
                          <span className="flex items-center gap-1 text-[9px] text-primary font-bold animate-pulse uppercase tracking-widest">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" /> In Progress
                          </span>
                        ) : scan.result ? (
                          <span className={`text-[9px] font-bold uppercase tracking-widest ${scan.result.verdict === 'Phishing' ? 'text-red-500' : 'text-emerald-500'}`}>
                            {scan.result.verdict} Detected
                          </span>
                        ) : scan.error ? (
                          <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest">Fail</span>
                        ) : (
                          <span className="text-[9px] text-muted-foreground font-bold tracking-widest uppercase">Pending</span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeScan(scan.id); }}
                      className="absolute right-2 top-2 p-1.5 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {activeScanId === scan.id && (
                      <div className="absolute right-2 bottom-3">
                        <ChevronRight className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {scans.length === 0 && (
                <div className="py-12 border border-dashed border-border rounded-3xl text-center bg-muted/5">
                  <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Waiting for input</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Console */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {!activeScan ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-[3rem] text-center bg-muted/10"
              >
                <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mb-6">
                  <Shield className="w-10 h-10 text-muted-foreground/20" />
                </div>
                <h3 className="text-xl font-bold text-muted-foreground/40 mb-2">No Active Analysis</h3>
                <p className="text-sm text-muted-foreground/30 max-w-xs">Select or add a security email from the queue to begin deep inspection.</p>
              </motion.div>
            ) : (
              <motion.div 
                key={activeScan.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {!activeScan.result && !activeScan.loading && !activeScan.error && (
                  <div className="p-8 border border-border rounded-[3rem] bg-card space-y-8 shadow-2xl">
                    <div className="w-full h-[400px] rounded-2xl overflow-hidden bg-muted/30 border border-border/50">
                      <img src={activeScan.preview} className="w-full h-full object-contain" alt="Deep Inspect" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-2">Ready for Analysis</h3>
                      <p className="text-sm text-muted-foreground mb-8">This email is queued for AI-driven cybersecurity intelligence.</p>
                      <button 
                        onClick={() => scanSingleImage(activeScan.id)}
                        className="px-10 py-3.5 bg-primary text-white rounded-2xl font-bold text-base hover:scale-105 transition-all shadow-2xl shadow-primary/30 flex items-center gap-3 mx-auto"
                      >
                        <Shield className="w-5 h-5" /> Start Scan
                      </button>
                    </div>
                  </div>
                )}

                {activeScan.loading && (
                  <div className="p-16 border border-border rounded-[3rem] bg-card/50 text-center space-y-8 min-h-[500px] flex flex-col justify-center">
                    <div className="relative w-24 h-24 mx-auto">
                      <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <Shield className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold tracking-tight">Scanning...</h3>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto italic">Analyzing threat patterns and domain metrics.</p>
                    </div>
                  </div>
                )}

                {activeScan.error && (
                  <div className="p-12 border border-red-500/20 bg-red-500/5 rounded-[3rem] text-center space-y-4">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-2" />
                    <h3 className="text-2xl font-bold text-red-500">Analysis Terminated</h3>
                    <p className="text-muted-foreground">{activeScan.error}</p>
                    <button 
                      onClick={() => scanSingleImage(activeScan.id)}
                      className="px-8 py-3 bg-red-500 text-white rounded-2xl font-bold mt-4"
                    >
                      Retry Analysis
                    </button>
                  </div>
                )}

                {activeScan.result && (
                  <div className={`border rounded-[3rem] overflow-hidden shadow-2xl transition-all ${
                    activeScan.result.verdict === 'Phishing' ? 'border-red-500/30' : 'border-emerald-500/30'
                  }`}>
                    {/* Header */}
                    <div className={`p-10 flex flex-col sm:flex-row items-center justify-between gap-6 ${
                      activeScan.result.verdict === 'Phishing' ? 'bg-red-500/10' : 'bg-emerald-500/10'
                    }`}>
                      <div className="flex items-center gap-6">
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center ${
                          activeScan.result.verdict === 'Phishing' ? 'bg-red-500 text-white shadow-2xl shadow-red-500/50' : 'bg-emerald-500 text-white shadow-2xl shadow-emerald-500/50'
                        }`}>
                          {activeScan.result.verdict === 'Phishing' ? <AlertTriangle className="w-12 h-12" /> : <CheckCircle className="w-12 h-12" />}
                        </div>
                        <div>
                          <h2 className={`text-3xl font-bold tracking-tighter ${
                            activeScan.result.verdict === 'Phishing' ? 'text-red-500' : 'text-emerald-500'
                          }`}>
                            {activeScan.result.verdict} Alert
                          </h2>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Confidence</span>
                            <div className="h-1 w-24 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ${activeScan.result.verdict === 'Phishing' ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${activeScan.result.confidence}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold font-mono">{activeScan.result.confidence}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-4">
                        <button 
                          onClick={() => {
                            if (!activeScan.result) return;
                            generateSecurityPDF({
                              imageName: activeScan.file.name,
                              verdict: activeScan.result.verdict,
                              confidence: activeScan.result.confidence,
                              timestamp: new Date().toLocaleString(),
                              analysis: activeScan.result.analysis,
                              riskIndicators: activeScan.result.riskIndicators
                            });
                          }}
                          className="flex items-center gap-2 px-6 py-2.5 bg-muted hover:bg-muted/80 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all"
                        >
                          <FileDown className="w-4 h-4" />
                          Export Report (PDF)
                        </button>
                      </div>
                    </div>

                    <div className="p-10 bg-card space-y-12">
                      {/* Analysis Block */}
                      <div className="space-y-8">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                          <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.4em]">Report Analysis</h4>
                        </div>
                        <div className="prose prose-invert max-w-none">
                          <div className="text-foreground/90 leading-relaxed space-y-4 text-sm tracking-normal">
                            <ReactMarkdown>
                              {activeScan.result.analysis.replace(/^#+ (Cybersecurity Analysis Report|Phishing Analysis Report|Security Report).*\n?/i, '')}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>

                      {/* Risk Indicators - Enhanced Layout */}
                      {activeScan.result.riskIndicators.length > 0 && (
                        <div className="pt-12 border-t border-border/50">
                          <div className="flex items-center gap-3 mb-8">
                            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                            <h4 className="text-[11px] font-bold text-red-500 uppercase tracking-[0.4em]">Threat Signatures</h4>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            {activeScan.result.riskIndicators.map((indicator, idx) => (
                              <motion.div 
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex items-center gap-3 p-3 rounded-xl border border-red-500/20 bg-red-500/5 group hover:bg-red-500/10 transition-all w-full"
                              >
                                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                                  <AlertTriangle className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-[11px] text-red-400 leading-tight uppercase tracking-widest">
                                  {indicator}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeScan.result.verdict === 'Safe' && activeScan.result.riskIndicators.length === 0 && (
                        <div className="pt-10 border-t border-border">
                          <div className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] flex items-start gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                              <CheckCircle className="w-7 h-7 text-emerald-500" />
                            </div>
                            <div>
                              <p className="text-xl font-bold text-emerald-500 mb-1">Authenticated Communication</p>
                              <p className="text-sm text-muted-foreground/80 leading-relaxed">This communication exhibits high fidelity consistent with trusted domains and lacks standard deceptive markers.</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

