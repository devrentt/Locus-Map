import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import hospitals from '../data/hospitals.json';
import { buildGraph, dijkstra, buildSteps } from '../utils/geometry';

function NodeSearch({ label, nodes, value, onChange }) {
  const selectedLabel = value ? nodes.find(([key]) => key === value)?.[1].label || '' : '';
  const [query, setQuery] = useState(selectedLabel);
  const [isOpen, setIsOpen] = useState(false);

  const filteredNodes = nodes.filter(([, node]) =>
    node.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleChange = (event) => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);
    setIsOpen(true);

    const selected = nodes.find(([, node]) => node.label.toLowerCase() === nextQuery.trim().toLowerCase());
    onChange(selected ? selected[0] : '');
  };

  const handleSelect = (key, nodeLabel) => {
    setQuery(nodeLabel);
    setIsOpen(false);
    onChange(key);
  };

  return (
    <div className="node-search">
      <label htmlFor={`${label}-search`}>{label}</label>
      <input
        id={`${label}-search`}
        type="search"
        value={query}
        placeholder={`Cari ${label.toLowerCase()}...`}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
        autoComplete="off"
      />
      {isOpen && (
        <div className="node-search-options">
          {filteredNodes.length > 0 ? filteredNodes.map(([key, node]) => (
            <button
              type="button"
              className="node-search-option"
              key={key}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleSelect(key, node.label)}
            >
              {node.label}
            </button>
          )) : (
            <div className="node-search-empty">Lokasi tidak ditemukan</div>
          )}
        </div>
      )}
    </div>
  );
}

function VenueMap() {
  const { id } = useParams();
  const navigate = useNavigate();
  const venue = hospitals[id];
  
  const [startNode, setStartNode] = useState('');
  const [endNode, setEndNode] = useState('');
  const [route, setRoute] = useState([]);
  const [steps, setSteps] = useState([]);
  const [mapViewBox, setMapViewBox] = useState('0 0 1000 1000');
  const mapRef = useRef(null);
  const dragRef = useRef(null);

  const graph = useMemo(() => {
    if (!venue) return {};
    return buildGraph(venue.graph.nodes, venue.graph.edges);
  }, [venue]);

  useEffect(() => {
    if (startNode && endNode && startNode !== endNode) {
      const path = dijkstra(graph, startNode, endNode);
      setRoute(path);
      setSteps(buildSteps(path, venue.graph.nodes));
    } else {
      setRoute([]);
      setSteps([]);
    }
  }, [startNode, endNode, graph, venue]);

  const routeViewBox = useMemo(() => {
    if (!venue || route.length === 0) return '0 0 1000 1000';

    const routeNodes = route.map(nodeId => venue.graph.nodes[nodeId]).filter(Boolean);
    if (routeNodes.length === 0) return '0 0 1000 1000';

    const minX = Math.min(...routeNodes.map(node => node.x));
    const maxX = Math.max(...routeNodes.map(node => node.x));
    const minY = Math.min(...routeNodes.map(node => node.y));
    const maxY = Math.max(...routeNodes.map(node => node.y));
    const padding = 100;

    return [
      Math.max(0, minX - padding),
      Math.max(0, minY - padding),
      Math.min(1000, maxX - minX + padding * 2),
      Math.min(1000, maxY - minY + padding * 2)
    ].join(' ');
  }, [venue, route]);

  useEffect(() => {
    setMapViewBox(routeViewBox);
  }, [routeViewBox]);

  const updateViewBox = (viewBoxUpdater) => {
    setMapViewBox((currentViewBox) => {
      const current = currentViewBox.split(' ').map(Number);
      const next = viewBoxUpdater(current);
      const [x, y, width, height] = next;
      const boundedX = Math.max(0, Math.min(1000 - width, x));
      const boundedY = Math.max(0, Math.min(1000 - height, y));
      return [boundedX, boundedY, width, height].join(' ');
    });
  };

  const zoomMap = (factor) => {
    updateViewBox(([x, y, width, height]) => {
      const nextWidth = Math.max(100, Math.min(1000, width * factor));
      const nextHeight = Math.max(100, Math.min(1000, height * factor));
      return [
        x + (width - nextWidth) / 2,
        y + (height - nextHeight) / 2,
        nextWidth,
        nextHeight
      ];
    });
  };

  const handleMapWheel = (event) => {
    event.preventDefault();
    zoomMap(event.deltaY > 0 ? 1.15 : 0.87);
  };

  const handleMapPointerDown = (event) => {
    mapRef.current?.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY };
  };

  const handleMapPointerMove = (event) => {
    if (!dragRef.current || !mapRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();
    const { width, height } = mapRef.current.viewBox.baseVal;
    const deltaX = (event.clientX - dragRef.current.x) * width / rect.width;
    const deltaY = (event.clientY - dragRef.current.y) * height / rect.height;
    dragRef.current = { x: event.clientX, y: event.clientY };
    updateViewBox(([x, y, currentWidth, currentHeight]) => [
      x - deltaX * currentWidth / width,
      y - deltaY * currentHeight / height,
      currentWidth,
      currentHeight
    ]);
  };

  const stopMapDragging = (event) => {
    if (dragRef.current) {
      mapRef.current?.releasePointerCapture(event.pointerId);
      dragRef.current = null;
    }
  };

  if (!venue) return <div className="page">Venue not found</div>;

  const { nodes, rooms } = venue.graph;
  const labeledNodes = Object.entries(nodes).filter(([, node]) => node.label);

  return (
    <div className="page" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div className="venue-map-header" style={{ padding: '20px', backgroundColor: 'var(--bg-card)', zIndex: 10 }}>
        <button className="secondary venue-map-back" onClick={() => navigate(-1)} style={{ marginBottom: '16px', padding: '8px 16px' }}>← Back</button>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>{venue.name} Map</h2>
        
        <div className="node-search-row">
          <NodeSearch key={`start-${startNode}`} label="Titik Awal" nodes={labeledNodes} value={startNode} onChange={setStartNode} />
          <NodeSearch key={`end-${endNode}`} label="Tujuan" nodes={labeledNodes} value={endNode} onChange={setEndNode} />
        </div>
        {route.length > 0 && (
          <button
            className="secondary venue-map-reset"
            onClick={() => { setStartNode(''); setEndNode(''); }}
            style={{ marginTop: '12px', padding: '8px 16px' }}
          >
            Lihat Seluruh Denah
          </button>
        )}
      </div>

      <div className="venue-map-canvas" style={{ backgroundColor: '#000', overflow: 'hidden', position: 'relative' }}>
        <svg
          ref={mapRef}
          viewBox={mapViewBox}
          className="venue-map-svg"
          onWheel={handleMapWheel}
          onPointerDown={handleMapPointerDown}
          onPointerMove={handleMapPointerMove}
          onPointerUp={stopMapDragging}
          onPointerCancel={stopMapDragging}
          style={{ width: '100%', height: '100%', display: 'block' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {venue.mapImageUrl && (
            <image href={venue.mapImageUrl} x="0" y="0" width="1000" height="1000" preserveAspectRatio="xMidYMid meet" opacity="0.8" />
          )}
        

          {/* Rooms (Fallback for dummy data) */}
          {rooms?.map((r, i) => (
            <g key={i}>
              <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="#2A2A2A" stroke="#444" strokeWidth="2" rx="4" />
              {r.label && (
                <text x={r.x + r.w/2} y={r.y + r.h/2} fill="#777" fontSize="14" textAnchor="middle" dominantBaseline="middle">
                  {r.label}
                </text>
              )}
            </g>
          ))}

          {/* Note: We hide the grey graph (edges and normal nodes) from the user view so they only see the image and the active route. */}

          {/* Route (Amber polyline) */}
          {route.length > 0 && (
            <polyline 
              points={route.map(n => `${nodes[n]?.x},${nodes[n]?.y}`).join(' ')} 
              fill="none" 
              stroke="var(--route-color)" 
              strokeWidth="6" 
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 4px rgba(245,166,35,0.5))' }}
            />
          )}

          {/* Start and End Pins Only */}
          {startNode && nodes[startNode] && (
            <circle cx={nodes[startNode].x} cy={nodes[startNode].y} r="8" fill="#4CAF50" stroke="#fff" strokeWidth="2" />
          )}
          {endNode && nodes[endNode] && (
            <circle cx={nodes[endNode].x} cy={nodes[endNode].y} r="8" fill="#F44336" stroke="#fff" strokeWidth="2" />
          )}
        </svg>
        <div className="venue-map-controls" aria-label="Kontrol peta">
          <button type="button" onClick={() => zoomMap(0.75)} title="Perbesar peta" aria-label="Perbesar peta">+</button>
          <button type="button" onClick={() => zoomMap(1.33)} title="Perkecil peta" aria-label="Perkecil peta">−</button>
          <button type="button" onClick={() => setMapViewBox(routeViewBox)} title="Sesuaikan peta dengan rute" aria-label="Sesuaikan peta dengan rute">Fit Route</button>
        </div>
      </div>

      {steps.length > 0 && (
        <div className="directions-panel" style={{ padding: '20px', backgroundColor: 'var(--bg-card)', borderTop: '1px solid #333' }}>
          <h3 style={{ marginBottom: '10px' }}>Petunjuk Arah:</h3>
          <ul style={{ listStylePosition: 'inside', color: 'var(--text-secondary)' }}>
            {steps.map((step, i) => (
              <li key={i} style={{ marginBottom: '6px' }}>{step}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default VenueMap;
