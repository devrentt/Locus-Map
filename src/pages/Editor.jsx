import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Editor() {
  const navigate = useNavigate();
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  const [nodes, setNodes] = useState({});
  const [edges, setEdges] = useState([]);
  const [mode, setMode] = useState('add_node'); // 'add_node', 'add_edge', 'edit_node'
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeCounter, setNodeCounter] = useState(1);
  const [bgImage, setBgImage] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const generatedJson = JSON.stringify({ nodes, edges, rooms: [] }, null, 2);

  const handleSvgClick = (e) => {
    if (mode !== 'add_node') return;
    if (e.target.tagName === 'circle') return;

    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursorPt = pt.matrixTransform(svg.getScreenCTM().inverse());

    const id = `n${nodeCounter}`;
    setNodes({ ...nodes, [id]: { x: Math.round(cursorPt.x), y: Math.round(cursorPt.y) } });
    setNodeCounter(prev => prev + 1);
  };

  const handleNodeClick = (id, e) => {
    e.stopPropagation();
    if (mode === 'add_edge') {
      if (!selectedNode) {
        setSelectedNode(id);
      } else {
        if (selectedNode !== id) {
          const exists = edges.some(edge =>
            (edge[0] === selectedNode && edge[1] === id) ||
            (edge[0] === id && edge[1] === selectedNode)
          );
          if (!exists) setEdges([...edges, [selectedNode, id]]);
        }
        setSelectedNode(null);
      }
    } else if (mode === 'edit_node') {
      setSelectedNode(id);
    }
  };

  const handleUpdateLabel = (e) => {
    if (!selectedNode) return;
    const val = e.target.value;
    setNodes({
      ...nodes,
      [selectedNode]: { ...nodes[selectedNode], label: val === '' ? undefined : val }
    });
  };

  const handleDeleteNode = () => {
    if (!selectedNode) return;
    const newNodes = { ...nodes };
    delete newNodes[selectedNode];
    setNodes(newNodes);
    setEdges(edges.filter(e => e[0] !== selectedNode && e[1] !== selectedNode));
    setSelectedNode(null);
  };

  const undo = () => {
    if (mode === 'add_node') {
      const keys = Object.keys(nodes);
      if (!keys.length) return;
      const newNodes = { ...nodes };
      delete newNodes[keys[keys.length - 1]];
      setNodes(newNodes);
    } else if (mode === 'add_edge') {
      if (edges.length) setEdges(edges.slice(0, -1));
    }
  };

  const modeBtn = (m, label) => (
    <button
      onClick={() => { setMode(m); setSelectedNode(null); }}
      style={{
        flex: 1,
        padding: '10px 6px',
        fontSize: '13px',
        borderRadius: '10px',
        backgroundColor: mode === m ? 'var(--accent)' : '#2a2a2a',
        border: mode === m ? 'none' : '1px solid #444',
        color: '#fff',
        fontWeight: mode === m ? 700 : 400,
        transition: 'all 0.2s',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      backgroundColor: '#121212',
      zIndex: 9999,
      overflow: 'hidden',
    }}>

      {/* ── Sidebar / Controls ── */}
      <div style={{
        width: isMobile ? '100%' : '300px',
        minWidth: isMobile ? 'unset' : '300px',
        height: isMobile ? 'auto' : '100%',
        maxHeight: isMobile ? '45vh' : 'unset',
        backgroundColor: '#1a1a1a',
        borderRight: isMobile ? 'none' : '1px solid #2a2a2a',
        borderBottom: isMobile ? '1px solid #2a2a2a' : 'none',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        flexShrink: 0,
      }}>
        {/* Sidebar header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #2a2a2a',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 0,
        }}>
          <button
            className="secondary"
            onClick={() => navigate(-1)}
            style={{ padding: '8px 14px', fontSize: '13px', flexShrink: 0 }}
          >
            ← Back
          </button>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Map Editor</h2>
        </div>

        {/* Sidebar body */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>

          {/* BG image */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Background Image URL
            </label>
            <input
              type="text"
              placeholder="/balimed.png"
              value={bgImage}
              onChange={e => setBgImage(e.target.value)}
              style={{ borderRadius: '8px', padding: '10px 14px', fontSize: '13px' }}
            />
          </div>

          {/* Mode buttons */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Mode
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {modeBtn('add_node', '+ Node')}
              {modeBtn('add_edge', '+ Edge')}
              {modeBtn('edit_node', 'Edit')}
            </div>
          </div>

          {/* Status */}
          <div style={{
            background: '#0d0d0d',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
            color: '#aaa',
            border: '1px solid #2a2a2a',
          }}>
            {mode === 'add_node' && '🖱 Click on the canvas to add a node'}
            {mode === 'add_edge' && (selectedNode
              ? `🔗 Now click a second node to connect to "${selectedNode}"`
              : '🔗 Click a node to start an edge')}
            {mode === 'edit_node' && (selectedNode
              ? `✏️ Editing node: ${selectedNode}`
              : '✏️ Click a node to select it')}
          </div>

          {/* Edit node panel */}
          {mode === 'edit_node' && selectedNode && (
            <div style={{
              background: '#111',
              border: '1px solid #333',
              borderRadius: '10px',
              padding: '14px',
            }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: '#ccc' }}>
                Node: <code style={{ color: 'var(--accent)' }}>{selectedNode}</code>
              </div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#999' }}>Label</label>
              <input
                type="text"
                placeholder="e.g. Lobi Utama"
                value={nodes[selectedNode]?.label || ''}
                onChange={handleUpdateLabel}
                style={{ borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '10px' }}
              />
              <button
                onClick={handleDeleteNode}
                style={{
                  backgroundColor: '#c0392b', width: '100%',
                  borderRadius: '8px', padding: '10px', fontSize: '13px',
                }}
              >
                🗑 Delete Node
              </button>
            </div>
          )}

          {/* Undo */}
          <button
            className="secondary"
            onClick={undo}
            style={{ width: '100%', borderRadius: '8px', padding: '10px', fontSize: '13px' }}
          >
            ↩ Undo Last {mode === 'add_node' ? 'Node' : 'Edge'}
          </button>

          {/* Stats */}
          <div style={{ fontSize: '12px', color: '#666', display: 'flex', gap: '16px' }}>
            <span>Nodes: <strong style={{ color: '#fff' }}>{Object.keys(nodes).length}</strong></span>
            <span>Edges: <strong style={{ color: '#fff' }}>{edges.length}</strong></span>
          </div>

          {/* JSON output */}
          <div style={{ marginTop: 'auto' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Generated JSON
            </label>
            <p style={{ fontSize: '11px', color: '#555', marginBottom: '6px' }}>
              Copy → paste into <code>hospitals.json</code>
            </p>
            <textarea
              readOnly
              value={generatedJson}
              style={{
                width: '100%',
                height: '110px',
                backgroundColor: '#0d0d0d',
                color: '#4CAF50',
                padding: '10px',
                fontFamily: 'monospace',
                fontSize: '11px',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                resize: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Canvas Area ── */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'auto',
          backgroundColor: '#0d0d0d',
          // Grid background so the canvas is visible even without an image
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          minHeight: isMobile ? '55vh' : 'unset',
        }}
      >
        {/* Canvas label */}
        <div style={{
          position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.6)', color: '#555', fontSize: '12px',
          padding: '4px 12px', borderRadius: '20px', pointerEvents: 'none', zIndex: 10,
          whiteSpace: 'nowrap',
        }}>
          {mode === 'add_node' ? 'Click anywhere to place a node' :
           mode === 'add_edge' ? 'Click two nodes to connect them' :
           'Select a node to edit or delete'}
        </div>

        <svg
          ref={svgRef}
          onClick={handleSvgClick}
          viewBox="0 0 1000 1000"
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            minWidth: '600px',
            minHeight: isMobile ? '55vh' : '100%',
            cursor: mode === 'add_node' ? 'crosshair' : 'default',
          }}
        >
          {bgImage && (
            <image href={bgImage} x="0" y="0" width="1000" height="1000"
              preserveAspectRatio="xMidYMid meet" opacity="0.6" />
          )}

          {/* Edges */}
          {edges.map((e, i) => {
            const n1 = nodes[e[0]];
            const n2 = nodes[e[1]];
            if (!n1 || !n2) return null;
            return (
              <line key={i}
                x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
                stroke="#4A90E2" strokeWidth="2.5" strokeLinecap="round"
              />
            );
          })}

          {/* Nodes */}
          {Object.entries(nodes).map(([id, n]) => (
            <g key={id} transform={`translate(${n.x}, ${n.y})`}
              onClick={e => handleNodeClick(id, e)}
              style={{ cursor: 'pointer' }}
            >
              {/* Outer glow ring for selected */}
              {selectedNode === id && (
                <circle r="14" fill="rgba(245,166,35,0.2)" />
              )}
              <circle
                r={selectedNode === id ? 9 : 7}
                fill={selectedNode === id ? '#F5A623' : '#4A90E2'}
                stroke={selectedNode === id ? '#fff' : '#1a1a1a'}
                strokeWidth="2"
              />
              {n.label && (
                <text y="-14" fill="#fff" fontSize="13" textAnchor="middle"
                  style={{ pointerEvents: 'none', fontFamily: 'sans-serif', fontWeight: 600 }}>
                  {n.label}
                </text>
              )}
              <text y="4" fill={selectedNode === id ? '#1a1a1a' : '#fff'}
                fontSize="8" textAnchor="middle"
                style={{ pointerEvents: 'none', fontFamily: 'monospace' }}>
                {id}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

export default Editor;
