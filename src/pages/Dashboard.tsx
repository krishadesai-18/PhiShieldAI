import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, AlertTriangle, CheckCircle, Clock, ArrowRight, AlertCircle } from 'lucide-react';
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
        setRecentScans(scans.slice(0, 4));
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
    { name: 'Phishing', value: stats.phishing || 0, color: '#ef4444' },
    { name: 'Suspicious', value: stats.suspicious || 0, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  if (loading) return <div className="p-20 text-center">Loading security profile...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Analyze email security threats</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Scans" value={stats.total} icon={<Clock className="text-primary" />} />
        <StatCard title="Safe Emails" value={stats.safe} icon={<CheckCircle className="text-emerald-500" />} />
        <StatCard title="Blocked Phishing" value={stats.phishing} icon={<AlertTriangle className="text-red-500" />} />
        <StatCard title="Suspicious" value={stats.suspicious} icon={<AlertCircle className="text-amber-500" />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-card border border-border rounded-3xl p-6 shadow-xl flex flex-col min-h-[400px]">
          <h3 className="text-lg font-bold mb-2">Threat Distribution</h3>
          {data.length > 0 ? (
            <div className="flex-grow flex flex-col justify-between pt-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-1 gap-3 mt-8 bg-muted/20 p-5 rounded-2xl border border-border/50">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 px-1">Security Legend</p>
                {data.map(d => (
                  <div key={d.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-3 h-3 rounded-full" style={{ backgroundColor: d.color, boxShadow: `0 0 12px ${d.color}60` }}></div>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-foreground">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-black tracking-tighter text-primary">{d.value}</span>
                    </div>
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
            <h3 className="text-lg font-bold">Recent</h3>
            <Link to="/history" className="text-xs text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentScans.length > 0 ? recentScans.map((scan) => (
              <Link 
                key={scan.id} 
                to={`/history?id=${scan.id}`}
                className={`flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 transition-all group ${
                  scan.verdict?.toLowerCase() === 'phishing' ? 'hover:border-red-500/30 hover:bg-red-500/5' :
                  scan.verdict?.toLowerCase() === 'safe' ? 'hover:border-emerald-500/30 hover:bg-emerald-500/5' :
                  'hover:border-amber-500/30 hover:bg-amber-500/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg relative overflow-hidden flex items-center justify-center bg-muted`}>
                    {scan.imageUrl ? (
                      <img src={scan.imageUrl} alt="scan" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        scan.verdict?.toLowerCase() === 'phishing' ? 'bg-red-500/10 text-red-500' :
                        scan.verdict?.toLowerCase() === 'safe' ? 'bg-emerald-500/10 text-emerald-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        {scan.verdict?.toLowerCase() === 'phishing' ? <AlertTriangle className="w-5 h-5" /> :
                         scan.verdict?.toLowerCase() === 'suspicious' ? <AlertCircle className="w-5 h-5" /> :
                         <CheckCircle className="w-5 h-5" />}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate pr-4 transition-colors ${
                      scan.verdict?.toLowerCase() === 'phishing' ? 'group-hover:text-red-500' :
                      scan.verdict?.toLowerCase() === 'safe' ? 'group-hover:text-emerald-500' :
                      'group-hover:text-amber-500'
                    }`}>
                      {scan.imageName || `${scan.verdict} Detection`}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{scan.timestamp ? new Date(scan.timestamp.toDate()).toLocaleString() : 'Recent'}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-xs font-bold ${
                    scan.verdict?.toLowerCase() === 'phishing' ? 'text-red-500' : 
                    scan.verdict?.toLowerCase() === 'safe' ? 'text-emerald-500' : 
                    'text-amber-500'
                  }`}>{scan.confidence}%</p>
                </div>
              </Link>
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
      <div className="text-2xl font-bold tracking-tight">{value}</div>
    </div>
  );
}
