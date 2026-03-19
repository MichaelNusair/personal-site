'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Upload,
  X,
  FileAudio,
  FileVideo,
  CheckCircle,
  Mic,
  Clock,
  Layers,
  Lock,
  LogOut,
  History,
} from 'lucide-react';

const TRANSCRIPTIONS_KEY = 'f_transcriptions';

interface StoredTranscription {
  id: string;
  fileName: string;
  createdAt: string;
}

const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp4',
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo', // AVI
  'video/x-matroska', // MKV
  'video/x-flv', // FLV
  'video/3gpp', // 3GP
  'video/x-ms-wmv', // WMV
  'video/mpeg', // MPEG
];

const ALLOWED_TYPES = [...ALLOWED_AUDIO_TYPES, ...ALLOWED_VIDEO_TYPES];
const ALLOWED_EXTENSIONS = '.mp3,.wav,.webm,.ogg,.m4a,.mp4,.mov,.avi,.mkv,.flv,.3gp,.wmv,.mpeg,.mpg';
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

const CHUNK_OPTIONS = [
  { value: 15, label: '15 sec', description: 'Fastest results' },
  { value: 30, label: '30 sec', description: 'Quick feedback' },
  { value: 60, label: '1 min', description: 'Recommended' },
  { value: 180, label: '3 min', description: 'Fewer chunks' },
];

export default function TranscriptionUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [storedTranscriptions, setStoredTranscriptions] = useState<StoredTranscription[]>([]);

  const [file, setFile] = useState<File | null>(null);
  const [fileDuration, setFileDuration] = useState<number | null>(null);
  const [chunkDuration, setChunkDuration] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check auth and load transcriptions on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        const isAuth = !!data?.user?.email;
        setIsAuthenticated(isAuth);
        setUserEmail(data?.user?.email || null);
      } catch {
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    try {
      const transcriptions = localStorage.getItem(TRANSCRIPTIONS_KEY);
      if (transcriptions) {
        setStoredTranscriptions(JSON.parse(transcriptions));
      }
    } catch {
      localStorage.removeItem(TRANSCRIPTIONS_KEY);
    }
  }, []);

  const saveTranscription = (id: string, fileName: string) => {
    const newTranscription: StoredTranscription = {
      id,
      fileName,
      createdAt: new Date().toISOString(),
    };
    const updated = [newTranscription, ...storedTranscriptions];
    setStoredTranscriptions(updated);
    localStorage.setItem(TRANSCRIPTIONS_KEY, JSON.stringify(updated));
  };

  const handleLogout = () => {
    localStorage.removeItem(TRANSCRIPTIONS_KEY);
    setStoredTranscriptions([]);
    window.location.href = `/api/auth/signout?callbackUrl=/f`;
  };

  const estimatedChunks = fileDuration
    ? Math.ceil(fileDuration / chunkDuration)
    : null;

  const validateFile = (file: File): string | null => {
    const isValidType = ALLOWED_TYPES.includes(file.type);
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = [
      'mp3', 'wav', 'webm', 'ogg', 'm4a', // Audio
      'mp4', 'mov', 'avi', 'mkv', 'flv', '3gp', 'wmv', 'mpeg', 'mpg', // Video
    ];

    if (!isValidType && (!ext || !validExtensions.includes(ext))) {
      return 'Invalid file type. Please upload an audio or video file.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File too large. Maximum size is 2GB.';
    }
    return null;
  };

  const detectDuration = useCallback((selectedFile: File) => {
    const url = URL.createObjectURL(selectedFile);
    const isVideo = selectedFile.type.startsWith('video/');

    if (isVideo) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        setFileDuration(video.duration);
        URL.revokeObjectURL(url);
      };
      video.onerror = () => URL.revokeObjectURL(url);
      video.src = url;
    } else {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        setFileDuration(audio.duration);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => URL.revokeObjectURL(url);
      audio.src = url;
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setError(null);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        const validationError = validateFile(droppedFile);
        if (validationError) {
          setError(validationError);
          return;
        }
        setFile(droppedFile);
        setFileDuration(null);
        detectDuration(droppedFile);
      }
    },
    [detectDuration]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
        return;
      }
      setFile(selectedFile);
      setFileDuration(null);
      detectDuration(selectedFile);
    }
  };

  const handleDropZoneClick = () => {
    if (!isSubmitting && !file) {
      fileInputRef.current?.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress('Getting upload URL...');

    try {
      // Only send metadata, not the file itself
      const uploadResponse = await fetch('/api/f/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          chunkDuration: chunkDuration,
        }),
      });

      if (!uploadResponse.ok) {
        const data = await uploadResponse.json();
        throw new Error(data.error || 'Failed to initiate upload');
      }

      const { id, uploadUrl } = await uploadResponse.json();

      setUploadProgress('Uploading file...');
      setUploadPercent(0);

      // Use XMLHttpRequest for upload progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadPercent(percent);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error('Failed to upload file to storage'));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload was cancelled'));
        });

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.send(file);
      });

      setUploadPercent(null);

      setUploadProgress('Starting transcription...');
      const confirmResponse = await fetch('/api/f/upload/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptionId: id,
          estimatedDuration: fileDuration || 0,
        }),
      });

      if (!confirmResponse.ok) {
        const data = await confirmResponse.json();
        throw new Error(data.error || 'Failed to start transcription');
      }

      // Save transcription to local history
      saveTranscription(id, file.name);

      setUploadProgress('Redirecting...');
      router.push(`/f/${id}`);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsSubmitting(false);
      setUploadProgress(null);
      setUploadPercent(null);
    }
  };

  const getFileIcon = () => {
    if (!file) return null;
    if (file.type.startsWith('video/')) {
      return <FileVideo className="h-10 w-10 text-primary" />;
    }
    return <FileAudio className="h-10 w-10 text-primary" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  // Loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Auth gate - require Google sign in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-card border rounded-xl p-8 shadow-lg">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-xl font-bold mb-2">Transcription Service</h1>
              <p className="text-muted-foreground text-sm">
                Sign in with Google to access the transcription tool
              </p>
            </div>

            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: `/f` })}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background">
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/f/voice-task"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mic className="h-4 w-4" />
              Voice Task
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
              title="Logout & clear history"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mic className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Transcribe Audio & Video</h1>
          <p className="text-muted-foreground">
            Upload recordings up to 2GB. Long files are split into chunks for
            efficient processing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Drop zone */}
          <div
            onClick={handleDropZoneClick}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'}
              ${file ? 'bg-muted/50 cursor-default' : ''}
              ${isSubmitting ? 'pointer-events-none opacity-60' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ALLOWED_EXTENSIONS}
              onChange={handleFileSelect}
              disabled={isSubmitting}
            />

            {file ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-4">
                  {getFileIcon()}
                  <div className="text-start flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      {formatFileSize(file.size)}
                      {fileDuration && (
                        <>
                          <span className="text-muted-foreground/50">•</span>
                          <Clock className="h-3 w-3" />
                          {formatDuration(fileDuration)}
                        </>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setFileDuration(null);
                      setError(null);
                    }}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {fileDuration && estimatedChunks && (
                  <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>
                      Will be processed in {estimatedChunks} chunk
                      {estimatedChunks > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg mb-2">
                  <span className="font-medium text-primary">
                    Click to upload
                  </span>{' '}
                  or drag and drop
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Audio and video files up to 2GB
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                  {['mp3', 'wav', 'm4a', 'mp4', 'mov', 'avi', 'mkv'].map((ext) => (
                    <span key={ext} className="px-2 py-1 bg-muted rounded">
                      .{ext}
                    </span>
                  ))}
                  <span className="px-2 py-1 bg-muted rounded text-muted-foreground/70">
                    +more
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Chunk duration selector - only show for long files */}
          {file && fileDuration && fileDuration > 30 && (
            <div className="bg-muted/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Chunk Size</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Long recordings are split into chunks. You can review and
                correct each chunk while the next one processes.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CHUNK_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setChunkDuration(option.value)}
                    className={`p-2 rounded-lg border text-sm transition-all ${chunkDuration === option.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted hover:border-muted-foreground/50'
                      }`}
                  >
                    <div className="font-medium">{option.label}</div>
                  </button>
                ))}
              </div>
              {estimatedChunks && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  {estimatedChunks} chunk{estimatedChunks > 1 ? 's' : ''} total
                </p>
              )}
            </div>
          )}

          {/* Features */}
          <div className="bg-muted/30 rounded-xl p-6">
            <h3 className="font-medium mb-3">What you&apos;ll get:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span>Upload video files - audio is extracted automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span>AI transcription with word-level timestamps</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span>Confidence highlighting to spot errors quickly</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span>Click any word to hear the original audio</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span>
                  Work on chunks while others process in the background
                </span>
              </li>
            </ul>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm flex items-start gap-3">
              <X className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Upload failed</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !file}
            className="w-full relative overflow-hidden inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-4 rounded-lg text-lg font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            {uploadPercent !== null && (
              <div
                className="absolute inset-0 bg-primary-foreground/20 transition-all duration-300"
                style={{ width: `${uploadPercent}%` }}
              />
            )}
            <span className="relative flex items-center gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {uploadPercent !== null
                    ? `Uploading... ${uploadPercent}%`
                    : uploadProgress || 'Processing...'}
                </>
              ) : (
                <>
                  Start Transcription
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </span>
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Files are processed securely and deleted after 30 days.
          </p>
        </form>

        {/* Previous transcriptions */}
        {storedTranscriptions.length > 0 && (
          <div className="mt-12 border-t pt-8">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-medium">Your Transcriptions</h2>
            </div>
            <div className="space-y-2">
              {storedTranscriptions.map((t) => (
                <Link
                  key={t.id}
                  href={`/f/${t.id}`}
                  className="block p-3 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate flex-1 mr-4">
                      {t.fileName}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
