import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { Upload, Shield, AlertTriangle, CheckCircle, Loader2, Info } from 'lucide-react';
import { analyzeEmailImage } from '../lib/genai';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import ReactMarkdown from 'react-markdown';

interface ScanResult {
  verdict: 'phishing' | 'safe' | 'suspicious';
  confidence: number;
  explanation: string;
  indicators: {
    suspiciousLinks: boolean;
    urgencyLanguage: boolean;
    fakeDomains: boolean;
    impersonation: boolean;
    grammarMistakes: boolean;
    credentialStealing: boolean;
  };
}

export default function Scan() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
      setResult(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    multiple: false
  });

  const handleScan = async () => {
    if (!file || !preview) return;
    setLoading(true);
    setError(null);

    try {
      const base64 = preview.split(',')[1];
      const analysis = await analyzeEmailImage(base64, file.type);
      
      setResult(analysis);

      // Save to Firestore
      const path = 'scans';
      try {
        await addDoc(collection(db, path), {
          userId: user?.uid,
          imageURL: preview.length < 500000 ? preview : '(Image too large for storage)',
          status: 'completed',
          ...analysis,
          timestamp: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }

    } catch (err) {
      console.error(err);
      setError("Failed to analyze image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">New Security Scan</h1>
        <p className="text-muted-foreground">Upload a screenshot of the email for a comprehensive AI analysis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium mb-1">
                {file ? file.name : 'Drop your image here'}
              </p>
              <p className="text-sm text-muted-foreground">Supports PNG, JPG, JPEG (Max 5MB)</p>
            </div>
          </div>

          {preview && (
            <div className="relative rounded-xl overflow-hidden border border-border group">
              <img src={preview} alt="Preview" className="w-full h-auto max-h-96 object-contain bg-card" />
              <button 
                onClick={() => {setFile(null); setPreview(null); setResult(null);}}
                className="absolute top-2 right-2 p-2 bg-background/80 hover:bg-background rounded-full transition-colors opacity-0 group-hover:opacity-100"
              >
                Clear
              </button>
            </div>
          )}

          <button 
            disabled={!file || loading}
            onClick={handleScan}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              !file || loading ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'
            }`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
            {loading ? 'Analyzing Threat...' : 'Start Secure Scan'}
          </button>
        </div>

        <div>
          {loading && (
            <div className="h-full flex flex-col items-center justify-center space-y-4 p-8 border border-border rounded-2xl bg-card/50">
              <div className="relative h-20 w-20">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="font-semibold text-lg">Running AI Forensics</p>
              <p className="text-sm text-muted-foreground text-center">Checking for suspicious links, domain spoofing, and social engineering patterns...</p>
            </div>
          )}

          {error && (
            <div className="p-6 border border-red-500/50 bg-red-500/10 rounded-2xl text-red-500 flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <p className="font-bold">Error Occurred</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-6 border rounded-2xl bg-card ${
                result.verdict === 'phishing' ? 'border-red-500/50 shadow-lg shadow-red-500/10' : 
                result.verdict === 'suspicious' ? 'border-amber-500/50 shadow-lg shadow-amber-500/10' : 
                'border-emerald-500/50 shadow-lg shadow-emerald-500/10'
              }`}
            >
              <div className="flex items-center gap-3 mb-6">
                {result.verdict === 'phishing' ? <AlertTriangle className="w-8 h-8 text-red-500" /> : 
                 result.verdict === 'suspicious' ? <Info className="w-8 h-8 text-amber-500" /> : 
                 <CheckCircle className="w-8 h-8 text-emerald-500" />}
                <div>
                  <h3 className="text-2xl font-bold capitalize">{result.verdict} Detected</h3>
                  <p className="text-sm text-muted-foreground">Confidence: {result.confidence}%</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Expert Analysis</h4>
                <div className="prose prose-invert prose-sm">
                  <ReactMarkdown>{result.explanation}</ReactMarkdown>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Risk Indicators</h4>
                <Indicator label="Suspicious Links" detected={result.indicators.suspiciousLinks} />
                <Indicator label="Urgency Language" detected={result.indicators.urgencyLanguage} />
                <Indicator label="Fake Domains" detected={result.indicators.fakeDomains} />
                <Indicator label="Impersonation" detected={result.indicators.impersonation} />
                <Indicator label="Grammar Mistakes" detected={result.indicators.grammarMistakes} />
                <Indicator label="Credential Stealing" detected={result.indicators.credentialStealing} />
              </div>
            </motion.div>
          )}

          {!loading && !result && !error && (
            <div className="h-full border border-border bg-card/20 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center">
              <Shield className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">Analysis results will appear here after scanning</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Indicator({ label, detected }: { label: string, detected: boolean }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
      detected ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-muted/50 border-border text-muted-foreground'
    }`}>
      <span className="font-medium">{label}</span>
      {detected ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4 text-emerald-500" />}
    </div>
  );
}
