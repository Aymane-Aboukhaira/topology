import React, { useState, useEffect } from 'react';
import { X, Network, MousePointerClick, Maximize, Filter } from 'lucide-react';

export const WelcomeModal = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('topo-welcome-seen');
    if (!seen) {
      setIsVisible(true);
    }
  }, []);

  const close = () => {
    setIsVisible(false);
    localStorage.setItem('topo-welcome-seen', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 p-8 max-w-md w-full animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20">
              <Network className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">NetTopo</h2>
          </div>
          <button onClick={close} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <p className="text-slate-600 mb-6 leading-relaxed">
          Welcome to the interactive enterprise network topology visualization. Explore the infrastructure with the following controls:
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <MousePointerClick className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-sm"><strong>Click any device</strong> for details & properties</span>
          </div>
          <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <Maximize className="w-5 h-5 text-amber-500" />
            <span className="font-medium text-sm"><strong>Scroll to zoom</strong>, drag canvas to pan</span>
          </div>
          <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <Filter className="w-5 h-5 text-indigo-500" />
            <span className="font-medium text-sm"><strong>Use the toolbar</strong> to filter layers & trace paths</span>
          </div>
          <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <Network className="w-5 h-5 text-green-500" />
            <span className="font-medium text-sm"><strong>Double-click Conference Room</strong> for AV zoom-view</span>
          </div>
        </div>

        <button 
          onClick={close}
          className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98]"
        >
          Explore Network
        </button>
      </div>
    </div>
  );
};
