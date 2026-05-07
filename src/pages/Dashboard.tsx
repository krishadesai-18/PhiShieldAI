import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, AlertTriangle, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, safe: 0, phishing: 0, suspicious: 0 });
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const path = 'scans';
        const q = query(
          collection(db, path), 
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );
        let scans: any[] = [];
        try {
          const querySnapshot = await getDocs(q);
          scans = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (err) {
           // Fallback to client-side sorting if index is missing
          const simpleQ = query(collection(db, path), where('userId', '==', user.uid));
          const snapshot = await getDocs(simpleQ);
          scans = snapshot.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        }
        
        const counts = scans.reduce((acc: any, curr: any) => {
          const v = (curr.verdict || '').toLowerCase();
          acc[v] = (acc[v] || 0) + 1;
          acc.total = (acc.total || 0) + 1;
          return acc;
        }, { total: 0, safe: 0, phishing: 0, suspicious: 0 });

        setStats(counts);
        setRecentScans(scans.slice(0, 5));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const data = [
    { name: 'Safe', value: stats.safe || 0, color: '#10b981' },
    { name: 'Phishing', value: stats.phishing || 0, color: '#f43f5e' },
    { name: 'Suspicious', value: stats.suspicious || 0, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  if (loading) return <div className="p-20 text-center">Loading security profile...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PhiShield AI Dashboard</h1>
          <p className="text-muted-foreground">Overview of your organizational threat landscape.</p>
        </div>
        <Link to="/scan" className="px-6 py-3 bg-primary text-white rounded-2xl font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20">
          <Shield className="w-4 h-4" />
          New Scan
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Scans" value={stats.total} icon={<Clock className="text-primary" />} />
        <StatCard title="Safe Emails" value={stats.safe} icon={<CheckCircle className="text-emerald-500" />} />
        <StatCard title="Phishing Blocked" value={stats.phishing} icon={<AlertTriangle className="text-rose-500" />} />
        <StatCard title="Suspicious Flags" value={stats.suspicious} icon={<Shield className="text-amber-500" />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-card border border-border rounded-3xl p-6 shadow-xl">
          <h3 className="text-xl font-bold mb-6">Threat Distribution</h3>
          {data.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 text-xs mt-4">
                {data.map(d => (
                  <div key={d.name} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                    <span>{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-sm text-center">
              <p>No scan data available yet.</p>
              <Link to="/scan" className="text-primary hover:underline mt-2">Start your first scan</Link>
            </div>
          )}
        </div>

        <div className="md:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Recent Forensics</h3>
            <Link to="/history" className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentScans.length > 0 ? recentScans.map((scan) => (
              <div key={scan.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    scan.verdict?.toLowerCase() === 'phishing' ? 'bg-red-500/10 text-red-500' :
                    scan.verdict?.toLowerCase() === 'safe' ? 'bg-emerald-500/10 text-emerald-500' :
                    'bg-amber-500/10 text-amber-500'
                  }`}>
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold capitalize">{scan.verdict} Detection</p>
                    <p className="text-xs text-muted-foreground">{new Date(scan.timestamp?.toDate()).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{scan.confidence}% Confidence</p>
                </div>
              </div>
            )) : (
              <p className="text-center py-10 text-muted-foreground">No recent activity detected.</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="p-6 bg-card border border-border rounded-3xl shadow-lg hover:shadow-xl transition-all">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{title}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold tracking-tight">{value}</div>
    </div>
  );
}
