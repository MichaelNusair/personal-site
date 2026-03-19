'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Download,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  AlertCircle,
  CheckCircle,
  Keyboard,
  ChevronLeft,
  ChevronRight,
  Clock,
  XCircle,
} from 'lucide-react';

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

interface Word {
  word: string;
  start: number;
  end: number;
  probability: number;
}

interface Segment {
  id: number;
  start: number;
  end: number;
  text: string;
  words: Word[];
}

interface Chunk {
  id: string;
  index: number;
  startTime: number;
  endTime: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  segments: Segment[] | null;
  correctedSegments: Segment[] | null;
  errorMessage: string | null;
}

interface Transcription {
  id: string;
  fileName: string;
  fileSize: number | null;
  duration: number | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalChunks: number | null;
  chunks: Chunk[];
  errorMessage: string | null;
  audioUrl: string | null;
}

const CONFIDENCE_THRESHOLDS = { LOW: 0.7, MEDIUM: 0.85 };

function getConfidenceClass(probability: number): string {
  if (probability < CONFIDENCE_THRESHOLDS.LOW) {
    return 'bg-red-100 dark:bg-red-900/30 border-b-2 border-red-400';
  }
  if (probability < CONFIDENCE_THRESHOLDS.MEDIUM) {
    return 'bg-yellow-100 dark:bg-yellow-900/30 border-b-2 border-yellow-400';
  }
  return '';
}

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function TranscriptionEditorPage() {
  const params = useParams();
  const id = params.id as string;

  const [transcription, setTranscription] = useState<Transcription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChunkIndex, setActiveChunkIndex] = useState(0);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedWordIndex, setSelectedWordIndex] = useState<{
    segmentId: number;
    wordIndex: number;
  } | null>(null);
  const [editingWord, setEditingWord] = useState<string | null>(null);
  const [editingSegmentId, setEditingSegmentId] = useState<number | null>(null);
  const [editingSegmentText, setEditingSegmentText] = useState<string>('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [chunkInputValue, setChunkInputValue] = useState('1');

  const audioRef = useRef<HTMLAudioElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const segmentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const wordRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const currentWordRef = useRef<HTMLSpanElement | null>(null);

  const activeChunk = transcription?.chunks[activeChunkIndex];
  const completedChunks = transcription?.chunks.filter((c) => c.status === 'COMPLETED').length || 0;
  const totalChunks = transcription?.totalChunks || transcription?.chunks.length || 0;

  const fetchTranscription = useCallback(async () => {
    try {
      const response = await fetch(`/api/f/${id}`);
      if (!response.ok) throw new Error('Failed to fetch transcription');
      const data: Transcription = await response.json();
      
      // Preserve existing audioUrl to prevent audio element reload
      setTranscription((prev) => ({
        ...data,
        audioUrl: prev?.audioUrl || data.audioUrl,
      }));

      // Load segments for active chunk
      const chunk = data.chunks[activeChunkIndex];
      if (chunk?.status === 'COMPLETED') {
        const segs = (chunk.correctedSegments || chunk.segments || []) as Segment[];
        setSegments(segs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [id, activeChunkIndex]);

  useEffect(() => {
    fetchTranscription();
  }, [fetchTranscription]);

  // Poll while processing
  useEffect(() => {
    const hasProcessing = transcription?.chunks.some(
      (c) => c.status === 'PENDING' || c.status === 'PROCESSING'
    );
    if (hasProcessing) {
      const interval = setInterval(fetchTranscription, 3000);
      return () => clearInterval(interval);
    }
  }, [transcription?.chunks, fetchTranscription]);

  // Load segments when active chunk changes
  useEffect(() => {
    if (activeChunk?.status === 'COMPLETED') {
      const segs = (activeChunk.correctedSegments || activeChunk.segments || []) as Segment[];
      setSegments(segs);
      setSelectedWordIndex(null);
      setEditingWord(null);
      setEditingSegmentId(null);
    }
  }, [activeChunk]);

  // Sync audio to chunk start time when changing chunks
  useEffect(() => {
    if (activeChunk && audioRef.current) {
      audioRef.current.currentTime = activeChunk.startTime;
      setCurrentTime(activeChunk.startTime);
    }
    setChunkInputValue(String(activeChunkIndex + 1));
  }, [activeChunkIndex, activeChunk?.startTime]);

  // Apply playback rate and volume to audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.volume = volume;
    }
  }, [playbackRate, volume]);

  // Find current word being spoken for highlighting
  const currentWordKey = useMemo(() => {
    if (!isPlaying) return null;
    for (const seg of segments) {
      for (let i = 0; i < seg.words.length; i++) {
        const w = seg.words[i];
        if (currentTime >= w.start && currentTime < w.end) {
          return `${seg.id}-${i}`;
        }
      }
    }
    return null;
  }, [segments, currentTime, isPlaying]);

  // Auto-scroll to current word during playback
  useEffect(() => {
    if (currentWordKey && isPlaying) {
      const el = wordRefs.current.get(currentWordKey);
      if (el && el !== currentWordRef.current) {
        currentWordRef.current = el;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentWordKey, isPlaying]);

  // Audio time update
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [transcription?.audioUrl]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingWord !== null || editingSegmentId !== null) {
        if (e.key === 'Escape') {
          setEditingWord(null);
          setEditingSegmentId(null);
          setSelectedWordIndex(null);
        }
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        navigateToNextLowConfidence(e.shiftKey ? -1 : 1);
      } else if (e.key === ' ' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'Enter' && selectedWordIndex) {
        e.preventDefault();
        startEditing();
      } else if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts((p) => !p);
      } else if (e.key === 'ArrowRight' && e.altKey) {
        e.preventDefault();
        goToNextChunk();
      } else if (e.key === 'ArrowLeft' && e.altKey) {
        e.preventDefault();
        goToPrevChunk();
      } else if (e.key === '[') {
        e.preventDefault();
        const currentIdx = PLAYBACK_RATES.indexOf(playbackRate);
        if (currentIdx > 0) setPlaybackRate(PLAYBACK_RATES[currentIdx - 1]);
      } else if (e.key === ']') {
        e.preventDefault();
        const currentIdx = PLAYBACK_RATES.indexOf(playbackRate);
        if (currentIdx < PLAYBACK_RATES.length - 1) setPlaybackRate(PLAYBACK_RATES[currentIdx + 1]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWordIndex, editingWord, editingSegmentId, segments, activeChunkIndex, transcription, playbackRate]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause();
    else audio.play();
    setIsPlaying(!isPlaying);
  };

  const seekToTime = (time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleWordClick = (segmentId: number, wordIndex: number, word: Word) => {
    setSelectedWordIndex({ segmentId, wordIndex });
    seekToTime(word.start);
  };

  const startEditing = () => {
    if (!selectedWordIndex) return;
    const segment = segments.find((s) => s.id === selectedWordIndex.segmentId);
    const word = segment?.words[selectedWordIndex.wordIndex];
    if (word) {
      setEditingWord(word.word);
      setTimeout(() => editInputRef.current?.focus(), 0);
    }
  };

  const saveWordEdit = () => {
    if (!selectedWordIndex || editingWord === null) return;
    setSegments((prev) =>
      prev.map((segment) => {
        if (segment.id !== selectedWordIndex.segmentId) return segment;
        const newWords = [...segment.words];
        newWords[selectedWordIndex.wordIndex] = {
          ...newWords[selectedWordIndex.wordIndex],
          word: editingWord,
          probability: 1.0,
        };
        return { ...segment, words: newWords, text: newWords.map((w) => w.word).join(' ') };
      })
    );
    setEditingWord(null);
    setHasUnsavedChanges(true);
    navigateToNextLowConfidence(1);
  };

  const navigateToNextLowConfidence = (direction: 1 | -1) => {
    const allWords: { segmentId: number; wordIndex: number; prob: number }[] = [];
    segments.forEach((seg) => {
      seg.words.forEach((word, idx) => {
        allWords.push({ segmentId: seg.id, wordIndex: idx, prob: word.probability });
      });
    });
    const lowConf = allWords.filter((w) => w.prob < CONFIDENCE_THRESHOLDS.MEDIUM);
    if (lowConf.length === 0) return;

    let currentIdx = selectedWordIndex
      ? lowConf.findIndex(
        (w) => w.segmentId === selectedWordIndex.segmentId && w.wordIndex === selectedWordIndex.wordIndex
      )
      : -1;

    let nextIdx = currentIdx === -1 ? (direction === 1 ? 0 : lowConf.length - 1) : currentIdx + direction;
    if (nextIdx < 0) nextIdx = lowConf.length - 1;
    if (nextIdx >= lowConf.length) nextIdx = 0;

    const next = lowConf[nextIdx];
    setSelectedWordIndex({ segmentId: next.segmentId, wordIndex: next.wordIndex });

    const seg = segments.find((s) => s.id === next.segmentId);
    if (seg?.words[next.wordIndex]) seekToTime(seg.words[next.wordIndex].start);

    const key = `${next.segmentId}-${next.wordIndex}`;
    wordRefs.current.get(key)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const saveChanges = async () => {
    if (!activeChunk) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/f/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chunkId: activeChunk.id, correctedSegments: segments }),
      });
      if (!response.ok) throw new Error('Failed to save');
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const goToNextChunk = () => {
    if (transcription && activeChunkIndex < transcription.chunks.length - 1) {
      if (hasUnsavedChanges) saveChanges();
      setActiveChunkIndex((i) => i + 1);
    }
  };

  const goToPrevChunk = () => {
    if (activeChunkIndex > 0) {
      if (hasUnsavedChanges) saveChanges();
      setActiveChunkIndex((i) => i - 1);
    }
  };

  const goToChunk = (index: number) => {
    if (transcription && index >= 0 && index < transcription.chunks.length) {
      if (hasUnsavedChanges) saveChanges();
      setActiveChunkIndex(index);
    }
  };

  const handleChunkInputChange = (value: string) => {
    setChunkInputValue(value);
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1 && num <= totalChunks) {
      goToChunk(num - 1);
    }
  };

  const startEditingSegment = (segmentId: number, text: string) => {
    setEditingSegmentId(segmentId);
    setEditingSegmentText(text);
    setTimeout(() => segmentTextareaRef.current?.focus(), 0);
  };

  const saveSegmentEdit = () => {
    if (editingSegmentId === null) return;
    setSegments((prev) =>
      prev.map((segment) => {
        if (segment.id !== editingSegmentId) return segment;
        return { ...segment, text: editingSegmentText };
      })
    );
    setEditingSegmentId(null);
    setHasUnsavedChanges(true);
  };

  const handleExport = (format: string) => {
    window.open(`/api/f/${id}/export?format=${format}`, '_blank');
  };

  const cancelTranscription = async () => {
    if (!confirm('Are you sure you want to cancel this transcription? This cannot be undone.')) {
      return;
    }
    setCancelling(true);
    try {
      const response = await fetch(`/api/f/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to cancel');
      await fetchTranscription();
    } catch (err) {
      console.error('Cancel error:', err);
    } finally {
      setCancelling(false);
    }
  };

  const isProcessing = transcription?.chunks.some(
    (c) => c.status === 'PENDING' || c.status === 'PROCESSING'
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !transcription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Error</h1>
          <p className="text-muted-foreground">{error || 'Transcription not found'}</p>
          <Link href="/f" className="text-primary hover:underline mt-4 inline-block">
            Go back
          </Link>
        </div>
      </div>
    );
  }

  const lowConfCount = segments.reduce(
    (acc, seg) => acc + seg.words.filter((w) => w.probability < CONFIDENCE_THRESHOLDS.MEDIUM).length,
    0
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/f" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="hidden sm:block">
              <h1 className="font-medium truncate max-w-[200px]">{transcription.fileName}</h1>
              <p className="text-xs text-muted-foreground">
                {completedChunks}/{totalChunks} chunks ready
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowShortcuts(true)} className="p-2 hover:bg-muted rounded-lg" title="Shortcuts">
              <Keyboard className="h-4 w-4" />
            </button>
            {isProcessing && (
              <button
                onClick={cancelTranscription}
                disabled={cancelling}
                className="inline-flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm font-medium hover:bg-destructive/20 disabled:opacity-50"
                title="Cancel transcription"
              >
                {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Cancel
              </button>
            )}
            {hasUnsavedChanges && (
              <button
                onClick={saveChanges}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Save
              </button>
            )}
            <div className="relative group">
              <button className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted/80">
                <Download className="h-4 w-4" />
                Export
              </button>
              <div className="absolute right-0 top-full mt-1 bg-card border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                {['txt', 'srt', 'vtt', 'json'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleExport(fmt)}
                    className="block w-full px-4 py-2 text-sm text-left hover:bg-muted whitespace-nowrap"
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chunk Progress Bar */}
      {totalChunks > 1 && (
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevChunk}
                disabled={activeChunkIndex === 0}
                className="p-1 hover:bg-muted rounded disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Show progress bar only if chunks <= 50, otherwise just show input */}
              {totalChunks <= 50 ? (
                <div className="flex-1 flex gap-1">
                  {transcription.chunks.map((chunk, idx) => (
                    <button
                      key={chunk.id}
                      onClick={() => goToChunk(idx)}
                      className={`flex-1 h-2 rounded-full transition-all ${chunk.status === 'COMPLETED'
                        ? idx === activeChunkIndex
                          ? 'bg-primary'
                          : 'bg-green-500'
                        : chunk.status === 'PROCESSING'
                          ? 'bg-yellow-500 animate-pulse'
                          : chunk.status === 'FAILED'
                            ? 'bg-red-500'
                            : 'bg-muted'
                        }`}
                      title={`Chunk ${idx + 1}: ${chunk.status}`}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center gap-2">
                  <span className="text-sm text-muted-foreground">Chunk</span>
                  <input
                    type="number"
                    min={1}
                    max={totalChunks}
                    value={chunkInputValue}
                    onChange={(e) => handleChunkInputChange(e.target.value)}
                    onBlur={() => setChunkInputValue(String(activeChunkIndex + 1))}
                    className="w-16 px-2 py-1 text-sm border rounded bg-background text-center"
                  />
                  <span className="text-sm text-muted-foreground">of {totalChunks}</span>
                </div>
              )}

              <button
                onClick={goToNextChunk}
                disabled={activeChunkIndex >= transcription.chunks.length - 1}
                className="p-1 hover:bg-muted rounded disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              {totalChunks <= 50 ? (
                <div className="flex items-center gap-2">
                  <span>Chunk</span>
                  <input
                    type="number"
                    min={1}
                    max={totalChunks}
                    value={chunkInputValue}
                    onChange={(e) => handleChunkInputChange(e.target.value)}
                    onBlur={() => setChunkInputValue(String(activeChunkIndex + 1))}
                    className="w-12 px-1 py-0.5 text-xs border rounded bg-background text-center"
                  />
                  <span>of {totalChunks}</span>
                </div>
              ) : (
                <span>
                  {completedChunks} of {totalChunks} completed
                </span>
              )}
              {activeChunk && (
                <span>
                  {formatTime(activeChunk.startTime)} - {formatTime(activeChunk.endTime)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Audio Player */}
      {transcription.audioUrl && (
        <div className="border-b bg-muted/30 sticky top-[57px] z-10">
          <div className="container mx-auto px-4 py-3">
            <audio ref={audioRef} src={transcription.audioUrl} preload="metadata" />
            <div className="flex items-center gap-2 sm:gap-4">
              <button onClick={() => seekToTime(Math.max(0, currentTime - 5))} className="p-2 hover:bg-muted rounded-full" title="Back 5s">
                <SkipBack className="h-4 w-4" />
              </button>
              <button onClick={togglePlayPause} className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90">
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              <button
                onClick={() => seekToTime(Math.min(transcription.duration || 0, currentTime + 5))}
                className="p-2 hover:bg-muted rounded-full"
                title="Forward 5s"
              >
                <SkipForward className="h-4 w-4" />
              </button>
              
              <div className="flex-1 flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-12 text-right">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={transcription.duration || 0}
                  value={currentTime}
                  onChange={(e) => seekToTime(Number(e.target.value))}
                  className="flex-1 h-2 bg-muted rounded-full appearance-none cursor-pointer"
                />
                <span className="text-sm text-muted-foreground w-12">{formatTime(transcription.duration || 0)}</span>
              </div>

              {/* Playback Speed */}
              <div className="relative group">
                <button className="px-2 py-1 text-sm font-medium hover:bg-muted rounded" title="Playback speed">
                  {playbackRate}x
                </button>
                <div className="absolute right-0 bottom-full mb-1 bg-card border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                  {PLAYBACK_RATES.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setPlaybackRate(rate)}
                      className={`block w-full px-4 py-2 text-sm text-left hover:bg-muted whitespace-nowrap ${rate === playbackRate ? 'bg-muted font-medium' : ''}`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume Control */}
              <div className="relative">
                <button
                  onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                  className="p-2 hover:bg-muted rounded-full"
                  title="Volume"
                >
                  {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                {showVolumeSlider && (
                  <div className="absolute right-0 bottom-full mb-2 bg-card border rounded-lg shadow-lg p-3 z-20">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-24 h-2 bg-muted rounded-full appearance-none cursor-pointer"
                    />
                    <div className="text-xs text-center mt-1 text-muted-foreground">
                      {Math.round(volume * 100)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chunk Content */}
      {activeChunk?.status === 'COMPLETED' ? (
        <>
          {/* Stats */}
          <div className="border-b bg-card">
            <div className="container mx-auto px-4 py-2 flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                {segments.reduce((a, s) => a + (s.words.length > 0 ? s.words.length : s.text.split(/\s+/).filter(Boolean).length), 0)} words
              </span>
              {lowConfCount > 0 && <span className="text-yellow-600">{lowConfCount} need review</span>}
              {lowConfCount > 0 && (
                <button onClick={() => navigateToNextLowConfidence(1)} className="text-primary hover:underline">
                  Jump to next (Tab)
                </button>
              )}
            </div>
          </div>

          {/* Editor */}
          <main className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="space-y-6">
              {segments.map((segment) => (
                <div key={segment.id} className="group">
                  <button
                    className="text-xs text-muted-foreground mb-1 hover:text-primary cursor-pointer"
                    onClick={() => seekToTime(segment.start)}
                    title="Click to jump to this time"
                  >
                    {formatTime(segment.start)}
                  </button>
                  <p className="leading-relaxed">
                    {segment.words.length > 0 ? (
                      segment.words.map((word, wordIndex) => {
                        const isSelected =
                          selectedWordIndex?.segmentId === segment.id && selectedWordIndex?.wordIndex === wordIndex;
                        const isEditing = isSelected && editingWord !== null;
                        const key = `${segment.id}-${wordIndex}`;
                        const isCurrent = currentWordKey === key;

                        if (isEditing) {
                          return (
                            <input
                              key={key}
                              ref={editInputRef}
                              type="text"
                              value={editingWord}
                              onChange={(e) => setEditingWord(e.target.value)}
                              onBlur={saveWordEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  saveWordEdit();
                                } else if (e.key === 'Escape') {
                                  setEditingWord(null);
                                  setSelectedWordIndex(null);
                                }
                              }}
                              className="inline-block px-1 py-0.5 border-2 border-primary rounded bg-background outline-none min-w-[60px]"
                              style={{ width: `${Math.max(60, editingWord.length * 10)}px` }}
                            />
                          );
                        }

                        return (
                          <span
                            key={key}
                            ref={(el) => {
                              if (el) wordRefs.current.set(key, el);
                            }}
                            onClick={() => handleWordClick(segment.id, wordIndex, word)}
                            onDoubleClick={() => {
                              handleWordClick(segment.id, wordIndex, word);
                              setTimeout(startEditing, 0);
                            }}
                            className={`inline cursor-pointer rounded px-0.5 transition-all ${getConfidenceClass(word.probability)} ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''} ${isCurrent ? 'bg-primary/30 font-medium' : ''} hover:bg-muted`}
                            title={`Confidence: ${Math.round(word.probability * 100)}%`}
                          >
                            {word.word}
                          </span>
                        );
                      })
                    ) : editingSegmentId === segment.id ? (
                      <textarea
                        ref={segmentTextareaRef}
                        value={editingSegmentText}
                        onChange={(e) => setEditingSegmentText(e.target.value)}
                        onBlur={saveSegmentEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setEditingSegmentId(null);
                          } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            saveSegmentEdit();
                          }
                        }}
                        className="w-full px-2 py-1 border-2 border-primary rounded bg-background outline-none resize-none min-h-[60px]"
                        rows={Math.max(2, Math.ceil(editingSegmentText.length / 80))}
                      />
                    ) : (
                      <span
                        className="text-foreground cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1"
                        onClick={() => seekToTime(segment.start)}
                        onDoubleClick={() => startEditingSegment(segment.id, segment.text)}
                        title="Double-click to edit"
                      >
                        {segment.text}
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-12 p-4 bg-muted/30 rounded-lg">
              <h3 className="font-medium mb-2">Confidence Legend</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 border-b-2 border-red-400 rounded">Low</span>
                  <span className="text-muted-foreground">&lt; 70%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 border-b-2 border-yellow-400 rounded">
                    Medium
                  </span>
                  <span className="text-muted-foreground">70-85%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-muted rounded">High</span>
                  <span className="text-muted-foreground">&gt; 85%</span>
                </div>
              </div>
            </div>
          </main>
        </>
      ) : activeChunk?.status === 'PROCESSING' || activeChunk?.status === 'PENDING' ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-lg font-medium mb-2">Processing chunk {activeChunkIndex + 1}...</h2>
            <p className="text-muted-foreground text-sm">
              {formatTime(activeChunk?.startTime || 0)} - {formatTime(activeChunk?.endTime || 0)}
            </p>
            {completedChunks > 0 && (
              <button onClick={goToPrevChunk} className="mt-4 text-primary hover:underline text-sm">
                Review previous chunk while waiting
              </button>
            )}
          </div>
        </div>
      ) : activeChunk?.status === 'FAILED' ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-medium mb-2">Chunk {activeChunkIndex + 1} failed</h2>
            <p className="text-muted-foreground text-sm">{activeChunk.errorMessage || 'Unknown error'}</p>
          </div>
        </div>
      ) : null}

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShortcuts(false)}>
          <div className="bg-card rounded-xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Keyboard Shortcuts</h2>
            <div className="space-y-3 text-sm">
              {[
                ['Play/Pause', 'Space'],
                ['Next low-confidence', 'Tab'],
                ['Previous low-confidence', 'Shift+Tab'],
                ['Edit selected word', 'Enter'],
                ['Save segment edit', 'Ctrl+Enter'],
                ['Cancel editing', 'Escape'],
                ['Next chunk', 'Alt+Right'],
                ['Previous chunk', 'Alt+Left'],
                ['Slower playback', '['],
                ['Faster playback', ']'],
                ['Show shortcuts', '?'],
              ].map(([action, key]) => (
                <div key={`${action}-${key}`} className="flex justify-between">
                  <span className="text-muted-foreground">{action}</span>
                  <kbd className="px-2 py-1 bg-muted rounded">{key}</kbd>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowShortcuts(false)}
              className="mt-6 w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:bg-primary/90"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
