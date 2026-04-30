export const confNodes = [
  { id: 'cr-bg', type: 'group', position: { x: 50, y: 50 }, style: { width: 800, height: 600, border: '2px dashed #cbd5e1', backgroundColor: '#f8fafc', borderRadius: 20 }, data: { label: 'Conference Room AV Diagram', layer: 'floor3' } },
  { id: 'cr-poe-sw', type: 'switch', position: { x: 400, y: 100 }, data: { label: 'PoE Switch', sublabel: 'Uplink to F3-SW', nodeType: 'switch', layer: 'network' } },
  { id: 'cr-patch', type: 'infra', position: { x: 600, y: 100 }, data: { label: 'Patch Panel', sublabel: 'AV Rack', nodeType: 'infra' } },
  
  { id: 'cr-xilica', type: 'av', position: { x: 400, y: 300 }, data: { label: 'Xilica Solaro FR1', sublabel: 'Audio DSP', nodeType: 'av', layer: 'audio' } },
  { id: 'cr-novastar', type: 'av', position: { x: 150, y: 300 }, data: { label: 'NovaStar VX600', sublabel: 'LED Controller', nodeType: 'av', layer: 'video' } },
  { id: 'cr-barco', type: 'av', position: { x: 650, y: 300 }, data: { label: 'Barco ClickShare', sublabel: 'Wireless Present', nodeType: 'av' } },
  
  { id: 'cr-tcc2', type: 'camera', position: { x: 400, y: 500 }, data: { label: 'Sennheiser TCC2', sublabel: 'Ceiling Mic', nodeType: 'av', layer: 'audio' } },
  { id: 'cr-yealink', type: 'av', position: { x: 400, y: 600 }, data: { label: 'Yealink Soundbar', sublabel: 'Output', nodeType: 'av', layer: 'audio' } },
  { id: 'cr-ptz', type: 'camera', position: { x: 150, y: 500 }, data: { label: 'PTZ Camera', sublabel: 'Video Input', nodeType: 'av', layer: 'video' } },
  { id: 'cr-led', type: 'av', position: { x: 150, y: 600 }, data: { label: 'LED Video Wall', sublabel: 'Screen', nodeType: 'av', layer: 'video' } },
  { id: 'cr-ap', type: 'ap', position: { x: 750, y: 200 }, data: { label: 'Aruba AP', sublabel: 'Wireless', nodeType: 'ap' } },
];

export const confEdges = [
  { id: 'cre-sw-xilica', source: 'cr-poe-sw', target: 'cr-xilica', data: { edgeType: 'access' } },
  { id: 'cre-sw-novastar', source: 'cr-poe-sw', target: 'cr-novastar', data: { edgeType: 'access' } },
  { id: 'cre-sw-barco', source: 'cr-poe-sw', target: 'cr-barco', data: { edgeType: 'access' } },
  { id: 'cre-sw-ap', source: 'cr-poe-sw', target: 'cr-ap', data: { edgeType: 'access' }, label: 'PoE' },
  { id: 'cre-sw-patch', source: 'cr-poe-sw', target: 'cr-patch', data: { edgeType: 'access' } },
  
  { id: 'cre-tcc2-xilica', source: 'cr-tcc2', target: 'cr-xilica', animated: true, data: { edgeType: 'backbone' }, style: { stroke: '#22c55e' }, label: 'Dante Audio' },
  { id: 'cre-xilica-yealink', source: 'cr-xilica', target: 'cr-yealink', animated: true, data: { edgeType: 'backbone' }, style: { stroke: '#22c55e' }, label: 'Analog Out' },
  
  { id: 'cre-ptz-novastar', source: 'cr-ptz', target: 'cr-novastar', animated: true, data: { edgeType: 'backbone' }, style: { stroke: '#3b82f6' }, label: 'SDI' },
  { id: 'cre-novastar-led', source: 'cr-novastar', target: 'cr-led', animated: true, data: { edgeType: 'backbone' }, style: { stroke: '#3b82f6' }, label: 'LED Data' },
];
