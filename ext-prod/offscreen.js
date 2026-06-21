let mediaRecorder = null;
let stream = null;
let chunks = [];
let canvasInterval = null;

// Mendengarkan perintah perekaman dari service_worker.js
chrome.runtime.onMessage.addListener((message) => {
  if (message.source === 'jam-extension-background') {
    if (message.action === 'START_OFFSCREEN_CAPTURE') {
      startRecording(message.payload?.streamId);
    } else if (message.action === 'STOP_OFFSCREEN_CAPTURE') {
      stopRecording();
    } else if (message.action === 'PAUSE_OFFSCREEN_CAPTURE') {
      pauseRecording();
    } else if (message.action === 'RESUME_OFFSCREEN_CAPTURE') {
      resumeRecording();
    }
  }
});

async function startRecording(streamId) {
  chunks = [];
  
  try {
    if (streamId) {
      // 1. Gunakan tabCapture streamId jika tersedia (merekam tab aktif secara instan)
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          mandatory: {
            chromeMediaSource: 'tab',
            chromeMediaSourceId: streamId
          }
        },
        audio: false // Setel ke false agar tidak bermasalah dengan permissions audio, atau tabCapture sudah mencakup audio tab secara default
      });
    } else {
      // 2. Fallback ke getDisplayMedia biasa jika tidak ada streamId
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
    }
  } catch (err) {
    console.warn('[Jam Extension] Izin rekam layar ditolak, beralih ke video Canvas fallback:', err);
    
    // 3. Fallback: Buat Canvas animasi jika user membatalkan dialog sharing
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');
    let frame = 0;
    
    canvasInterval = setInterval(() => {
      frame++;
      if (!ctx) return;
      
      // Latar belakang
      ctx.fillStyle = '#130F18';
      ctx.fillRect(0, 0, 800, 450);
      
      // Judul
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Jam.dev Extension Bug Report', 400, 180);
      
      // Deskripsi fallback
      ctx.fillStyle = '#8B94A3';
      ctx.font = '16px sans-serif';
      ctx.fillText('Izin rekam layar tidak diberikan. Log & aktivitas halaman tetap dicatat.', 400, 225);
      
      // Indikator perekaman merah yang berkedip
      const dotAlpha = 0.4 + Math.sin(frame * 0.15) * 0.4;
      ctx.fillStyle = `rgba(239, 68, 68, ${dotAlpha})`;
      ctx.beginPath();
      ctx.arc(400, 280, 16, 0, Math.PI * 2);
      ctx.fill();
    }, 60);
    
    stream = canvas.captureStream(30); // Ambil stream 30 FPS dari canvas
  }

  // 4. Inisialisasi MediaRecorder
  let options = { mimeType: 'video/webm;codecs=vp8' };
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options = { mimeType: 'video/webm' };
  }

  mediaRecorder = new MediaRecorder(stream, options);
  
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  mediaRecorder.start(1000);
}

function pauseRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.pause();
  }
}

function resumeRecording() {
  if (mediaRecorder && mediaRecorder.state === 'paused') {
    mediaRecorder.resume();
  }
}

function stopRecording() {
  if (canvasInterval) {
    clearInterval(canvasInterval);
    canvasInterval = null;
  }

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      
      // Konversi blob ke base64 agar bisa ditransmisikan lewat message passing ke service worker
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64Data = reader.result;
        chrome.runtime.sendMessage({
          source: 'jam-extension-offscreen',
          action: 'VIDEO_BLOB_READY',
          payload: base64Data
        });
      };
    };
    
    mediaRecorder.stop();
  }

  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
}
