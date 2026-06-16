'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getVideoFromIndexedDB, deleteVideoFromIndexedDB } from '../lib/indexeddb';
import { clientLogger } from '@/lib/clientLogger';

interface Annotation {
  id: string;
  type: 'rectangle' | 'circle' | 'arrow' | 'text' | 'highlight';
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  text?: string;
  points?: { x: number; y: number }[];
  brushSize?: number;
  fontSize?: number;
}

interface Workspace {
  id: string;
  name: string;
}

export default function EditorClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const id = searchParams.get('id');

  // Editor states
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [activeTool, setActiveTool] = useState<'rectangle' | 'circle' | 'arrow' | 'text' | 'highlight'>('rectangle');
  const [activeColor, setActiveColor] = useState('#EF4444'); // Default red
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [history, setHistory] = useState<Annotation[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [title, setTitle] = useState('');

  const isPopup = searchParams.get('isPopup') === 'true';
  const [copiedLink, setCopiedLink] = useState<string>('');
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [savingError, setSavingError] = useState<string | null>(null);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const isDrawingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const activeAnnotationRef = useRef<Annotation | null>(null);

  // Load Image and workspaces
  useEffect(() => {
    if (!id) return;

    // Load workspaces
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setWorkspaces(data.workspaces);
          setSelectedWorkspaceId(data.workspaces[0]?.id || '');
        }
      });

    // Load screenshot metadata
    const rawMeta = localStorage.getItem(`jam_meta_${id}`);
    if (rawMeta) {
      try {
        const parsed = JSON.parse(rawMeta);
        setMetadata(parsed);
        setTitle(parsed.title || `Screenshot ${new Date().toLocaleDateString()}`);
      } catch (e) {}
    }

    // Fetch image blob from IndexedDB
    getVideoFromIndexedDB(id).then((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setImageSrc(url);
      }
    });

    return () => {
      if (imageSrc) URL.revokeObjectURL(imageSrc);
    };
  }, [id]);

  // Set up image element once source is loaded
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      imageRef.current = img;
      initCanvas();
    };
  }, [imageSrc]);

  // Redraw canvas whenever annotations list or active changes
  useEffect(() => {
    redraw();
  }, [annotations]);

  // Push new state to history
  const pushToHistory = (newAnnotations: Annotation[]) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(newAnnotations);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const idx = historyIndex - 1;
      setHistoryIndex(idx);
      setAnnotations(history[idx]);
    } else if (historyIndex === 0) {
      setHistoryIndex(-1);
      setAnnotations([]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const idx = historyIndex + 1;
      setHistoryIndex(idx);
      setAnnotations(history[idx]);
    }
  };

  const handleClear = () => {
    if (confirm('Clear all annotations?')) {
      setAnnotations([]);
      pushToHistory([]);
    }
  };

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  // Canvas drawing logic
  const initCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    redraw();
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw base screenshot
    ctx.drawImage(img, 0, 0);

    // Draw all completed annotations
    annotations.forEach((ann) => drawAnnotation(ctx, ann));

    // Draw active drawing shape if exists
    if (activeAnnotationRef.current) {
      drawAnnotation(ctx, activeAnnotationRef.current);
    }
  };

  const drawAnnotation = (ctx: CanvasRenderingContext2D, ann: Annotation) => {
    ctx.strokeStyle = ann.color;
    ctx.fillStyle = 'transparent';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (ann.type === 'rectangle') {
      ctx.strokeRect(ann.x, ann.y, ann.width, ann.height);
    } else if (ann.type === 'circle') {
      ctx.beginPath();
      const radius = Math.max(Math.abs(ann.width), Math.abs(ann.height)) / 2;
      ctx.arc(ann.x + ann.width / 2, ann.y + ann.height / 2, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (ann.type === 'arrow') {
      drawArrow(ctx, ann.startX || 0, ann.startY || 0, ann.endX || 0, ann.endY || 0, ann.color);
    } else if (ann.type === 'text') {
      ctx.font = `bold ${ann.fontSize || 24}px -apple-system, sans-serif`;
      ctx.fillStyle = ann.color;
      ctx.textBaseline = 'top';
      ctx.fillText(ann.text || '', ann.x, ann.y);
    } else if (ann.type === 'highlight') {
      if (ann.points && ann.points.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = ann.color + '55'; // 33% opacity highlight
        ctx.lineWidth = ann.brushSize || 18;
        ann.points.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      }
    }
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string) => {
    const headLength = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    // Draw main line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  };

  // Mouse Handlers for drawing on canvas
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Scale mouse coordinates to match canvas actual dimensions
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (savingState === 'saving') return;
    const pos = getMousePos(e);
    isDrawingRef.current = true;
    startPosRef.current = pos;

    if (activeTool === 'text') {
      const text = prompt('Enter annotation text:');
      if (text) {
        const newAnn: Annotation = {
          id: Math.random().toString(),
          type: 'text',
          color: activeColor,
          x: pos.x,
          y: pos.y,
          width: 100,
          height: 30,
          text,
          fontSize: 24
        };
        const updated = [...annotations, newAnn];
        setAnnotations(updated);
        pushToHistory(updated);
      }
      isDrawingRef.current = false;
    } else if (activeTool === 'highlight') {
      activeAnnotationRef.current = {
        id: Math.random().toString(),
        type: 'highlight',
        color: activeColor,
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        points: [pos],
        brushSize: 18
      };
    } else if (activeTool === 'rectangle' || activeTool === 'circle') {
      activeAnnotationRef.current = {
        id: Math.random().toString(),
        type: activeTool,
        color: activeColor,
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0
      };
    } else if (activeTool === 'arrow') {
      activeAnnotationRef.current = {
        id: Math.random().toString(),
        type: 'arrow',
        color: activeColor,
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        startX: pos.x,
        startY: pos.y,
        endX: pos.x,
        endY: pos.y
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !activeAnnotationRef.current) return;
    const pos = getMousePos(e);

    const startX = startPosRef.current.x;
    const startY = startPosRef.current.y;

    if (activeTool === 'highlight') {
      const pts = activeAnnotationRef.current.points || [];
      activeAnnotationRef.current.points = [...pts, pos];
    } else if (activeTool === 'rectangle' || activeTool === 'circle') {
      activeAnnotationRef.current.x = Math.min(startX, pos.x);
      activeAnnotationRef.current.y = Math.min(startY, pos.y);
      activeAnnotationRef.current.width = Math.abs(startX - pos.x);
      activeAnnotationRef.current.height = Math.abs(startY - pos.y);
    } else if (activeTool === 'arrow') {
      activeAnnotationRef.current.endX = pos.x;
      activeAnnotationRef.current.endY = pos.y;
    }

    redraw();
  };

  const handleMouseUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (activeAnnotationRef.current) {
      const updated = [...annotations, activeAnnotationRef.current];
      setAnnotations(updated);
      pushToHistory(updated);
      activeAnnotationRef.current = null;
    }
    redraw();
  };

  // Flatten canvas and save
  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !id) return;

    setSavingState('saving');
    setSavingError(null);

    try {
      // 1. Convert annotated canvas to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png');
      });

      if (!blob) {
        throw new Error('Failed to flatten image canvas.');
      }

      // 2. Prepare Form Data
      const formData = new FormData();
      formData.append('file', blob, `${id}_annotated.png`);
      formData.append('title', title || 'Annotated Screenshot');
      formData.append('type', 'screenshot');
      formData.append('workspaceId', selectedWorkspaceId);

      // 3. Upload to server
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Server upload failed');
      }

      const uploadResult = await res.json();
      const mediaId = uploadResult.mediaId;

      // 3b. Generate public share link
      const shareRes = await fetch(`/api/media/${mediaId}/share`, {
        method: 'POST'
      });

      let shareLink = '';
      if (shareRes.ok) {
        const shareData = await shareRes.json();
        shareLink = `${window.location.origin}/s/${shareData.shareToken}`;
        setCopiedLink(shareLink);
        
        // Copy to clipboard
        try {
          await navigator.clipboard.writeText(shareLink);
        } catch (clipErr) {
          console.warn('Failed to copy to clipboard automatically:', clipErr);
        }
      }

      // 4. Cleanup local cache
      localStorage.removeItem(`jam_meta_${id}`);
      await deleteVideoFromIndexedDB(id);

      // 5. Success behavior
      if (isPopup) {
        window.close();
      } else {
        setSavingState('success');
      }

    } catch (err: any) {
      clientLogger.error('editor-client', 'Error saving annotated screenshot:', err);
      setSavingState('error');
      setSavingError(err.message || 'Failed to save annotated screenshot.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0B0F19',
      fontFamily: 'sans-serif'
    }}>
      {/* Editor Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: '#131B2E',
        zIndex: 10
      }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className="btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '13px' }}
            onClick={() => {
              if (confirm('Discard changes and return to dashboard?')) {
                router.push('/');
              }
            }}
          >
            ← Cancel
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Name your screenshot..."
            style={{
              background: 'none',
              border: 'none',
              borderBottom: '1px dashed var(--text-dark)',
              color: 'white',
              fontSize: '15px',
              fontWeight: '600',
              padding: '2px 4px',
              outline: 'none',
              minWidth: '200px'
            }}
          />
        </div>

        {/* Workspace selector & Save */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Workspace:</span>
            <select
              value={selectedWorkspaceId}
              onChange={(e) => setSelectedWorkspaceId(e.target.value)}
              style={{
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '13px',
                outline: 'none'
              }}
            >
              {workspaces.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSave}
            disabled={savingState === 'saving'}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '13px', gap: '6px' }}
          >
            {savingState === 'saving' ? (
              <>
                <div style={{ width: '12px', height: '12px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} className="glow-animation"></div>
                <span>Saving...</span>
              </>
            ) : (
              <span>Save & Share</span>
            )}
          </button>
        </div>
      </header>

      {/* Editor Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        
        {/* Left Toolbar */}
        <div style={{
          width: '64px',
          borderRight: '1px solid var(--border-color)',
          backgroundColor: '#131B2E',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px 0',
          gap: '12px',
          zIndex: 5
        }}>
          {/* Tool buttons */}
          <button 
            onClick={() => setActiveTool('rectangle')}
            style={{
              width: '40px', height: '40px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              backgroundColor: activeTool === 'rectangle' ? 'var(--primary)' : 'transparent',
              color: activeTool === 'rectangle' ? 'white' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title="Rectangle"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            </svg>
          </button>

          <button 
            onClick={() => setActiveTool('circle')}
            style={{
              width: '40px', height: '40px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              backgroundColor: activeTool === 'circle' ? 'var(--primary)' : 'transparent',
              color: activeTool === 'circle' ? 'white' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title="Circle"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
            </svg>
          </button>

          <button 
            onClick={() => setActiveTool('arrow')}
            style={{
              width: '40px', height: '40px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              backgroundColor: activeTool === 'arrow' ? 'var(--primary)' : 'transparent',
              color: activeTool === 'arrow' ? 'white' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title="Arrow"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>

          <button 
            onClick={() => setActiveTool('highlight')}
            style={{
              width: '40px', height: '40px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              backgroundColor: activeTool === 'highlight' ? 'var(--primary)' : 'transparent',
              color: activeTool === 'highlight' ? 'white' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title="Highlight Brush"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
              <path d="M7.5 10.5L12 6l4.5 4.5"/>
            </svg>
          </button>

          <button 
            onClick={() => setActiveTool('text')}
            style={{
              width: '40px', height: '40px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              backgroundColor: activeTool === 'text' ? 'var(--primary)' : 'transparent',
              color: activeTool === 'text' ? 'white' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title="Text Tool"
          >
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>T</span>
          </button>

          <div style={{ width: '30px', height: '1px', backgroundColor: 'var(--border-color)', margin: '8px 0' }}></div>

          {/* Color Palettes */}
          {['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#FFFFFF', '#000000'].map((color) => (
            <button
              key={color}
              onClick={() => setActiveColor(color)}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: color,
                border: activeColor === color ? '2px solid white' : '1px solid var(--border-color)',
                cursor: 'pointer',
                boxShadow: activeColor === color ? '0 0 8px rgba(255,255,255,0.4)' : 'none'
              }}
            />
          ))}
        </div>

        {/* Edit Area / Canvas Container */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          backgroundColor: '#070A13',
          padding: '24px',
          position: 'relative'
        }}>
          {/* Top Canvas Controls Bar (Undo/Redo/Clear) */}
          <div className="glass-panel" style={{
            position: 'absolute',
            top: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
            zIndex: 4
          }}>
            <button 
              onClick={handleUndo} 
              disabled={historyIndex < 0}
              className="btn-secondary" 
              style={{ padding: '4px 8px', fontSize: '12px', border: 'none', opacity: historyIndex < 0 ? 0.4 : 1 }}
            >
              Undo (Ctrl+Z)
            </button>
            <button 
              onClick={handleRedo} 
              disabled={historyIndex >= history.length - 1}
              className="btn-secondary" 
              style={{ padding: '4px 8px', fontSize: '12px', border: 'none', opacity: historyIndex >= history.length - 1 ? 0.4 : 1 }}
            >
              Redo (Ctrl+Y)
            </button>
            <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border-color)' }}></div>
            <button 
              onClick={handleClear} 
              className="btn-secondary" 
              style={{ padding: '4px 8px', fontSize: '12px', border: 'none', color: 'var(--error)' }}
            >
              Clear
            </button>
          </div>

          {/* Canvas Wrapper */}
          <div style={{
            position: 'relative',
            boxShadow: '0 10px 45px rgba(0,0,0,0.6)',
            borderRadius: '6px',
            overflow: 'hidden',
            backgroundColor: '#0F1626',
            maxWidth: '100%',
            maxHeight: 'calc(100vh - 160px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{
                display: 'block',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                cursor: activeTool === 'text' ? 'text' : 'crosshair'
              }}
            />
          </div>
        </div>
      </div>

      {/* Saving Overlay */}
      {savingState === 'saving' && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(11, 15, 25, 0.85)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="glass-panel" style={{ padding: '30px', borderRadius: '16px', textAlign: 'center', maxWidth: '350px' }}>
            <div className="glow-animation" style={{ width: '40px', height: '40px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 20px auto' }}></div>
            <h3 style={{ fontSize: '16px', margin: '0 0 10px 0' }}>Flattening & Saving</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Applying annotations and uploading capture to your background task queue...
            </p>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {savingState === 'error' && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(11, 15, 25, 0.8)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="glass-panel" style={{ padding: '30px', borderRadius: '16px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--error)', margin: '0 0 12px 0' }}>Save Failed</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>{savingError}</p>
            <button onClick={() => setSavingState('idle')} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {savingState === 'success' && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(11, 15, 25, 0.85)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="glass-panel" style={{ padding: '30px', borderRadius: '16px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h3 style={{ fontSize: '18px', margin: '0 0 8px 0', color: 'var(--primary)' }}>Saved & Shared!</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Your annotated screenshot has been saved to your Google Drive and the public share link has been automatically copied to your clipboard.
            </p>
            
            <div style={{
              display: 'flex',
              backgroundColor: '#131B2E',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '8px 12px',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              gap: '8px'
            }}>
              <span style={{ fontSize: '11px', color: '#8B94A3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {copiedLink}
              </span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(copiedLink);
                  alert('Link copied to clipboard!');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Copy to clipboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {isPopup ? (
                <button 
                  onClick={() => {
                    window.close();
                  }}
                  className="btn-primary" 
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Close Window
                </button>
              ) : (
                <button 
                  onClick={() => {
                    router.push('/');
                    window.location.reload();
                  }}
                  className="btn-primary" 
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Go to Backoffice
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
