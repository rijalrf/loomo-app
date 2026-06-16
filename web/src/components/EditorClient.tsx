'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getVideoFromIndexedDB, deleteVideoFromIndexedDB } from '../lib/indexeddb';
import { clientLogger } from '@/lib/clientLogger';
import { toast } from 'sonner';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

function CustomSelect({
  value,
  onChange,
  options,
  className = ""
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-1.5 bg-slate-900 border border-slate-700 text-xs font-bold text-[#0CB2EB] px-2 py-1 rounded outline-none cursor-pointer"
      >
        <span>{selected ? selected.label : 'Select...'}</span>
        <ChevronDown size={12} className="text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 z-50 min-w-[140px] bg-[#0B0F19]/95 backdrop-blur-md border border-slate-800 rounded-lg shadow-2xl p-1 animate-in fade-in duration-150">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left rounded-md text-xs font-bold transition-colors ${
                option.value === value
                  ? 'bg-[#0CB2EB]/15 text-[#0CB2EB]'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="flex-1 truncate text-left">{option.label}</span>
              {option.value === value && (
                <Check size={12} className="text-[#0CB2EB]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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

    toast.info('Loomo Editor is ready!');

    // Load workspaces
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setWorkspaces(data.workspaces);
          const savedWorkspaceId = localStorage.getItem('loomo_active_workspace_id');
          const targetWorkspace = data.workspaces.find((w: any) => w.id === savedWorkspaceId) || data.workspaces[0];
          setSelectedWorkspaceId(targetWorkspace?.id || '');
        }
      });

    // Load screenshot metadata
    const rawMeta = localStorage.getItem(`jam_meta_${id}`);
    if (rawMeta) {
      try {
        const parsed = JSON.parse(rawMeta);
        setMetadata(parsed);
        setTitle(parsed.title || `${parsed.type === 'recording' ? 'Recording' : 'Screenshot'} ${new Date().toLocaleDateString()}`);
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
    if (!id) return;

    setSavingState('saving');
    setSavingError(null);
    toast.loading('Saving media and generating share link...', { id: 'save-media' });

    try {
      const isRecording = metadata?.type === 'recording';
      let blob: Blob | null = null;
      let filename = '';

      if (isRecording) {
        // 1. Get video blob from IndexedDB
        blob = await getVideoFromIndexedDB(id);
        filename = `${id}.webm`;
      } else {
        if (!canvas) throw new Error('Canvas not found');
        // 1. Convert annotated canvas to blob
        blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/png');
        });
        filename = `${id}_annotated.png`;
      }

      if (!blob) {
        throw new Error(isRecording ? 'Failed to read video recording.' : 'Failed to flatten image canvas.');
      }

      // 2. Prepare Form Data
      const formData = new FormData();
      formData.append('file', blob, filename);
      formData.append('title', title || (isRecording ? 'Screen Recording' : 'Annotated Screenshot'));
      formData.append('type', isRecording ? 'recording' : 'screenshot');
      formData.append('workspaceId', selectedWorkspaceId);
      if (isRecording && metadata?.duration) {
        formData.append('durationSeconds', String(metadata.duration));
      }

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
      toast.success('Successfully saved! Share link copied to clipboard.', { id: 'save-media' });
      if (isPopup) {
        window.dispatchEvent(new CustomEvent('loomo_close_window'));
        // Fallback for standalone window.open environments
        setTimeout(() => {
          window.close();
        }, 1200);
      } else {
        router.push('/');
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }

    } catch (err: any) {
      clientLogger.error('editor-client', 'Error saving annotated screenshot:', err);
      setSavingState('error');
      setSavingError(err.message || 'Failed to save annotated screenshot.');
      toast.error(err.message || 'Failed to save annotated screenshot.', { id: 'save-media' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F172A] text-slate-200 font-sans">
      {/* Editor Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0F172A]/80 backdrop-blur-xl z-50 sticky top-0">
        {/* Title */}
        <div className="flex items-center gap-4">
          <button 
            className="btn-secondary py-1.5 px-4 text-xs font-bold border-slate-700 hover:border-slate-500"
            onClick={async () => {
              localStorage.removeItem(`jam_meta_${id}`);
              try {
                if (id) {
                  await deleteVideoFromIndexedDB(id);
                }
              } catch (e) {}

              if (isPopup) {
                window.dispatchEvent(new CustomEvent('loomo_close_window'));
                setTimeout(() => {
                  window.close();
                }, 100);
              } else {
                router.push('/');
              }
            }}
          >
            ← Cancel
          </button>
          
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => router.push('/')}>
            <img src="/logo.png" alt="Loomo Logo" className="w-6 h-6 object-contain" />
            <span className="text-base font-black tracking-tighter text-white">Loomo</span>
          </div>

          <div className="w-px h-5 bg-slate-800"></div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Name your capture..."
            className="bg-transparent border-none text-white text-sm font-bold px-2 py-1 outline-none focus:ring-0 placeholder:text-slate-600 min-w-[240px]"
          />
        </div>

        {/* Save */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 mr-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Workspace</span>
            <CustomSelect
              value={selectedWorkspaceId}
              onChange={(val) => setSelectedWorkspaceId(val)}
              options={workspaces.map((w) => ({ value: w.id, label: w.name }))}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={savingState === 'saving'}
            className="btn-primary py-2 px-6 text-xs rounded-lg gap-2 shadow-[#0CB2EB]/20"
          >
            {savingState === 'saving' ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="font-bold">Saving...</span>
              </>
            ) : (
              <span className="font-bold uppercase tracking-widest text-[10px]">Save & Share</span>
            )}
          </button>
        </div>
      </header>

      {/* Editor Body */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Toolbar */}
        {metadata?.type !== 'recording' && (
          <div className="w-20 border-r border-slate-800 bg-[#0F172A]/50 backdrop-blur-md flex flex-col items-center py-8 gap-4 z-10 sticky left-0">
            {/* Tool buttons */}
            {[
              { id: 'rectangle', icon: <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>, label: 'Box' },
              { id: 'circle', icon: <circle cx="12" cy="12" r="10"/>, label: 'Circle' },
              { id: 'arrow', icon: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>, label: 'Arrow' },
              { id: 'highlight', icon: <><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M7.5 10.5L12 6l4.5 4.5"/></>, label: 'Brush' }
            ].map((tool) => (
              <button 
                key={tool.id}
                onClick={() => setActiveTool(tool.id as any)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${activeTool === tool.id ? 'bg-[#0CB2EB] text-white shadow-[0_0_15px_rgba(12,178,235,0.4)]' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800'}`}
                title={tool.label}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {tool.icon}
                </svg>
              </button>
            ))}

            <button 
              onClick={() => setActiveTool('text')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all text-xl font-black ${activeTool === 'text' ? 'bg-[#0CB2EB] text-white shadow-[0_0_15px_rgba(12,178,235,0.4)]' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800'}`}
              title="Text"
            >
              T
            </button>

            <div className="w-8 h-px bg-slate-800 my-4"></div>

            {/* Color Palettes */}
            <div className="flex flex-col gap-3">
              {['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8A5CF6', '#FFFFFF', '#000000'].map((color) => (
                <button
                  key={color}
                  onClick={() => setActiveColor(color)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-125 ${activeColor === color ? 'border-white scale-125' : 'border-slate-800'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Edit Area / Canvas Container */}
        <div className="flex-1 flex flex-col items-center justify-center overflow-auto bg-slate-950/50 p-6 md:p-12 relative">
          {/* Top Canvas Controls Bar (Undo/Redo/Clear) */}
          {metadata?.type !== 'recording' && (
            <div className="glass-panel absolute top-8 flex items-center gap-2 px-3 py-1.5 rounded-full border-slate-700/50 shadow-2xl z-10">
              <button 
                onClick={handleUndo} 
                disabled={historyIndex < 0}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
              </button>
              <button 
                onClick={handleRedo} 
                disabled={historyIndex >= history.length - 1}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                title="Redo (Ctrl+Y)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
              </button>
              <div className="w-px h-4 bg-slate-800"></div>
              <button 
                onClick={handleClear} 
                className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
 
          {/* Canvas Wrapper */}
          <div className="relative shadow-[0_30px_100px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden bg-slate-900 border border-slate-800 max-w-full max-h-full flex items-center justify-center">
            {metadata?.type === 'recording' ? (
              <video
                src={imageSrc || undefined}
                controls
                autoPlay
                className="block max-w-full max-h-full object-contain bg-black"
              />
            ) : (
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className={`block max-w-full max-h-full object-contain ${activeTool === 'text' ? 'cursor-text' : 'cursor-crosshair'}`}
              />
            )}
          </div>
        </div>
      </div>

      {/* Saving Overlay */}
      {savingState === 'saving' && (
        <div className="fixed inset-0 bg-slate-950/80 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="glass-panel p-10 rounded-3xl max-w-xs w-full text-center border-slate-700 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full border-4 border-[#0CB2EB]/20 border-t-[#0CB2EB] animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Saving Media</h3>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              Applying annotations and uploading to your Google Drive...
            </p>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {savingState === 'error' && (
        <div className="fixed inset-0 bg-slate-950/80 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="glass-panel p-10 rounded-3xl max-w-sm w-full text-center border-red-500/50 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3 className="text-xl font-black text-white mb-3">Upload Failed</h3>
            <p className="text-slate-400 text-sm mb-8 font-medium">{savingError}</p>
            <button onClick={() => setSavingState('idle')} className="btn-primary w-full py-3 rounded-xl font-black uppercase tracking-widest text-[10px]">
              Try Again
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
