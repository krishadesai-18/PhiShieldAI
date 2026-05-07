import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Trash2, Calendar, Search, X, Shield, AlertTriangle, AlertCircle, Loader2, FileDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateSecurityPDF } from '../lib/pdf';

export default function History() {
  const { user } = useAuth();
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerdict, setFilterVerdict] = useState<string>('all');
  const [selectedScan, setSelectedScan] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string | 'all', visible: boolean }>({ id: '', visible: false });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchScans() {
      if (!user) return;
      try {
        const path = 'scans';
        const q = query(
          collection(db, path),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );
        try {
          const snapshot = await getDocs(q);
          setScans(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
          console.warn("Retrying query without ordering...");
          const simpleQ = query(collection(db, path), where('userId', '==', user.uid));
          const snapshot = await getDocs(simpleQ);
          const sorted = snapshot.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
          setScans(sorted);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'scans');
      } finally {
        setLoading(false);
      }
    }
    fetchScans();
  }, [user]);

  useEffect(() => {
    // Check if ID in URL initially
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id && scans.length > 0 && !selectedScan) {
      const found = scans.find(s => s.id === id);
      if (found) setSelectedScan(found);
    }
  }, [scans]);

  const closeAnalysisModal = () => {
    setSelectedScan(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('id');
    window.history.replaceState({}, '', url);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (confirmDelete.id === 'all') {
        const batch = writeBatch(db);
        scans.forEach(scan => {
          batch.delete(doc(db, 'scans', scan.id));
        });
        await batch.commit();
        setScans([]);
        setSelectedScan(null);
      } else {
        await deleteDoc(doc(db, 'scans', confirmDelete.id as string));
        setScans(prev => prev.filter(s => s.id !== confirmDelete.id));
        if (selectedScan?.id === confirmDelete.id) closeAnalysisModal();
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Delete failed. Please try again.");
    } finally {
      setIsDeleting(false);
      setConfirmDelete({ id: '', visible: false });
    }
  };

  const filteredScans = scans.filter(scan => {
    const matchesSearch = (scan.verdict || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (scan.imageName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (scan.analysis || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterVerdict === 'all' || scan.verdict?.toLowerCase() === filterVerdict.toLowerCase();
    
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="p-20 text-center text-muted-foreground animate-pulse">Decrypting history logs...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-20 relative"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">History</h1>
          <p className="text-xs text-muted-foreground">Historical records of all security investigations.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {scans.length > 0 && (
            <button 
              onClick={() => setConfirmDelete({ id: 'all', visible: true })}
              className="flex items-center gap-2 px-4 py-2 border border-red-500/20 bg-red-500/5 text-red-500 rounded-xl text-sm font-bold hover:bg-red-500/10 transition-all active:scale-95 whitespace-nowrap"
            >
              <AlertCircle className="w-4 h-4" />
              Delete All
            </button>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search history..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-full md:w-64"
            />
          </div>
          <select 
            value={filterVerdict}
            onChange={(e) => setFilterVerdict(e.target.value)}
            className="px-3 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
          >
            <option value="all">All Verdicts</option>
            <option value="phishing">Phishing</option>
            <option value="suspicious">Suspicious</option>
            <option value="safe">Safe</option>
          </select>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="p-3">Status</th>
                <th className="p-3">Name</th>
                <th className="p-3">Date & Time</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredScans.length > 0 ? filteredScans.map((scan) => (
                <tr key={scan.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
                  <td className="p-3">
                    <div className={`w-2 h-2 rounded-full ${
                      scan.verdict?.toLowerCase() === 'phishing' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                      scan.verdict?.toLowerCase() === 'safe' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                      'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                    }`} />
                  </td>
                  <td className="p-3">
                    <button 
                      onClick={() => setSelectedScan(scan)}
                      className="text-xs font-bold truncate max-w-[250px] hover:text-primary transition-colors text-left block w-full"
                    >
                      {scan.imageName || 'N/A'}
                    </button>
                  </td>
                  <td className="p-3 text-xs whitespace-nowrap text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {scan.timestamp ? new Date(scan.timestamp.toDate()).toLocaleString() : 'Just now'}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end pr-1">
                       <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete({ id: scan.id, visible: true });
                        }}
                        className="p-2 text-muted-foreground hover:text-red-500 bg-transparent hover:bg-red-500/10 rounded-lg transition-all cursor-pointer active:scale-95 focus:outline-none"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5 pointer-events-none" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-muted-foreground">
                    No matching security records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedScan && (
          <AnalysisModal scan={selectedScan} onClose={closeAnalysisModal} />
        )}
        
        {confirmDelete.visible && (
          <ConfirmDialog 
            title={confirmDelete.id === 'all' ? "Delete All Logs?" : "Delete Record?"}
            message={confirmDelete.id === 'all' ? "This will permanently remove all logs from your history. This action cannot be undone." : "Are you sure you want to delete this scan record?"}
            onConfirm={handleConfirmDelete}
            onCancel={() => setConfirmDelete({ id: '', visible: false })}
            loading={isDeleting}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AnalysisModal({ scan, onClose }: { scan: any, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-card border border-border rounded-[2rem] w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              scan.verdict?.toLowerCase() === 'phishing' ? 'bg-red-500 text-white' :
              scan.verdict?.toLowerCase() === 'safe' ? 'bg-emerald-500 text-white' :
              'bg-amber-500 text-white'
            }`}>
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{scan.imageName}</h3>
              <p className="text-xs text-muted-foreground">{scan.timestamp ? new Date(scan.timestamp.toDate()).toLocaleString() : 'Recent'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-8 md:p-12 space-y-12 bg-card">
          <div className="flex items-center gap-8 p-6 bg-muted/20 rounded-2xl border border-border">
            <div className="text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Verdict</p>
              <p className={`text-lg font-bold uppercase tracking-tight ${
                scan.verdict?.toLowerCase() === 'phishing' ? 'text-red-500' :
                scan.verdict?.toLowerCase() === 'safe' ? 'text-emerald-500' :
                'text-amber-500'
              }`}>{scan.verdict}</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Confidence</p>
              <p className="text-lg font-bold uppercase tracking-tight">{scan.confidence}%</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <button 
              onClick={() => {
                generateSecurityPDF({
                  imageName: scan.imageName,
                  verdict: scan.verdict,
                  confidence: scan.confidence,
                  timestamp: scan.timestamp ? new Date(scan.timestamp.toDate()).toLocaleString() : 'N/A',
                  analysis: scan.analysis,
                  riskIndicators: scan.riskIndicators
                });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              <FileDown className="w-4 h-4" />
              Download PDF
            </button>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.4em]">Report Analysis</h4>
            </div>
            <div className="prose prose-invert max-w-none">
              <div className="text-foreground/90 leading-relaxed space-y-4 text-sm tracking-normal">
                <ReactMarkdown>
                  {scan.analysis?.replace(/^#+ (Cybersecurity Analysis Report|Phishing Analysis Report|Security Report).*\n?/i, '')}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          {scan.riskIndicators?.length > 0 && (
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                <h4 className="text-[11px] font-bold text-red-500 uppercase tracking-[0.4em]">Threat Signatures</h4>
              </div>
              <div className="flex flex-col gap-2">
                {scan.riskIndicators.map((indicator: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-red-500/20 bg-red-500/5 group hover:bg-red-500/10 transition-all">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-[11px] text-red-400 leading-tight uppercase tracking-widest">{indicator}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel, loading }: { title: string, message: string, onConfirm: () => void, onCancel: () => void, loading?: boolean }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-8"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
            <Trash2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg">{title}</h3>
        </div>
        
        <p className="text-muted-foreground mb-8 leading-relaxed text-sm">
          {message}
        </p>
        
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-muted hover:bg-muted/80 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Delete'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
