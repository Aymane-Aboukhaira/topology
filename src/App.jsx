import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, { 
  MiniMap, Background, useNodesState, useEdgesState, 
  ReactFlowProvider, useReactFlow, Panel, addEdge,
  Controls, ConnectionMode
} from 'reactflow';
import 'reactflow/dist/style.css';
import html2canvas from 'html2canvas';
import GIF from 'gif.js';
import { 
  Search, ZoomIn, ZoomOut, Maximize, X, Layers, 
  Network, Activity, Server, Download, Trash2, Link, Undo2, Redo2, Image as ImageIcon, Film, FileJson, UploadCloud, Save, User, LogOut
} from 'lucide-react';

import { 
  CloudNode, ISPNode, FirewallNode, SwitchNode, 
  ServerNode, EndDeviceNode, APNode, GroupNode 
} from './components/nodes';
import topologyData from './data/topology';
import { WelcomeModal } from './components/WelcomeModal';
import { StatisticsBar } from './components/StatisticsBar';

const { initialNodes, initialEdges, VLAN_COLORS, EDGE_STYLES } = topologyData;

const nodeTypes = {
  cloud: CloudNode,
  isp: ISPNode,
  firewall: FirewallNode,
  core: SwitchNode,
  switch: SwitchNode,
  aggregation: SwitchNode,
  server: ServerNode,
  storage: ServerNode,
  camera: EndDeviceNode,
  ap: APNode,
  endpoint: EndDeviceNode,
  av: EndDeviceNode,
  infra: EndDeviceNode,
  security: FirewallNode,
  wireless: APNode,
  monitoring: ServerNode,
  group: GroupNode,
  default: EndDeviceNode,
};

const Section = ({ title, children }) => (
  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
    <h3 className="text-[10px] font-extrabold text-slate-400 mb-3 uppercase tracking-widest">{title}</h3>
    {children}
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-sm text-slate-500">{label}</span>
    <span className="text-sm font-semibold text-slate-800 text-right max-w-[150px] truncate" title={value}>{value}</span>
  </div>
);

function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView, zoomIn, zoomOut, project } = useReactFlow();
  const reactFlowWrapper = useRef(null);

  // Account System State
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('topology-active-user') || null);
  const [showLogin, setShowLogin] = useState(!localStorage.getItem('topology-active-user'));
  const [usernameInput, setUsernameInput] = useState('');

  // History State
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [clipboard, setClipboard] = useState({ nodes: [], edges: [] });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Load from local storage or cloud on mount or user change
  useEffect(() => {
    if (!currentUser) return;
    
    // Attempt to load from Cloud API first
    fetch(`/api/load?user=${encodeURIComponent(currentUser)}`)
      .then(res => res.json())
      .then(result => {
        if (result.data) {
          const { nodes: savedNodes, edges: savedEdges } = result.data;
          setNodes(savedNodes && savedNodes.length > 0 ? savedNodes : []);
          setEdges(savedEdges && savedEdges.length > 0 ? savedEdges : []);
        } else {
          throw new Error('No cloud data found');
        }
      })
      .catch((err) => {
        // Fallback to Local Storage if offline or cloud unconfigured
        console.log("Cloud sync unavailable, falling back to local storage:", err);
        const saved = localStorage.getItem(`topology-save-${currentUser}`);
        if (saved) {
          try {
            const { nodes: savedNodes, edges: savedEdges } = JSON.parse(saved);
            setNodes(savedNodes && savedNodes.length > 0 ? savedNodes : []);
            setEdges(savedEdges && savedEdges.length > 0 ? savedEdges : []);
          } catch (e) {
            console.error("Failed to load saved topology");
          }
        } else {
          // New user, blank canvas
          setNodes([]);
          setEdges([]);
        }
      });
  }, [currentUser, setNodes, setEdges]);

  const takeSnapshot = useCallback(() => {
    setPast(p => [...p, { nodes, edges }].slice(-30));
    setFuture([]);
  }, [nodes, edges]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast(p => p.slice(0, -1));
    setFuture(f => [{ nodes, edges }, ...f]);
    setNodes(previous.nodes);
    setEdges(previous.edges);
  }, [past, nodes, edges, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture(f => f.slice(1));
    setPast(p => [...p, { nodes, edges }]);
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [future, nodes, edges, setNodes, setEdges]);

  const updateNodeData = (id, key, value) => {
    // We don't take a snapshot on EVERY keystroke, only on blur if we wanted to, 
    // but ReactFlow state update needs to happen. For simplicity, no history snapshot here to avoid 100 history items for typing a word.
    setNodes(nds => nds.map(n => {
      if (n.id === id) return { ...n, data: { ...n.data, [key]: value } };
      return n;
    }));
    setSelectedNode(prev => ({ ...prev, data: { ...prev.data, [key]: value } }));
  };

  const updateEdgeData = (id, key, value) => {
    setEdges(eds => eds.map(e => {
      if (e.id === id) return { ...e, [key]: value };
      return e;
    }));
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      
      // Select All (Ctrl+A)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setNodes(nds => nds.map(n => ({ ...n, selected: true })));
        setEdges(eds => eds.map(edge => ({ ...edge, selected: true })));
      }

      // Duplicate (Ctrl+D)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const selectedNodes = nodes.filter(n => n.selected);
        if (selectedNodes.length > 0) {
          takeSnapshot();
          const idMap = {};
          const newNodes = selectedNodes.map(node => {
            const newId = `${node.type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            idMap[node.id] = newId;
            return {
              ...node, id: newId, selected: true,
              position: { x: node.position.x + 50, y: node.position.y + 50 }
            };
          });

          // Duplicate internal edges
          const selectedEdges = edges.filter(edge => idMap[edge.source] && idMap[edge.target]);
          const newEdges = selectedEdges.map(edge => ({
            ...edge,
            id: `e_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            source: idMap[edge.source], target: idMap[edge.target], selected: true
          }));

          setNodes(nds => [...nds.map(n => ({ ...n, selected: false })), ...newNodes]);
          setEdges(eds => [...eds.map(e => ({ ...e, selected: false })), ...newEdges]);
        }
      }

      // Copy (Ctrl+C)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        const selectedNodes = nodes.filter(n => n.selected);
        if (selectedNodes.length > 0) {
          e.preventDefault();
          const selectedNodeIds = new Set(selectedNodes.map(n => n.id));
          const selectedEdges = edges.filter(edge => selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target));
          setClipboard({ nodes: selectedNodes, edges: selectedEdges });
        }
      }

      // Cut (Ctrl+X)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        const selectedNodes = nodes.filter(n => n.selected);
        if (selectedNodes.length > 0) {
          e.preventDefault();
          takeSnapshot();
          const selectedNodeIds = new Set(selectedNodes.map(n => n.id));
          const selectedEdges = edges.filter(edge => selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target));
          setClipboard({ nodes: selectedNodes, edges: selectedEdges });
          
          setNodes(nds => nds.filter(n => !n.selected));
          setEdges(eds => eds.filter(edge => !selectedNodeIds.has(edge.source) && !selectedNodeIds.has(edge.target)));
        }
      }

      // Paste (Ctrl+V)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        if (clipboard.nodes.length > 0) {
          e.preventDefault();
          takeSnapshot();
          const idMap = {};
          const newNodes = clipboard.nodes.map(node => {
            const newId = `${node.type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            idMap[node.id] = newId;
            return {
              ...node, id: newId, selected: true,
              position: { x: node.position.x + 50, y: node.position.y + 50 }
            };
          });

          const newEdges = clipboard.edges.map(edge => ({
            ...edge,
            id: `e_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            source: idMap[edge.source], target: idMap[edge.target], selected: true
          }));

          setNodes(nds => [...nds.map(n => ({ ...n, selected: false })), ...newNodes]);
          setEdges(eds => [...eds.map(e => ({ ...e, selected: false })), ...newEdges]);
          
          // Update clipboard so next paste offsets further
          setClipboard({ nodes: newNodes, edges: newEdges });
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) { e.preventDefault(); redo(); }
        else { e.preventDefault(); undo(); }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault(); redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, nodes, edges, setNodes, setEdges, takeSnapshot, clipboard]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeCableType, setActiveCableType] = useState('access');

  const onDragStart = (event, nodeData) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const nodeDataStr = event.dataTransfer.getData('application/reactflow');
      if (!nodeDataStr) return;
      
      takeSnapshot();
      const nodeData = JSON.parse(nodeDataStr);
      const position = project({ x: event.clientX - reactFlowBounds.left, y: event.clientY - reactFlowBounds.top });

      const uniqueId = `${nodeData.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const newNode = {
        id: uniqueId,
        type: nodeData.type,
        position,
        data: nodeData.data,
        style: nodeData.style || {}
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [project, setNodes, takeSnapshot]
  );

  const onConnect = useCallback((params) => {
    takeSnapshot();
    const styleDef = EDGE_STYLES[activeCableType] || EDGE_STYLES['access'];
    
    const originalEdge = initialEdges.find(e => 
      (e.source === params.source && e.target === params.target) || 
      (e.target === params.source && e.source === params.target)
    );

    const newEdge = {
      ...params,
      id: `e-${params.source}-${params.target}-${Date.now()}`,
      data: { edgeType: activeCableType },
      animated: originalEdge ? originalEdge.animated : (activeCableType === 'sdwan' || activeCableType === 'heartbeat' || activeCableType === 'backbone' || activeCableType === 'microwave'),
      label: originalEdge ? originalEdge.label : '',
      style: {
        stroke: styleDef.stroke,
        strokeWidth: styleDef.strokeWidth || 2,
        strokeDasharray: styleDef.dash || ''
      },
      className: originalEdge?.className || ''
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [activeCableType, setEdges, takeSnapshot]);

  const deleteNode = (id) => {
    takeSnapshot();
    setNodes(nds => nds.filter(n => n.id !== id));
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
    setSelectedNode(null);
  };

  const deleteEdge = (id) => {
    takeSnapshot();
    setEdges(eds => eds.filter(e => e.id !== id));
  };

  const onNodesDelete = useCallback(() => takeSnapshot(), [takeSnapshot]);
  const onEdgesDelete = useCallback(() => takeSnapshot(), [takeSnapshot]);

  // Dynamic Styles
  useEffect(() => {
    setNodes((nds) => nds.map((n) => {
      let opacity = 1;
      let boxShadow = n.style?.boxShadow || 'none';
      const isSearchMatch = searchQuery !== '' && (n.data.label.toLowerCase().includes(searchQuery.toLowerCase()) || n.data.sublabel?.toLowerCase().includes(searchQuery.toLowerCase()));

      if (searchQuery) {
        opacity = isSearchMatch ? 1 : 0.2;
        boxShadow = isSearchMatch && n.type !== 'group' ? '0 0 0 4px rgba(59, 130, 246, 0.5)' : 'none';
      } else if (hoveredNode) {
        const isNeighbor = edges.some(e => (e.source === hoveredNode && e.target === n.id) || (e.target === hoveredNode && e.source === n.id));
        opacity = (n.id === hoveredNode || isNeighbor || n.type === 'group') ? 1 : 0.2;
      }
      return { ...n, style: { ...n.style, opacity, boxShadow, transition: 'all 0.3s ease' } };
    }));

    setEdges((eds) => eds.map(e => {
      let opacity = 1;
      let stroke = EDGE_STYLES[e.data?.edgeType]?.stroke || '#94a3b8';
      let strokeWidth = EDGE_STYLES[e.data?.edgeType]?.strokeWidth || 2;
      let animated = e.animated || false;

      let className = e.className || '';
      if (e.data?.edgeType === 'heartbeat') className = 'edge-heartbeat';
      if (e.data?.edgeType === 'vss') className = 'edge-vss';
      if (e.data?.edgeType === 'sdwan') className = 'edge-sdwan';
      if (e.data?.edgeType === 'microwave') className = 'edge-microwave';

      if (hoveredNode) {
        if (e.source === hoveredNode || e.target === hoveredNode) {
          opacity = 1; stroke = '#3b82f6'; strokeWidth = 3;
        } else opacity = 0.15;
      } else if (hoveredEdge) opacity = e.id === hoveredEdge.id ? 1 : 0.15;
      else if (searchQuery) opacity = 0.2;

      return { ...e, animated, className, style: { ...e.style, stroke, strokeWidth, opacity, transition: 'all 0.3s ease' } };
    }));
  }, [searchQuery, hoveredNode, hoveredEdge, setNodes, setEdges, edges]);

  const onNodeClick = useCallback((_, node) => setSelectedNode(node), []);
  const onPaneClick = useCallback(() => setSelectedNode(null), []);
  const onNodeMouseEnter = useCallback((_, node) => setHoveredNode(node.id), []);
  const onNodeMouseLeave = useCallback(() => setHoveredNode(null), []);
  const onEdgeMouseEnter = useCallback((event, edge) => {
    setHoveredEdge(edge);
    setMousePos({ x: event.clientX, y: event.clientY });
  }, []);
  const onEdgeMouseMove = useCallback((event) => {
    if (hoveredEdge) setMousePos({ x: event.clientX, y: event.clientY });
  }, [hoveredEdge]);
  const onEdgeMouseLeave = useCallback(() => setHoveredEdge(null), []);

  const handleExportPNG = () => {
    const element = document.querySelector('.react-flow__viewport');
    if (element) {
      html2canvas(element, { backgroundColor: null }).then((canvas) => {
        const link = document.createElement('a'); link.download = 'custom-topology.png';
        link.href = canvas.toDataURL('image/png'); link.click();
      });
    }
  };

  const handleExportGIF = async () => {
    // Capture the main container instead of viewport to avoid CSS transform bugs rendering a blank image
    const element = document.querySelector('.react-flow');
    if (!element) return;
    setIsExporting(true);
    setExportProgress(0);
    
    const gif = new GIF({
      workers: 2,
      quality: 10,
      workerScript: '/gif.worker.js',
      width: element.clientWidth,
      height: element.clientHeight,
      background: '#f8fafc'
    });

    gif.on('progress', p => setExportProgress(Math.round(p * 100)));
    
    gif.on('finished', (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'topology-animated.gif';
      link.href = url;
      link.click();
      setIsExporting(false);
      setExportProgress(0);
    });

    // html2canvas ignores CSS animations and sometimes CSS classes on SVGs. 
    // To capture moving links, we must manually step the stroke-dashoffset on the SVG paths 
    // frame by frame and force all styles to be inline!
    const paths = Array.from(element.querySelectorAll('path.react-flow__edge-path'));
    
    // Store original inline styles to restore later
    const originalStyles = paths.map(p => p.style.cssText);
    
    // Disable CSS animations and force computed styles inline for html2canvas
    paths.forEach(p => {
      const computed = window.getComputedStyle(p);
      // Force inline
      p.style.strokeDasharray = computed.strokeDasharray !== 'none' ? computed.strokeDasharray : '';
      p.style.strokeWidth = computed.strokeWidth;
      p.style.stroke = computed.stroke;
      
      p.style.animation = 'none';
      p.style.transition = 'none';
    });

    const numFrames = 15;
    for (let i = 0; i < numFrames; i++) {
      const progress = i / numFrames;
      
      paths.forEach(p => {
        // Find if it has a custom max offset
        const parentEdge = p.closest('.react-flow__edge');
        const isMicrowave = parentEdge?.classList.contains('edge-microwave') || parentEdge?.classList.contains('microwave');
        const maxOffset = isMicrowave ? 32 : 100;
        // Move the dash offset backwards to simulate forward flow
        p.style.strokeDashoffset = `${maxOffset - (progress * maxOffset)}px`;
      });

      const canvas = await html2canvas(element, { 
        backgroundColor: '#f8fafc', 
        scale: 1, 
        logging: false,
        useCORS: true
      });
      
      gif.addFrame(canvas, { delay: 100, copy: true });
    }

    // Restore original CSS animations
    paths.forEach((p, index) => {
      p.style.cssText = originalStyles[index];
    });

    gif.render();
  };

  const saveToStorage = async () => {
    if (!currentUser) return;
    
    const payload = { nodes, edges };
    // Always save locally as a backup
    localStorage.setItem(`topology-save-${currentUser}`, JSON.stringify(payload));
    
    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: currentUser, data: payload })
      });
      
      if (!response.ok) throw new Error('Cloud API error');
      alert(`Workspace saved & synced to Cloud Account: ${currentUser}`);
    } catch (err) {
      console.log("Cloud API unavailable, saved locally.", err);
      alert(`Workspace saved locally to: ${currentUser} (Cloud sync pending Setup)`);
    }
  };

  const downloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ nodes, edges }));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "custom-topology.json");
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const uploadJSON = (e) => {
    if (!e.target.files[0]) return;
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = event => {
      try {
        const { nodes: newNodes, edges: newEdges } = JSON.parse(event.target.result);
        takeSnapshot();
        setNodes(newNodes || []);
        setEdges(newEdges || []);
      } catch (err) {
        alert("Invalid topology JSON file");
      }
    };
  };

  const inventory = initialNodes.filter(n => n.type !== 'group');
  const groupedInventory = inventory.reduce((acc, node) => {
    const layer = node.data.layer || node.type;
    if (!acc[layer]) acc[layer] = [];
    acc[layer].push(node); return acc;
  }, {});

  return (
    <div className="w-full h-full flex relative font-sans text-slate-800" onMouseMove={onEdgeMouseMove}>
      
      {/* Left Sidebar: Inventory & Tools */}
      <div className="w-80 h-full bg-white/95 backdrop-blur-xl border-r border-slate-200/80 shadow-2xl flex flex-col z-50">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
          <div className="p-2 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20 text-white">
            <Network size={20} />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-slate-800 tracking-tight leading-tight">Builder Mode</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Drag & Drop Engine</p>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar p-4 flex flex-col gap-6">
          
          <div>
            <h2 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Link size={12}/> Connection Cables
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(EDGE_STYLES).map(([key, style]) => (
                <button
                  key={key}
                  onClick={() => setActiveCableType(key)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${activeCableType === key ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'}`}
                >
                  <svg width="40" height="10" className="mb-1">
                    <line x1="0" y1="5" x2="40" y2="5" stroke={style.stroke} strokeWidth={style.strokeWidth || 2} strokeDasharray={style.dash || ''} />
                  </svg>
                  <span className="text-[10px] font-bold text-slate-600 truncate w-full text-center">{style.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="w-full h-px bg-slate-100"></div>

          <div>
            <h2 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Server size={12}/> Equipment Inventory
            </h2>
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" placeholder="Search inventory..." 
                className="w-full bg-slate-100 border-none rounded-lg py-2 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none focus:ring-2 ring-blue-400"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              {Object.entries(groupedInventory).map(([layer, items]) => {
                const filteredItems = items.filter(n => n.data.label.toLowerCase().includes(searchQuery.toLowerCase()) || n.data.sublabel?.toLowerCase().includes(searchQuery.toLowerCase()));
                if (filteredItems.length === 0) return null;
                return (
                  <div key={layer}>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2 px-1">{layer}</h3>
                    <div className="space-y-2">
                      {filteredItems.map(node => (
                        <div key={node.id} draggable onDragStart={(e) => onDragStart(e, node)} className="bg-white border border-slate-200 rounded-xl p-3 cursor-grab hover:border-blue-400 hover:shadow-md transition-all active:cursor-grabbing flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                            <Server className="w-5 h-5 text-blue-500" />
                          </div>
                          <div className="overflow-hidden">
                            <div className="text-xs font-extrabold text-slate-800 truncate">{node.data.label}</div>
                            <div className="text-[10px] text-slate-500 truncate">{node.data.sublabel || node.data.nodeType || node.type}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              {inventory.length === 0 && (
                <div className="text-xs text-center text-slate-400 p-4 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                  All equipment deployed!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-grow h-full relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodesDelete={onNodesDelete}
          onEdgesDelete={onEdgesDelete}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          onEdgeMouseEnter={onEdgeMouseEnter}
          onEdgeMouseLeave={onEdgeMouseLeave}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          selectionMode="partial"
          selectionKeyCode="Shift"
          multiSelectionKeyCode="Shift"
          fitView
          nodesFocusable={true}
          edgesFocusable={true}
          minZoom={0.1}
          maxZoom={2}
          className="bg-[#f8fafc]"
        >
          <Background color="#cbd5e1" gap={24} size={2} variant="dots" style={{ backgroundColor: '#f0f4ff' }} />
          <Controls className="bg-white border-slate-200 shadow-xl rounded-xl" />
          
          <Panel position="top-right" className="m-4 flex items-center gap-2">
             <button onClick={undo} disabled={past.length === 0} className="p-2.5 bg-white/90 backdrop-blur shadow-xl border border-slate-200/80 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Undo (Ctrl+Z)">
                <Undo2 size={16} />
             </button>
             <button onClick={redo} disabled={future.length === 0} className="p-2.5 bg-white/90 backdrop-blur shadow-xl border border-slate-200/80 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Redo (Ctrl+Y)">
                <Redo2 size={16} />
             </button>

             <div className="w-px h-6 bg-slate-300 mx-1"></div>

             <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-1.5 shadow-sm mr-1">
               <div className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center">
                 <User size={12} />
               </div>
               <span className="text-xs font-bold text-indigo-900 truncate max-w-[100px]">{currentUser || 'Guest'}</span>
               <button onClick={() => setShowLogin(true)} className="ml-1 p-1 hover:bg-indigo-100 text-indigo-500 hover:text-indigo-700 rounded-lg transition-colors" title="Switch Account">
                 <LogOut size={14} />
               </button>
             </div>

             <button onClick={saveToStorage} className="p-2.5 bg-blue-500 shadow-xl shadow-blue-500/20 border border-blue-400 text-white rounded-xl hover:bg-blue-600 transition-colors" title="Save Workspace">
                <Save size={16} />
             </button>
             
             <label className="p-2.5 bg-white/90 backdrop-blur shadow-xl border border-slate-200/80 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer" title="Load Topology JSON">
                <UploadCloud size={16} />
                <input type="file" accept=".json" className="hidden" onChange={uploadJSON} />
             </label>
             
             <div className="relative group ml-1">
               <button className="px-4 py-2 bg-white/90 backdrop-blur shadow-xl border border-slate-200/80 text-slate-700 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors hover:bg-slate-50 min-w-[110px] justify-center">
                  {isExporting ? `Rendering... ${exportProgress}%` : <><Download size={16} /> Export</>}
               </button>
               {!isExporting && (
                 <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-200 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50 overflow-hidden flex flex-col">
                   <button onClick={handleExportPNG} className="px-4 py-3 flex items-center gap-2 text-xs font-bold text-slate-700 hover:bg-slate-50 text-left border-b border-slate-100">
                     <ImageIcon size={14} className="text-slate-400" /> Image (.png)
                   </button>
                   <button onClick={handleExportGIF} className="px-4 py-3 flex items-center gap-2 text-xs font-bold text-slate-700 hover:bg-slate-50 text-left border-b border-slate-100">
                     <Film size={14} className="text-indigo-500" /> Animation (.gif)
                   </button>
                   <button onClick={downloadJSON} className="px-4 py-3 flex items-center gap-2 text-xs font-bold text-slate-700 hover:bg-blue-50 text-left text-blue-600">
                     <FileJson size={14} className="text-blue-500" /> Data (.json)
                   </button>
                 </div>
               )}
             </div>
          </Panel>

        </ReactFlow>

        {hoveredEdge && (
          <div className="fixed z-50 bg-slate-800/95 backdrop-blur text-white px-3 py-2 rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-[120%]" style={{ left: mousePos.x, top: mousePos.y }}>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">Link Configuration</div>
            <div className="text-sm font-bold">{hoveredEdge.data?.edgeType?.toUpperCase() || 'LINK'}</div>
            {hoveredEdge.label && <div className="text-xs text-blue-300 font-semibold mt-0.5">{hoveredEdge.label}</div>}
          </div>
        )}

        <div className={`absolute top-0 right-0 h-full w-[320px] bg-white/95 backdrop-blur-xl border-l border-slate-200/80 shadow-2xl z-50 p-5 flex flex-col gap-4 transition-transform duration-500 ease-in-out ${selectedNode ? 'translate-x-0' : 'translate-x-full'}`}>
          <button onClick={() => setSelectedNode(null)} className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={16} />
          </button>

          {selectedNode && (
            <>
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4 mt-1">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-inner flex-shrink-0">
                  <Server className="w-7 h-7 text-blue-600" />
                </div>
                <div className="overflow-hidden pr-6">
                  <h2 className="font-extrabold text-base text-slate-800 leading-tight truncate" title={selectedNode.data.label}>{selectedNode.data.label}</h2>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mt-1">{selectedNode.data.nodeType || selectedNode.type}</span>
                </div>
              </div>

              <div className="space-y-4 flex-grow overflow-y-auto pr-1 pb-10 custom-scrollbar">
                
                <Section title="Edit Details">
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Device Name</label>
                      <input 
                        className="w-full text-sm font-semibold text-slate-800 bg-slate-100/50 border border-slate-200 rounded-md px-2 py-1 mt-1 focus:ring-2 focus:ring-blue-400 outline-none transition-all" 
                        value={selectedNode.data.label} 
                        onChange={(e) => updateNodeData(selectedNode.id, 'label', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Sublabel / Info</label>
                      <input 
                        className="w-full text-sm font-semibold text-slate-800 bg-slate-100/50 border border-slate-200 rounded-md px-2 py-1 mt-1 focus:ring-2 focus:ring-blue-400 outline-none transition-all" 
                        value={selectedNode.data.sublabel || ''} 
                        onChange={(e) => updateNodeData(selectedNode.id, 'sublabel', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Notes / Comments</label>
                      <textarea 
                        className="w-full text-xs font-medium text-slate-700 bg-slate-100/50 border border-slate-200 rounded-md px-2 py-1.5 mt-1 focus:ring-2 focus:ring-blue-400 outline-none min-h-[70px] custom-scrollbar transition-all resize-none" 
                        value={selectedNode.data.notes || ''} 
                        onChange={(e) => updateNodeData(selectedNode.id, 'notes', e.target.value)}
                        placeholder="Add comments, IPs, config notes here..."
                      />
                    </div>
                  </div>
                </Section>

                <Section title="Connections">
                  <div className="flex flex-col gap-2">
                    {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).map(e => {
                      const isSource = e.source === selectedNode.id;
                      const peerId = isSource ? e.target : e.source;
                      const peerNode = nodes.find(n => n.id === peerId);
                      
                      return (
                        <div key={e.id} className="flex flex-col gap-1.5 bg-indigo-50/50 border border-indigo-100 rounded-lg p-2 hover:bg-indigo-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="text-xs font-bold text-indigo-700 truncate" title={peerNode?.data?.label || peerId}>{peerNode?.data?.label || peerId}</span>
                              <span className="text-[9px] font-bold text-indigo-400 bg-white px-1.5 py-0.5 rounded shadow-sm border border-indigo-50 shrink-0">{e.data?.edgeType ? e.data.edgeType.substring(0,4).toUpperCase() : 'LINK'}</span>
                            </div>
                            <button onClick={() => deleteEdge(e.id)} className="p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-500 transition-colors shrink-0" title="Delete Link">
                              <Trash2 size={12} />
                            </button>
                          </div>
                          
                          {/* Editable Link Label */}
                          <input 
                            className="text-[10px] font-medium text-indigo-800 bg-transparent border-b border-indigo-200 focus:border-indigo-500 outline-none w-full px-1 py-0.5"
                            value={e.label || ''}
                            onChange={(evt) => updateEdgeData(e.id, 'label', evt.target.value)}
                            placeholder="Type a link label (e.g. SFP1, eth0)..."
                          />
                        </div>
                      );
                    })}
                    {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length === 0 && (
                      <span className="text-xs text-slate-400 italic px-2">No active connections.</span>
                    )}
                  </div>
                </Section>

                <div className="pt-4 border-t border-slate-100 flex justify-center">
                  <button onClick={() => deleteNode(selectedNode.id)} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-xl font-bold text-xs transition-colors w-full justify-center">
                    <Trash2 size={14} /> Remove Device
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <StatisticsBar nodes={nodes} edges={edges} />
      </div>

      {/* Local Account Modal Overlay */}
      {showLogin && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-300">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                <User size={32} className="text-white" />
              </div>
              <h2 className="text-xl font-extrabold text-white">Select Workspace</h2>
              <p className="text-blue-100 text-xs mt-1">Enter an account name to load or create a workspace.</p>
            </div>
            <form 
              className="p-6 flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                const user = usernameInput.trim();
                if (!user) return;
                setCurrentUser(user);
                localStorage.setItem('topology-active-user', user);
                setShowLogin(false);
                setUsernameInput('');
              }}
            >
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Account Name</label>
                <input 
                  type="text" 
                  required
                  autoFocus
                  placeholder="e.g. Admin, User1, Sandbox..."
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 ring-blue-500/10 transition-all"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all mt-2">
                Open Workspace
              </button>
              
              {currentUser && (
                <button type="button" onClick={() => setShowLogin(false)} className="w-full text-slate-500 hover:text-slate-700 text-xs font-bold py-2">
                  Cancel
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#f8fafc]">
      <ReactFlowProvider>
        <FlowCanvas />
      </ReactFlowProvider>
    </div>
  );
}
