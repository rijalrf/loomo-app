'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getVideoFromIndexedDB, deleteVideoFromIndexedDB } from '../lib/indexeddb';
import { clientLogger } from '@/lib/clientLogger';
import { toast } from 'sonner';
import PopupModal from '@/components/PopupModal';
import { Link2, X } from 'lucide-react';
import CustomSelect from './CustomSelect';

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
  const [activeColor, setActiveColor] = useState('#ef4444');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [history, setHistory] = useState<Annotation[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const selectedWorkspace = workspaces.find(ws => ws.id === selectedWorkspaceId);
  const [folders, setFolders] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!selectedWorkspaceId) {
      setFolders([]);
      setSelectedFolderId('');
      return;
    }
    fetch(`/api/workspace/folders?workspaceId=${selectedWorkspaceId}`)
      .then(res => res.json())
      .then(data => {
        setFolders(data.folders || []);
        const savedFolderId = localStorage.getItem(`loomo_editor_folder_id_${selectedWorkspaceId}`) || '';
        const folderExists = data.folders?.some((f: any) => f.id === savedFolderId);
        setSelectedFolderId(folderExists ? savedFolderId : '');
      })
      .catch(err => console.error('Failed to load folders:', err));
  }, [selectedWorkspaceId]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [currentPromptResolve, setCurrentPromptResolve] = useState<((value: string | null) => void) | null>(null);

  const isPopup = searchParams.get('isPopup') === 'true';
  const [copiedLink, setCopiedLink] = useState<string>('');
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [savingError, setSavingError] = useState<string | null>(null);
  const [isLoadingEditor, setIsLoadingEditor] = useState(true);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const isDrawingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const activeAnnotationRef = useRef<Annotation | null>(null);

  // Load Image and workspaces
  useEffect(() => {
    if (!id) return;

    setIsLoadingEditor(true);

    const handleDataReady = () => {
      console.log('[EditorClient] Data ready event received, loading media...');
      loadEditorData();
    };

    const loadEditorData = () => {
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
          setIsLoadingEditor(false);
          toast.success('Loomo Editor is ready!');
        } else {
          setIsLoadingEditor(false);
          toast.error('Failed to load media from local storage.');
        }
      });
    };

    window.addEventListener('loomo_editor_data_ready', handleDataReady);

    const checkDataWithRetry = (attempt = 0) => {
      const maxAttempts = 10;
      const retryDelay = 300;

      const rawMeta = localStorage.getItem(`jam_meta_${id}`);
      if (rawMeta) {
        console.log('[EditorClient] Data found in localStorage, loading...');
        loadEditorData();
      } else if (attempt < maxAttempts) {
        console.log(`[EditorClient] Data not ready yet, retry ${attempt + 1}/${maxAttempts}...`);
        setTimeout(() => checkDataWithRetry(attempt + 1), retryDelay);
      } else {
        console.error('[EditorClient] Data not available after maximum retries');
        setIsLoadingEditor(false);
        toast.error('Failed to load media from local storage.');
      }
    };

    checkDataWithRetry();

    return () => {
      window.removeEventListener('loomo_editor_data_ready', handleDataReady);
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

    const handleClear = async () => {
      setShowClearConfirm(true);
    };

    const confirmClear = () => {
      setAnnotations([]);
      pushToHistory([]);
      setShowClearConfirm(false);
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

  const handleMouseDown = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (savingState === 'saving') return;
    const pos = getMousePos(e);
    isDrawingRef.current = true;
    startPosRef.current = pos;

    if (activeTool === 'text') {
      const text = await new Promise<string | null>((resolve) => {
        setCurrentPromptResolve(() => resolve);
        setShowPromptModal(true);
      });

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

      let mediaId: string;

      if (isRecording || blob.size > 4 * 1024 * 1024) {
        // Direct resumable upload to Google Drive to bypass Vercel 4.5MB limit
        const initResponse = await fetch('/api/media/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: title || (isRecording ? 'Screen Recording' : 'Annotated Screenshot'),
            description: description || undefined,
            type: isRecording ? 'recording' : 'screenshot',
            workspaceId: selectedWorkspaceId,
            folderId: (selectedFolderId && selectedFolderId !== 'null' && selectedFolderId !== 'none') ? selectedFolderId : undefined,
            durationSeconds: (isRecording && metadata?.duration) ? metadata.duration : 0,
            fileSize: blob.size
          })
        });

        if (!initResponse.ok) {
          const errJson = await initResponse.json();
          throw new Error(errJson.error || 'Server failed to initiate upload session');
        }

        const { mediaId: initMediaId, uploadUrl } = await initResponse.json();
        mediaId = initMediaId;

        // PUT directly to Google Drive resumable session URL
        const gDriveUploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: blob,
          headers: {
            'Content-Type': blob.type || (isRecording ? 'video/webm' : 'image/png')
          }
        });

        if (!gDriveUploadRes.ok) {
          throw new Error('Failed to upload file content directly to Google Drive');
        }

        const googleFileMetadata = await gDriveUploadRes.json();
        const driveFileId = googleFileMetadata.id;

        // Finalize on server
        const completeRes = await fetch('/api/media/upload/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            mediaId,
            driveFileId,
            fileSize: blob.size
          })
        });

        if (!completeRes.ok) {
          const errJson = await completeRes.json();
          throw new Error(errJson.error || 'Server failed to finalize upload');
        }
      } else {
        // Fallback to standard multipart upload for small screenshots
        const formData = new FormData();
        formData.append('file', blob, filename);
        formData.append('title', title || (isRecording ? 'Screen Recording' : 'Annotated Screenshot'));
        formData.append('type', isRecording ? 'recording' : 'screenshot');
        formData.append('workspaceId', selectedWorkspaceId);
        if (description) {
          formData.append('description', description);
        }
        if (selectedFolderId && selectedFolderId !== 'null' && selectedFolderId !== 'none') {
          formData.append('folderId', selectedFolderId);
        }
        if (isRecording && metadata?.duration) {
          formData.append('durationSeconds', String(metadata.duration));
        }

        const res = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          const errJson = await res.json();
          throw new Error(errJson.error || 'Server upload failed');
        }

        const uploadResult = await res.json();
        mediaId = uploadResult.mediaId;
      }

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

  if (isLoadingEditor) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--bg-main)] text-slate-200 font-sans">
        <div className="glass-panel p-10 rounded-xl max-w-md w-full text-center border-slate-700 shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 rounded-full border-4 border-[var(--primary)]/20 border-t-[var(--primary)] animate-spin mx-auto mb-6"></div>
          <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Loading Editor</h3>
          <p className="text-slate-400 text-sm font-medium leading-relaxed">
            Preparing your capture for editing...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-main)] font-sans">
      {/* Editor Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-card)]/90 backdrop-blur-md z-50 sticky top-0">
        {/* Title */}
        <div className="flex items-center gap-4">
          <button 
            className="btn-secondary py-1.5 px-4 text-xs font-bold border-[var(--border-color)] hover:border-[var(--text-dark)]"
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

          <div className="w-px h-5 bg-[var(--border-color)]"></div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Name your capture..."
            className="bg-transparent border-none text-white text-sm font-bold px-2 py-1 outline-none focus:ring-0 placeholder:text-[var(--text-dark)] min-w-[240px]"
          />
        </div>


      </header>

      {/* Editor Body */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Toolbar */}
        {metadata?.type !== 'recording' && (
          <div className="w-20 border-r border-[var(--border-color)] bg-[var(--bg-card)]/85 backdrop-blur-md flex flex-col items-center py-8 gap-4 z-10 sticky left-0">
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
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${activeTool === tool.id ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-hover)]'}`}
                title={tool.label}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {tool.icon}
                </svg>
              </button>
            ))}

            <button 
              onClick={() => setActiveTool('text')}
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all text-xl font-black ${activeTool === 'text' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-hover)]'}`}
              title="Text"
            >
              T
            </button>

            <div className="w-8 h-px bg-[var(--border-color)] my-4"></div>

            {/* Color Palettes */}
            <div className="flex flex-col gap-3">
              {[
                { color: '#ef4444', label: 'Red' },
                { color: '#3b82f6', label: 'Blue' },
                { color: '#10b981', label: 'Green' },
                { color: '#f59e0b', label: 'Yellow' },
                { color: '#6366f1', label: 'Purple' },
                { color: '#ffffff', label: 'White' },
                { color: '#000000', label: 'Black' }
              ].map((item) => (
                <button
                  key={item.color}
                  onClick={() => setActiveColor(item.color)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-125 ${activeColor === item.color ? 'border-white scale-125' : 'border-[var(--border-color)]'}`}
                  style={{ backgroundColor: item.color }}
                  title={item.label}
                />
              ))}
            </div>
          </div>
        )}

        {/* Edit Area / Canvas Container */}
        <div className="flex-1 flex flex-col items-center justify-center overflow-auto bg-[var(--bg-main)]/40 p-6 md:p-12 relative">
          {/* Top Canvas Controls Bar (Undo/Redo/Clear) */}
          {metadata?.type !== 'recording' && (
            <div className="glass-panel absolute top-8 flex items-center gap-2 px-3 py-1.5 rounded-full border-[var(--border-color)] z-10">
              <button 
                onClick={handleUndo} 
                disabled={historyIndex < 0}
                className="p-2 text-[var(--text-muted)] hover:text-white disabled:opacity-30 disabled:hover:text-[var(--text-muted)] transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
              </button>
              <button 
                onClick={handleRedo} 
                disabled={historyIndex >= history.length - 1}
                className="p-2 text-[var(--text-muted)] hover:text-white disabled:opacity-30 disabled:hover:text-[var(--text-muted)] transition-colors"
                title="Redo (Ctrl+Y)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
              </button>
              <div className="w-px h-4 bg-[var(--border-color)]"></div>
              <button 
                onClick={handleClear} 
                className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
 
          {/* Canvas Wrapper */}
          <div className="relative rounded-xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-color)] max-w-full max-h-full flex items-center justify-center">
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

        {/* Right Settings Sidebar */}
        <div className="w-80 lg:w-[24%] min-w-[280px] shrink-0 border-l border-[var(--border-color)] bg-[var(--bg-card)]/50 backdrop-blur-md p-6 flex flex-col gap-6 overflow-hidden z-10 text-left">
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider mb-1">Capture Settings</h4>
            <p className="text-[10px] text-[var(--text-muted)] font-medium leading-relaxed">
              Configure options and document context before saving.
            </p>
          </div>

          <div className="w-full h-px bg-[var(--border-color)]"></div>

          {/* Workspace Select */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none">Workspace</span>
            <CustomSelect
              value={selectedWorkspaceId}
              onChange={(val) => {
                setSelectedWorkspaceId(val);
                localStorage.setItem('loomo_active_workspace_id', val);
              }}
              options={workspaces.map(ws => ({ value: ws.id, label: ws.name }))}
              placeholder="Select Workspace"
              buttonClassName="w-full flex items-center justify-between gap-1.5 bg-[#0a0a0b]/50 hover:bg-[#27272a]/50 border border-[#3f3f46] text-white py-2.5 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
            />
          </div>

          {/* Project Select */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none">Project</span>
            <CustomSelect
              value={selectedFolderId || 'none'}
              onChange={(val) => {
                const folderVal = val === 'none' ? '' : val;
                setSelectedFolderId(folderVal);
                localStorage.setItem(`loomo_editor_folder_id_${selectedWorkspaceId}`, folderVal);
              }}
              options={[
                { value: 'none', label: 'None (Unassigned)' },
                ...folders.map(f => ({ value: f.id, label: f.name }))
              ]}
              placeholder="Select Project"
              buttonClassName="w-full flex items-center justify-between gap-1.5 bg-[#0a0a0b]/50 hover:bg-[#27272a]/50 border border-[#3f3f46] text-white py-2.5 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
            />
          </div>

          {/* Description Textarea */}
          <div className="flex flex-col gap-2 flex-1 min-h-0">
            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a description of this screenshot or issue..."
              className="w-full flex-1 min-h-0 bg-[#0a0a0b]/50 border border-[#3f3f46] text-white rounded-lg p-3 text-xs outline-none focus:border-[#3b82f6] hover:border-[#52525b] hover:cursor-text cursor-pointer transition-all resize-none placeholder:text-[var(--text-dark)] leading-relaxed font-medium"
            />
          </div>

          {/* Save & Share Button */}
          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={savingState === 'saving'}
              className="w-full btn-primary py-4 px-6 text-sm rounded-lg gap-2 cursor-pointer flex items-center justify-center font-extrabold hover:scale-[1.01] transition-transform"
            >
              {savingState === 'saving' ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <span className="uppercase tracking-widest text-[11px]">Save & Share</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {savingState === 'saving' && (
        <PopupModal isOpen={true} onClose={() => {}} maxWidth="sm">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full border-4 border-[var(--primary)]/20 border-t-[var(--primary)] animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Saving Media</h3>
            <p className="text-[var(--text-muted)] text-sm font-medium leading-relaxed">
              Applying annotations and uploading to your Google Drive...
            </p>
          </div>
        </PopupModal>
      )}

      {/* Error Modal */}
      {savingState === 'error' && (
        <PopupModal isOpen={true} onClose={() => setSavingState('idle')} maxWidth="sm">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <X size={32} />
            </div>
            <h3 className="text-xl font-black text-white mb-3">Upload Failed</h3>
            <p className="text-[var(--text-muted)] text-sm mb-8 font-medium">{savingError}</p>
            <button onClick={() => setSavingState('idle')} className="bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] hover:from-[#2563eb] hover:to-[#1e40af] text-white py-3 rounded-lg font-black uppercase tracking-widest text-[10px] w-full transition-all cursor-pointer">
              Try Again
            </button>
          </div>
        </PopupModal>
      )}

      {/* Clear All Annotations Confirmation Modal */}
      <PopupModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        maxWidth="sm"
      >
        <h3 className="text-lg font-semibold text-[#e4e4e7] mb-2 pr-6">Clear Annotations</h3>
        <p className="text-sm text-[#a1a1aa] mb-6 leading-relaxed">
          Are you sure you want to clear all annotations? This action cannot be undone.
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setShowClearConfirm(false)}
            className="px-4 py-2 bg-[#27272a] border border-[#3f3f46] text-[#e4e4e7] rounded-lg text-sm font-semibold hover:bg-[#3f3f46] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={confirmClear}
            className="px-4 py-2 bg-gradient-to-br from-[#ef4444] to-[#dc2626] hover:from-[#dc2626] hover:to-[#b91c1c] text-white rounded-lg text-sm font-semibold transition-all cursor-pointer"
          >
            Clear All
          </button>
        </div>
      </PopupModal>

      {/* Prompt for Text Annotation */}
      <PopupModal
        isOpen={showPromptModal}
        onClose={() => {
          currentPromptResolve && currentPromptResolve(null);
          setShowPromptModal(false);
          setPromptText('');
        }}
        maxWidth="sm"
      >
        <h3 className="text-lg font-semibold text-[#e4e4e7] mb-2 pr-6">Enter Annotation Text</h3>
        <input
          type="text"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              currentPromptResolve && currentPromptResolve(promptText);
              setShowPromptModal(false);
              setPromptText('');
            }
          }}
          placeholder="Type your text here..."
          className="bg-[#111113] border border-[#3f3f46] rounded-lg px-4 py-2 text-white text-sm w-full mb-6 outline-none focus:border-[#3b82f6] transition-colors"
          autoFocus
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => {
              currentPromptResolve && currentPromptResolve(null);
              setShowPromptModal(false);
              setPromptText('');
            }}
            className="px-4 py-2 bg-[#27272a] border border-[#3f3f46] text-[#e4e4e7] rounded-lg text-sm font-semibold hover:bg-[#3f3f46] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              currentPromptResolve && currentPromptResolve(promptText);
              setShowPromptModal(false);
              setPromptText('');
            }}
            className="px-4 py-2 bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] hover:from-[#2563eb] hover:to-[#1e40af] text-white rounded-lg text-sm font-semibold transition-all cursor-pointer"
          >
            Save
          </button>
        </div>
      </PopupModal>
    </div>
  );
}
