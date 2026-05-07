import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Trash2, ExternalLink, Calendar, Search, Filter } from 'lucide-react';

export default function History() {
  const { user } = useAuth();
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
          // If orderBy fails due to missing index, try simpler query
          console.warn("Retrying query without ordering (Index might be missing)...");
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scan record?")) return;
    try {
      await deleteDoc(doc(db, 'scans', id));
      setScans(scans.filter(s => s.id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const filteredScans = scans.filter(scan => 
    scan.verdict.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scan.explanation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-20 text-center">Decrypting history logs...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Threat Archive</h1>
          <p className="text-muted-foreground">Historical records of all security investigations.</p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search forensics..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button className="p-2 border border-border rounded-lg hover:bg-card">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="p-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Date & Time</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Confidence</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Verdict</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredScans.length > 0 ? filteredScans.map((scan) => (
                <tr key={scan.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
                  <td className="p-4">
                    <div className={`w-2 h-2 rounded-full ${
                      scan.verdict === 'phishing' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                      scan.verdict === 'safe' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                      'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                    }`} />
                  </td>
                  <td className="p-4 text-sm whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      {new Date(scan.timestamp?.toDate()).toLocaleString()}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-medium px-2 py-1 bg-muted rounded-md border border-border">
                      {scan.confidence}%
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-sm font-bold capitalize ${
                      scan.verdict === 'phishing' ? 'text-red-500' :
                      scan.verdict === 'safe' ? 'text-emerald-500' :
                      'text-amber-500'
                    }`}>
                      {scan.verdict}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 hover:text-primary transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(scan.id)}
                        className="p-2 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-muted-foreground">
                    No matching security records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
