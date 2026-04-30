import React, { useState, useEffect } from 'react';

const CountUp = ({ end, label }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end]);

  return (
    <div className="flex flex-col items-center px-4 border-r border-slate-200/50 last:border-0">
      <span className="text-sm font-bold text-slate-800">{count}</span>
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{label}</span>
    </div>
  );
};

export const StatisticsBar = ({ nodes, edges }) => {
  const stats = {
    nodes: nodes.length,
    edges: edges.length,
    vlans: 7,
    floors: 3,
    isps: nodes.filter(n => n.type === 'isp').length,
    aps: nodes.filter(n => n.type === 'ap' || n.data?.nodeType === 'ap').length,
    servers: nodes.filter(n => n.type === 'server' || n.data?.nodeType === 'server').length
  };

  return (
    <div className="fixed bottom-0 left-0 w-full h-14 bg-white/80 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-40 flex items-center justify-center pointer-events-none">
      <div className="flex items-center bg-slate-50/50 px-6 py-1.5 rounded-2xl shadow-sm border border-slate-200 pointer-events-auto">
        <CountUp end={stats.nodes} label="Total Nodes" />
        <CountUp end={stats.edges} label="Active Links" />
        <CountUp end={stats.vlans} label="VLANs" />
        <CountUp end={stats.floors} label="Floors" />
        <CountUp end={stats.isps} label="ISPs" />
        <CountUp end={stats.aps} label="Access Pts" />
        <CountUp end={stats.servers} label="Servers" />
      </div>
    </div>
  );
};
