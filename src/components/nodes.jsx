import React from 'react';
import { Handle, Position } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';
import { Cloud, Shield, Server, Router as RouterIcon, Wifi, Laptop, Printer, Video, ScanLine, Smartphone, Database, Activity, Box } from 'lucide-react';

const HandleStyles = "w-3 h-3 !bg-blue-500 !border-2 !border-white !z-50 cursor-crosshair transition-transform hover:scale-150";

const BaseNode = ({ id, data, selected, children, className = '', accentColor = 'bg-blue-500' }) => (
  <div className={`relative group min-w-[160px] bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/80 shadow-sm transition-all duration-200 ${selected ? 'ring-2 ring-blue-500 shadow-blue-500/20' : 'hover:shadow-md'} ${className}`}>
    <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${accentColor}`} />
    
    {/* All handles are source to allow universal ConnectionMode.Loose logic */}
    <Handle type="source" position={Position.Top} id="top" className={HandleStyles} />
    <Handle type="source" position={Position.Left} id="left" className={HandleStyles} />
    <Handle type="source" position={Position.Bottom} id="bottom" className={HandleStyles} />
    <Handle type="source" position={Position.Right} id="right" className={HandleStyles} />
    
    <div className="p-3 pl-4 pointer-events-none">
      {children}
    </div>

    {/* Tooltip */}
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 w-48 p-2 bg-slate-800/95 backdrop-blur text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
      <div className="font-bold mb-1">{data.label}</div>
      {data.sublabel && <div className="text-slate-300">{data.sublabel}</div>}
      {data.layer && <div className="text-slate-400 mt-1 capitalize">Layer: {data.layer}</div>}
    </div>
  </div>
);

export const CloudNode = ({ data, selected }) => (
  <div className={`relative group flex flex-col items-center justify-center w-36 h-24 rounded-full bg-gradient-to-b from-blue-50 to-blue-100/80 border border-blue-200 shadow-sm backdrop-blur-md transition-all ${selected ? 'ring-4 ring-blue-400 shadow-blue-400/30' : ''}`}>
    <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-blue-400" style={{ animationDuration: '3s' }}></div>
    
    <Handle type="source" position={Position.Top} id="top" className={HandleStyles} />
    <Handle type="source" position={Position.Left} id="left" className={HandleStyles} />
    <Handle type="source" position={Position.Right} id="right" className={HandleStyles} />
    <Handle type="source" position={Position.Bottom} id="bottom" className={HandleStyles} />
    
    <Cloud className="w-8 h-8 text-blue-500 mb-1 drop-shadow-sm pointer-events-none" />
    <div className="text-sm font-bold text-slate-700 pointer-events-none">{data.label}</div>
    <div className="text-[10px] text-slate-500 uppercase tracking-widest pointer-events-none">{data.sublabel}</div>
  </div>
);

export const ISPNode = ({ data, selected }) => {
  const getColors = (label) => {
    if (label.includes('INWI')) return 'bg-green-500 text-green-700';
    if (label.includes('Orange')) return 'bg-orange-500 text-orange-700';
    if (label.includes('CIRES')) return 'bg-purple-500 text-purple-700';
    return 'bg-slate-500 text-slate-700';
  };
  const colorStr = getColors(data.label);
  const accent = colorStr.split(' ')[0];
  const textIcon = colorStr.split(' ')[1];
  
  return (
    <BaseNode data={data} selected={selected} accentColor={accent}>
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded-lg bg-slate-50 border border-slate-100 shadow-sm`}>
          <Activity className={`w-5 h-5 ${textIcon}`} />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-800">{data.label}</div>
          <div className="text-xs text-slate-500 truncate max-w-[140px]">{data.sublabel}</div>
        </div>
      </div>
    </BaseNode>
  );
};

export const FirewallNode = ({ data, selected }) => {
  const isActive = data.sublabel?.includes('Active');
  return (
    <BaseNode data={data} selected={selected} accentColor={isActive ? 'bg-orange-500' : 'bg-red-500'}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-red-50/50 border border-red-100 shadow-sm">
            <Shield className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800">{data.label}</div>
            <div className="text-xs text-slate-500">{data.sublabel?.split('·')[0]}</div>
          </div>
        </div>
        <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm border ${isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
          {isActive ? 'ACTIVE' : 'PASSIVE'}
        </div>
      </div>
    </BaseNode>
  );
};

export const SwitchNode = ({ data, selected }) => {
  const isCore = data.nodeType === 'core';
  const ports = data.sublabel?.match(/(\d+)p/)?.[1] || (isCore ? '48' : '24');
  return (
    <BaseNode data={data} selected={selected} accentColor={isCore ? 'bg-indigo-500' : 'bg-blue-500'}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg border shadow-sm ${isCore ? 'bg-indigo-50 border-indigo-100' : 'bg-blue-50 border-blue-100'}`}>
            <RouterIcon className={`w-5 h-5 ${isCore ? 'text-indigo-500' : 'text-blue-500'}`} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800">{data.label}</div>
            <div className="text-xs text-slate-500 truncate max-w-[120px]">{data.sublabel?.split('·')[0]}</div>
          </div>
        </div>
        <div className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 font-semibold border border-blue-200 rounded shadow-sm">
          {ports}P
        </div>
      </div>
    </BaseNode>
  );
};

export const ServerNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} accentColor="bg-slate-700">
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 shadow-sm">
          <Server className="w-5 h-5 text-slate-700" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-800">{data.label}</div>
          <div className="text-xs text-slate-500 truncate max-w-[120px]">{data.sublabel || 'Server'}</div>
        </div>
      </div>
      {data.layer && (
        <div className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600 font-bold rounded border border-slate-300 shadow-sm uppercase tracking-wide">
          {data.layer.replace('rack', 'R')}
        </div>
      )}
    </div>
  </BaseNode>
);

export const EndDeviceNode = ({ data, selected }) => {
  const getIcon = () => {
    const l = (data.label || '').toLowerCase();
    const t = (data.nodeType || '').toLowerCase();
    if (l.includes('printer') || t.includes('printer')) return <Printer className="w-4 h-4 text-slate-600 pointer-events-none" />;
    if (l.includes('camera') || t.includes('camera') || t.includes('av')) return <Video className="w-4 h-4 text-slate-600 pointer-events-none" />;
    if (l.includes('scanner')) return <ScanLine className="w-4 h-4 text-slate-600 pointer-events-none" />;
    if (l.includes('phone') || l.includes('mobile')) return <Smartphone className="w-4 h-4 text-slate-600 pointer-events-none" />;
    if (l.includes('storage') || l.includes('netapp') || t.includes('storage')) return <Database className="w-4 h-4 text-slate-600 pointer-events-none" />;
    return <Laptop className="w-4 h-4 text-slate-600 pointer-events-none" />;
  };

  const vlanColors = {
    greenData: 'bg-green-500',
    wireless: 'bg-blue-500',
    printers: 'bg-orange-500',
    hydra: 'bg-purple-500',
    enfco: 'bg-amber-500',
    production: 'bg-red-500',
    management: 'bg-gray-500'
  };
  const dotColor = vlanColors[data.vlan] || 'bg-slate-300';

  return (
    <div className={`relative group flex items-center gap-2 px-2.5 py-1.5 bg-white/95 backdrop-blur-md rounded-lg border border-slate-200/80 shadow-sm transition-all ${selected ? 'ring-2 ring-slate-400 shadow-slate-300' : 'hover:shadow'}`}>
      <Handle type="source" position={Position.Top} id="top" className={HandleStyles} />
      <Handle type="source" position={Position.Left} id="left" className={HandleStyles} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={HandleStyles} />
      <Handle type="source" position={Position.Right} id="right" className={HandleStyles} />
      
      {getIcon()}
      <div className="flex flex-col pointer-events-none">
        <span className="text-[11px] font-semibold text-slate-800 leading-tight whitespace-nowrap">{data.label}</span>
      </div>
      <div className={`w-2 h-2 rounded-full ${dotColor} ml-1 border border-white shadow-sm`} title={`VLAN: ${data.vlan || 'None'}`} />
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2.5 py-1.5 bg-slate-800/95 backdrop-blur text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
        <span className="font-bold">{data.label}</span> {data.sublabel ? <span className="text-slate-300">({data.sublabel})</span> : ''}
        {data.vlan && <div className="mt-0.5 text-slate-400">VLAN: {data.vlan}</div>}
      </div>
    </div>
  );
};

export const APNode = ({ data, selected }) => {
  const countMatch = data.sublabel?.match(/×(\d+)/) || data.sublabel?.match(/(\d+)x/i);
  const count = countMatch ? countMatch[1] : '1';
  return (
    <div className={`relative group flex items-center gap-2.5 px-3 py-2 bg-teal-50/95 backdrop-blur-md rounded-xl border border-teal-200/80 shadow-sm transition-all ${selected ? 'ring-2 ring-teal-400 shadow-teal-300/30' : 'hover:shadow-md'}`}>
      <Handle type="source" position={Position.Top} id="top" className={HandleStyles} />
      <Handle type="source" position={Position.Left} id="left" className={HandleStyles} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={HandleStyles} />
      <Handle type="source" position={Position.Right} id="right" className={HandleStyles} />
      
      <div className="w-7 h-7 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center shadow-inner pointer-events-none">
        <Wifi className="w-4 h-4 text-teal-600" />
      </div>
      <div className="pointer-events-none">
        <div className="text-xs font-bold text-teal-900">{data.label}</div>
        <div className="text-[10px] text-teal-600 truncate max-w-[90px]">{data.sublabel?.split('·')[0]}</div>
      </div>
      {count !== '1' && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-teal-500 border-2 border-white text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm pointer-events-none">
          {count}
        </div>
      )}
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2.5 py-1.5 bg-slate-800/95 backdrop-blur text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
        <span className="font-bold">{data.label}</span> {data.sublabel ? <span className="text-slate-300">({data.sublabel})</span> : ''}
      </div>
    </div>
  );
};

export const GroupNode = ({ data, selected }) => {
  return (
    <div className={`relative w-full h-full rounded-2xl border-2 border-dashed ${selected ? 'border-indigo-400 bg-indigo-50/10 shadow-lg shadow-indigo-500/5' : 'border-slate-300/80 bg-slate-50/30'} backdrop-blur-[2px] transition-all duration-300`}>
      <Handle type="source" position={Position.Top} id="top" className={HandleStyles} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={HandleStyles} />
      <div className={`absolute top-0 left-0 right-0 px-4 py-2 rounded-t-xl border-b ${selected ? 'bg-indigo-100/90 border-indigo-200' : 'bg-slate-200/60 border-slate-300/80'} flex items-center justify-between backdrop-blur-md pointer-events-none`}>
        <div className="flex items-center gap-2">
          <Box className={`w-4 h-4 ${selected ? 'text-indigo-600' : 'text-slate-500'}`} />
          <span className={`text-xs font-bold uppercase tracking-widest ${selected ? 'text-indigo-900' : 'text-slate-700'}`}>
            {data.label}
          </span>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${selected ? 'bg-indigo-200/50 text-indigo-700' : 'bg-slate-300/50 text-slate-600'}`}>
          {data.layer}
        </span>
      </div>
    </div>
  );
};

export const StickyNode = ({ data, selected }) => {
  return (
    <div className={`relative w-full h-full min-w-[120px] min-h-[120px] bg-yellow-100/95 backdrop-blur-sm shadow-lg p-4 transition-all duration-300 ease-out border border-yellow-200/50 ${selected ? 'ring-2 ring-yellow-400 shadow-yellow-500/20 scale-105 z-50' : 'hover:scale-105 hover:shadow-xl'}`} style={{ borderBottomRightRadius: '24px' }}>
      <NodeResizer color="#eab308" isVisible={selected} minWidth={120} minHeight={120} />
      {/* Corner fold */}
      <div className="absolute bottom-0 right-0 w-6 h-6 bg-yellow-200/80 rounded-tl-xl shadow-sm border-l border-t border-yellow-300/50"></div>
      
      <div className="w-full h-full flex flex-col pointer-events-none">
        <div className="font-extrabold text-yellow-800 text-xs mb-2 uppercase tracking-wide border-b border-yellow-200/50 pb-1">{data.label || 'Note'}</div>
        <div className="text-xs text-yellow-900 leading-relaxed whitespace-pre-wrap flex-grow overflow-hidden">{data.notes || "Select this note and type in the right panel to add text..."}</div>
      </div>
    </div>
  );
};

export const RegionNode = ({ data, selected }) => {
  return (
    <>
      <NodeResizer color="#6366f1" isVisible={selected} minWidth={200} minHeight={150} />
      <div className={`w-full h-full border-2 border-dashed rounded-xl transition-all ${selected ? 'border-indigo-500 bg-indigo-50/10 shadow-lg shadow-indigo-500/5 z-0' : 'border-slate-300 bg-slate-50/30 -z-10'}`}>
        <div className="absolute top-3 left-4 text-xs font-black text-slate-400 uppercase tracking-[0.2em] pointer-events-none opacity-50">
          {data.label || 'Area Region'}
        </div>
      </div>
    </>
  );
};
