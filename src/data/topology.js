// ═══════════════════════════════════════════════════════════════
// topology.js — Enterprise Network Topology (React Flow data)
// ═══════════════════════════════════════════════════════════════

// ── VLAN Colors ─────────────────────────────────────────────
export const VLAN_COLORS = {
  greenData:  { label: 'Green Data',      color: '#22c55e' },
  wireless:   { label: 'Wireless',        color: '#3b82f6' },
  printers:   { label: 'Printers',        color: '#f97316' },
  hydra:      { label: 'Hydra',           color: '#7c3aed' },
  enfco:      { label: 'ENFCO',           color: '#f59e0b' },
  production: { label: 'Production Dept', color: '#ef4444' },
  management: { label: 'Mgmt / P2P',     color: '#6b7280' },
};

// ── Edge Styles ─────────────────────────────────────────────
export const EDGE_STYLES = {
  backbone:  { stroke: '#3b82f6', strokeWidth: 3,   dash: null,    animated: false, label: 'Backbone 10G/25G' },
  redundant: { stroke: '#3b82f6', strokeWidth: 2,   dash: '8 4',   animated: true,  label: 'Redundant SFP' },
  dmz:       { stroke: '#ef4444', strokeWidth: 2,   dash: '6 3',   animated: false, label: 'DMZ Segment' },
  access:    { stroke: '#9ca3af', strokeWidth: 1.5, dash: null,    animated: false, label: 'Access' },
  sdwan:     { stroke: '#f97316', strokeWidth: 2.5, dash: null,    animated: true,  label: 'SD-WAN / ISP' },
  heartbeat: { stroke: '#a855f7', strokeWidth: 2,   dash: '4 4',   animated: true,  label: 'HA Heartbeat' },
  vss:       { stroke: '#06b6d4', strokeWidth: 3,   dash: '10 4',  animated: true,  label: 'VSS 25G' },
  microwave: { stroke: '#eab308', strokeWidth: 2.5, dash: '4 8',   animated: true,  label: 'Microwave / Radio' },
};

// ── Helpers ─────────────────────────────────────────────────
const n = (id, x, y, label, sublabel, nodeType, layer, extra = {}) => ({
  id, type: extra.type || 'default',
  position: { x, y },
  data: { label, sublabel, nodeType, layer, ...extra.data },
  ...(extra.parentId && { parentId: extra.parentId, extent: 'parent' }),
  ...(extra.style && { style: extra.style }),
});

const g = (id, x, y, label, w, h, layer, extra = {}) => ({
  id, type: 'group',
  position: { x, y },
  data: { label, layer, ...extra.data },
  style: { width: w, height: h, borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(148,163,184,0.2)' },
  ...(extra.parentId && { parentId: extra.parentId, extent: 'parent' }),
});

const e = (id, source, target, edgeType, label = '') => ({
  id, source, target, label,
  type: 'smoothstep',
  style: {
    stroke: EDGE_STYLES[edgeType].stroke,
    strokeWidth: EDGE_STYLES[edgeType].strokeWidth,
    ...(EDGE_STYLES[edgeType].dash && { strokeDasharray: EDGE_STYLES[edgeType].dash }),
  },
  animated: EDGE_STYLES[edgeType].animated,
  data: { edgeType },
});

// ═════════════════════════════════════════════════════════════
//  NODES
// ═════════════════════════════════════════════════════════════

export const initialNodes = [
  // ── Drawing Tools ─────────────────────────────────────────
  n('tool-sticky', -500, -500, 'Sticky Note', 'Text Annotation', 'sticky', 'tools', { type: 'sticky' }),
  n('tool-region', -500, -500, 'Drawing Region', 'Resizable Area', 'region', 'tools', { type: 'region' }),

  // ── Layer 0 · Internet ────────────────────────────────────
  n('internet', 900, 0, 'Internet', 'WAN Cloud', 'cloud', 'internet'),

  // ── Layer 1 · ISP ─────────────────────────────────────────
  n('isp-inwi',   300, 180, 'INWI',          '100 Mb/s · FO · SAP · Hydra', 'isp', 'isp'),
  n('isp-orange', 700, 180, 'Orange / FH',   '600 Mb/s · Parabolic',        'isp', 'isp'),
  n('isp-cires',  1100, 180, 'CIRES',          'Fiber Optic',                 'isp', 'isp'),
  n('isp-iam',   1500, 180, 'IAM',           'Router',                      'isp', 'isp'),

  // ── Layer 2 · Firewall / SD-WAN ───────────────────────────
  n('fw-fn1', 600,  400, 'FortiGate FN1', 'Active · SD-WAN',      'firewall', 'firewall'),
  n('fw-fn2', 1200, 400, 'FortiGate FN2', 'Passive · Toubkal HA', 'firewall', 'firewall'),

  // ── Layer 3 · Security ────────────────────────────────────
  n('cp-fw-1', 450,  620, 'Check Point FW', 'Rack 1 · DMZ', 'security', 'security'),
  n('cp-fw-2', 900,  620, 'Check Point FW', 'Rack 2 · DMZ', 'security', 'security'),
  n('cp-fw-3', 1350, 620, 'Check Point FW', 'Rack 2 · DMZ', 'security', 'security'),

  // ── Layer 4 · Core ────────────────────────────────────────
  n('core-sw1', 600,  850, 'Core SW1', 'C9500-48Y4C · Active',  'core', 'core'),
  n('core-sw2', 1200, 850, 'Core SW2', 'C9500-48Y4C · Passive', 'core', 'core'),

  // ── Layer 5 · Aggregation ─────────────────────────────────
  n('agg-sw', 900, 1060, 'Aggregation SW', 'C9500-16X · Rack 2', 'aggregation', 'aggregation'),

  // ── Layer 6 · DMZ Zone (group) ────────────────────────────
  g('dmz-zone', 500, 1260, 'DMZ Zone', 820, 170, 'dmz'),
  n('dmz-netapp-1',    30,  40, 'NetApp',         'Hydra',         'storage',  'dmz', { parentId: 'dmz-zone' }),
  n('dmz-netapp-2',   230,  40, 'NetApp',         'General',       'storage',  'dmz', { parentId: 'dmz-zone' }),
  n('dmz-backup-qt',  430,  40, 'Backup Server',  'Quantum Tape',  'server',   'dmz', { parentId: 'dmz-zone' }),
  n('dmz-backup-ucs', 630,  40, 'Backup Server',  'Cisco UCS',     'server',   'dmz', { parentId: 'dmz-zone' }),

  // ── Layer 7 · Monitoring / Wireless ───────────────────────
  n('aruba-wlc',     250,  1480, 'Aruba WLC',      '7030 ×2 · Rack 1,2', 'wireless',   'monitoring'),
  n('solarwinds',   1500,  1480, 'SolarWinds NMS',  'SNMP',               'monitoring', 'monitoring'),

  // ── Layer 8 · Floor 1 (group) ─────────────────────────────
  g('floor1', 50, 1650, 'Floor 1', 1820, 380, 'floor1'),
  n('f1-sw-a',       30,  45, 'Access SW-A',       '48p · Stacked · Rack B', 'switch',   'floor1', { parentId: 'floor1' }),
  n('f1-sw-b',      330,  45, 'Access SW-B',       '48p · Stacked · Rack C', 'switch',   'floor1', { parentId: 'floor1' }),
  n('f1-bdcom',     630,  45, 'BDCOM PoE SW',      'Surveillance',           'switch',   'floor1', { parentId: 'floor1' }),
  n('f1-pcs',        30, 200, 'Production PCs',    'VLAN: Production',       'endpoint',  'floor1', { parentId: 'floor1', data: { vlan: 'production' } }),
  n('f1-industrial', 230, 200, 'Industrial Machines','VLAN: Production',     'endpoint',  'floor1', { parentId: 'floor1', data: { vlan: 'production' } }),
  n('f1-plc',       430, 200, 'PLC Controllers',   'VLAN: Production',       'endpoint',  'floor1', { parentId: 'floor1', data: { vlan: 'production' } }),
  n('f1-barcode',   630, 200, 'Barcode Scanners',  'VLAN: ENFCO',            'endpoint',  'floor1', { parentId: 'floor1', data: { vlan: 'enfco' } }),
  n('f1-printers',  830, 200, 'Printers',          'VLAN: Printers',         'endpoint',  'floor1', { parentId: 'floor1', data: { vlan: 'printers' } }),
  n('f1-cameras',  1030, 200, 'IP Cameras',        'Hikvision NVR',          'camera',    'floor1', { parentId: 'floor1' }),
  n('f1-aps',      1230, 200, 'APs',               'Aruba · PoE',            'ap',        'floor1', { parentId: 'floor1', data: { vlan: 'wireless' } }),

  // ── Layer 9 · Server Room (group + 3 racks) ───────────────
  g('server-room', 20, 2120, 'Server Room', 1880, 780, 'serverRoom'),

  // Rack 1
  g('rack1', 20, 40, 'Rack 1', 580, 700, 'serverRoom', { parentId: 'server-room' }),
  n('r1-core-sw1',   20,  40, 'Core SW1',         'C9500-48Y4C',     'core',     'rack1', { parentId: 'rack1' }),
  n('r1-cp-fw',     200,  40, 'Check Point FW',   '×1',              'security', 'rack1', { parentId: 'rack1' }),
  n('r1-fg-fn1',    380,  40, 'FortiGate FN1',    'Active',          'firewall', 'rack1', { parentId: 'rack1' }),
  n('r1-wlc',        20, 180, 'Aruba WLC',        '7030',            'wireless', 'rack1', { parentId: 'rack1' }),
  n('r1-iam',       200, 180, 'IAM Router',       '',                'isp',      'rack1', { parentId: 'rack1' }),
  n('r1-ucs',       380, 180, 'Cisco UCS',        '×4',              'server',   'rack1', { parentId: 'rack1' }),
  n('r1-quantum',    20, 320, 'Quantum Scalar i3','Tape Library',    'storage',  'rack1', { parentId: 'rack1' }),
  n('r1-ont-odf',   250, 320, 'ISP ONT / ODF',   'Fiber',           'isp',      'rack1', { parentId: 'rack1' }),

  // Rack 2
  g('rack2', 640, 40, 'Rack 2', 580, 700, 'serverRoom', { parentId: 'server-room' }),
  n('r2-core-sw2',   20,  40, 'Core SW2',         'C9500-48Y4C',     'core',     'rack2', { parentId: 'rack2' }),
  n('r2-agg-sw',    200,  40, 'Aggregation SW',   'C9500-16X',       'aggregation','rack2',{ parentId: 'rack2' }),
  n('r2-access-sw', 380,  40, '48p Access SW',    'Stacked',         'switch',   'rack2', { parentId: 'rack2' }),
  n('r2-cp-fw',      20, 180, 'Check Point FW',   '×2',              'security', 'rack2', { parentId: 'rack2' }),
  n('r2-wlc',       200, 180, 'Aruba WLC',        '7030',            'wireless', 'rack2', { parentId: 'rack2' }),
  n('r2-bdcom',     380, 180, 'BDCOM PoE',        'Surveillance',    'switch',   'rack2', { parentId: 'rack2' }),
  n('r2-huawei',     20, 320, 'Huawei ONT',       '',                'isp',      'rack2', { parentId: 'rack2' }),
  n('r2-fg-fn2',    200, 320, 'FortiGate FN2',    'Passive',         'firewall', 'rack2', { parentId: 'rack2' }),
  n('r2-uac-nac',   380, 320, 'UAC / NAC',        '',                'security', 'rack2', { parentId: 'rack2' }),

  // Rack 3
  g('rack3', 1260, 40, 'Rack 3', 580, 700, 'serverRoom', { parentId: 'server-room' }),
  n('r3-netapp',      20,  40, 'NetApp 2U',        'Storage',         'storage',  'rack3', { parentId: 'rack3' }),
  n('r3-access-sw1', 200,  40, '48p Access SW',    '×1',              'switch',   'rack3', { parentId: 'rack3' }),
  n('r3-access-sw2', 380,  40, '48p Access SW',    '×2',              'switch',   'rack3', { parentId: 'rack3' }),
  n('r3-dell',        20, 180, 'Dell OptiPlex',    '',                'endpoint', 'rack3', { parentId: 'rack3' }),
  n('r3-nvr1',       200, 180, 'Hikvision NVR',    '×1',              'camera',   'rack3', { parentId: 'rack3' }),
  n('r3-nvr2',       380, 180, 'Hikvision NVR',    '×2',              'camera',   'rack3', { parentId: 'rack3' }),
  n('r3-patch',       20, 320, 'Patch Panels',     'A – E',           'infra',    'rack3', { parentId: 'rack3' }),
  n('r3-odf',        200, 320, 'ODF Fiber',        '',                'infra',    'rack3', { parentId: 'rack3' }),
  n('r3-cable',      380, 320, 'Cable Mgmt',       '',                'infra',    'rack3', { parentId: 'rack3' }),

  // ── Layer 10 · Floor 2 (group) ────────────────────────────
  g('floor2', 150, 3000, 'Floor 2', 1100, 300, 'floor2'),
  n('f2-sw',          30,  45, 'Access SW-F2',  '48p',             'switch',   'floor2', { parentId: 'floor2' }),
  n('f2-aps',        250,  45, 'APs',           '×3 · Aruba PoE', 'ap',       'floor2', { parentId: 'floor2', data: { vlan: 'wireless' } }),
  n('f2-workstations',470, 45, 'Workstations',  '',                'endpoint', 'floor2', { parentId: 'floor2' }),
  n('f2-printers',   690,  45, 'Printers',      'VLAN: Printers',  'endpoint', 'floor2', { parentId: 'floor2', data: { vlan: 'printers' } }),
  n('f2-uac-nac',    910,  45, 'UAC / NAC',     '',                'security', 'floor2', { parentId: 'floor2' }),

  // ── Layer 11 · Floor 3 (group) ────────────────────────────
  g('floor3', 50, 3400, 'Floor 3', 1820, 620, 'floor3'),
  n('f3-sw',          30,  45, 'Access SW-F3',   '48p · Conf Room Rack', 'switch',   'floor3', { parentId: 'floor3' }),
  n('f3-aps',        280,  45, 'APs',            '×4 · Aruba · PoE',    'ap',       'floor3', { parentId: 'floor3', data: { vlan: 'wireless' } }),
  n('f3-managers',   530,  45, 'Manager Desks',  'VLAN: Mgmt',          'endpoint', 'floor3', { parentId: 'floor3', data: { vlan: 'management' } }),
  n('f3-openspace',  780,  45, 'Open Space WS',  'VLAN: Green Data',    'endpoint', 'floor3', { parentId: 'floor3', data: { vlan: 'greenData' } }),
  n('f3-printers',  1030,  45, 'Printers',       'VLAN: Printers',      'endpoint', 'floor3', { parentId: 'floor3', data: { vlan: 'printers' } }),

  // Conference AV Rack (sub-group in Floor 3)
  g('conf-av', 30, 180, 'Conference AV Rack', 1760, 400, 'floor3', { parentId: 'floor3' }),
  n('f3-novastar',    30,  45, 'NovaStar VX600',    'LED Controller',   'av', 'floor3', { parentId: 'conf-av' }),
  n('f3-xilica',     240,  45, 'Xilica Solaro FR1', 'Audio DSP',        'av', 'floor3', { parentId: 'conf-av' }),
  n('f3-barco',      450,  45, 'Barco ClickShare',  'Wireless Present', 'av', 'floor3', { parentId: 'conf-av' }),
  n('f3-sennheiser', 660,  45, 'Sennheiser TCC2',   'Ceiling Mic',      'av', 'floor3', { parentId: 'conf-av' }),
  n('f3-yealink',    870,  45, 'Yealink Mic',       'Conf Mic',         'av', 'floor3', { parentId: 'conf-av' }),
  n('f3-led-wall',  1080,  45, 'LED Video Wall',    '',                 'av', 'floor3', { parentId: 'conf-av' }),
  n('f3-ptz',       1290,  45, 'PTZ Camera',        '',                 'camera', 'floor3', { parentId: 'conf-av' }),
  n('f3-presenter', 1500,  45, 'Presenter Desk',    '',                 'av', 'floor3', { parentId: 'conf-av' }),
];

// ═════════════════════════════════════════════════════════════
//  EDGES
// ═════════════════════════════════════════════════════════════

export const initialEdges = [

  // ── Internet → ISPs (SD-WAN / ISP links — orange) ────────
  e('e-inet-inwi',   'internet', 'isp-inwi',   'sdwan'),
  e('e-inet-orange', 'internet', 'isp-orange', 'sdwan'),
  e('e-inet-cires',   'internet', 'isp-cires',   'sdwan'),
  e('e-inet-iam',    'internet', 'isp-iam',    'sdwan'),

  // ── ISPs → Firewalls (SD-WAN — orange) ────────────────────
  e('e-inwi-fn1',   'isp-inwi',   'fw-fn1', 'sdwan', '100 Mb/s'),
  e('e-orange-fn1', 'isp-orange', 'fw-fn1', 'sdwan', '600 Mb/s'),
  e('e-cires-fn2',   'isp-cires',   'fw-fn2', 'sdwan', 'FO'),
  e('e-iam-fn2',    'isp-iam',    'fw-fn2', 'sdwan'),

  // ── HA Heartbeat between FortiGates ───────────────────────
  e('e-ha-heartbeat', 'fw-fn1', 'fw-fn2', 'heartbeat', 'HA Heartbeat'),

  // ── Firewalls → Check Point (DMZ — dashed red) ────────────
  e('e-fn1-cp1', 'fw-fn1', 'cp-fw-1', 'dmz'),
  e('e-fn1-cp2', 'fw-fn1', 'cp-fw-2', 'dmz'),
  e('e-fn2-cp3', 'fw-fn2', 'cp-fw-3', 'dmz'),

  // ── Check Point → Core (backbone — solid blue thick) ──────
  e('e-cp1-core1', 'cp-fw-1', 'core-sw1', 'backbone', '10G'),
  e('e-cp2-core1', 'cp-fw-2', 'core-sw1', 'backbone', '10G'),
  e('e-cp3-core2', 'cp-fw-3', 'core-sw2', 'backbone', '10G'),

  // ── Core VSS link (dashed blue — redundant 25G) ───────────
  e('e-core-vss', 'core-sw1', 'core-sw2', 'vss', 'VSS 25G'),

  // ── Core → Aggregation (backbone) ─────────────────────────
  e('e-core1-agg', 'core-sw1', 'agg-sw', 'backbone', '10G'),
  e('e-core2-agg', 'core-sw2', 'agg-sw', 'redundant'),

  // ── Core / Agg → DMZ zone (DMZ segment) ───────────────────
  e('e-agg-dmz-n1',  'agg-sw', 'dmz-netapp-1',   'dmz'),
  e('e-agg-dmz-n2',  'agg-sw', 'dmz-netapp-2',   'dmz'),
  e('e-agg-dmz-bq',  'agg-sw', 'dmz-backup-qt',  'dmz'),
  e('e-agg-dmz-bu',  'agg-sw', 'dmz-backup-ucs', 'dmz'),

  // ── Core → Monitoring / Wireless ──────────────────────────
  e('e-core1-wlc',  'core-sw1',  'aruba-wlc',  'backbone'),
  e('e-core2-nms',  'core-sw2',  'solarwinds', 'access', 'SNMP'),

  // ── Aggregation → Floor 1 switches (backbone) ─────────────
  e('e-agg-f1swa',  'agg-sw', 'f1-sw-a',  'backbone', '10G'),
  e('e-agg-f1swb',  'agg-sw', 'f1-sw-b',  'backbone', '10G'),
  e('e-agg-f1bdc',  'agg-sw', 'f1-bdcom', 'backbone'),

  // ── Floor 1 Access → End Devices (grey access) ────────────
  e('e-f1a-pcs',       'f1-sw-a',  'f1-pcs',        'access'),
  e('e-f1a-indust',    'f1-sw-a',  'f1-industrial',  'access'),
  e('e-f1a-plc',       'f1-sw-a',  'f1-plc',         'access'),
  e('e-f1b-barcode',   'f1-sw-b',  'f1-barcode',     'access'),
  e('e-f1b-printers',  'f1-sw-b',  'f1-printers',    'access'),
  e('e-f1bdc-cam',     'f1-bdcom', 'f1-cameras',     'access'),
  e('e-wlc-f1aps',     'aruba-wlc','f1-aps',         'access', 'PoE'),

  // ── Aggregation → Floor 2 (backbone) ──────────────────────
  e('e-agg-f2sw', 'agg-sw', 'f2-sw', 'backbone'),

  // ── Floor 2 Access → End Devices ──────────────────────────
  e('e-f2-aps',    'f2-sw', 'f2-aps',          'access'),
  e('e-f2-ws',     'f2-sw', 'f2-workstations', 'access'),
  e('e-f2-pr',     'f2-sw', 'f2-printers',     'access'),
  e('e-f2-uac',    'f2-sw', 'f2-uac-nac',      'access'),
  e('e-wlc-f2aps', 'aruba-wlc', 'f2-aps',     'access', 'PoE'),

  // ── Aggregation → Floor 3 (backbone) ──────────────────────
  e('e-agg-f3sw', 'agg-sw', 'f3-sw', 'backbone'),

  // ── Floor 3 Access → End Devices ──────────────────────────
  e('e-f3-aps',      'f3-sw', 'f3-aps',       'access'),
  e('e-f3-mgr',      'f3-sw', 'f3-managers',  'access'),
  e('e-f3-open',     'f3-sw', 'f3-openspace', 'access'),
  e('e-f3-pr',       'f3-sw', 'f3-printers',  'access'),
  e('e-wlc-f3aps',   'aruba-wlc', 'f3-aps',  'access', 'PoE'),

  // ── Floor 3 → Conference AV Rack ─────────────────────────
  e('e-f3sw-nova',   'f3-sw', 'f3-novastar',   'access'),
  e('e-f3sw-xilica', 'f3-sw', 'f3-xilica',     'access'),
  e('e-f3sw-barco',  'f3-sw', 'f3-barco',      'access'),
  e('e-f3sw-senn',   'f3-sw', 'f3-sennheiser', 'access'),
  e('e-f3sw-yea',    'f3-sw', 'f3-yealink',    'access'),
  e('e-f3sw-led',    'f3-sw', 'f3-led-wall',   'access'),
  e('e-f3sw-ptz',    'f3-sw', 'f3-ptz',        'access'),
  e('e-f3sw-desk',   'f3-sw', 'f3-presenter',  'access'),

  // ── Cross-link redundant paths (dashed blue) ──────────────
  e('e-fn1-core2-x', 'fw-fn1',   'core-sw2', 'redundant', 'Cross SFP'),
  e('e-fn2-core1-x', 'fw-fn2',   'core-sw1', 'redundant', 'Cross SFP'),
  e('e-cp2-core2-x', 'cp-fw-2',  'core-sw2', 'redundant'),
];

// ═════════════════════════════════════════════════════════════
//  DEFAULT EXPORT
// ═════════════════════════════════════════════════════════════

export default {
  initialNodes,
  initialEdges,
  VLAN_COLORS,
  EDGE_STYLES,
};
