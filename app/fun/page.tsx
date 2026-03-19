'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Heart, X, Star, RotateCcw } from 'lucide-react';

const PROFILE = {
  name: 'Michael',
  age: 28,
  distance: '2 km away',
  bio: 'Software Engineer | Dog lover | Will fix your bugs and your heart',
  tags: ['Ambitious', 'Funny', 'Loves Coffee', '6\'1"', 'Dog Dad'],
};

const SWIPE_THRESHOLD = 100;
const FLY_DURATION = 400;

const keyframeStyles = `
@keyframes card-enter {
  0% { opacity: 0; transform: scale(0.92) translateY(20px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes heart-float {
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-120px) scale(1.5); }
}
@keyframes match-overlay {
  0% { opacity: 0; transform: scale(0.8) translateY(30px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes match-bg {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
`;

export default function FindHusbandPage() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState({
    startX: 0,
    currentX: 0,
    isDragging: false,
  });
  const [flyDirection, setFlyDirection] = useState<'left' | 'right' | null>(null);
  const [cardKey, setCardKey] = useState(0);
  const [profilesViewed, setProfilesViewed] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<number[]>([]);

  const offsetX = dragState.isDragging ? dragState.currentX - dragState.startX : 0;
  const rotation = offsetX * 0.1;
  const likeOpacity = Math.min(Math.max(offsetX / SWIPE_THRESHOLD, 0), 1);
  const nopeOpacity = Math.min(Math.max(-offsetX / SWIPE_THRESHOLD, 0), 1);

  const resetCard = useCallback(() => {
    setFlyDirection(null);
    setCardKey((k) => k + 1);
    setProfilesViewed((n) => n + 1);
  }, []);

  const triggerSwipe = useCallback(
    (direction: 'left' | 'right') => {
      setDragState((s) => ({ ...s, isDragging: false }));
      setFlyDirection(direction);

      if (direction === 'right') {
        const shouldMatch = Math.random() < 0.3;
        if (shouldMatch) {
          setTimeout(() => setShowMatch(true), FLY_DURATION);
        } else {
          setTimeout(resetCard, FLY_DURATION);
        }
      } else {
        setTimeout(resetCard, FLY_DURATION);
      }
    },
    [resetCard],
  );

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragState({ startX: e.clientX, currentX: e.clientX, isDragging: true });
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState.isDragging) return;
      setDragState((s) => ({ ...s, currentX: e.clientX }));
    },
    [dragState.isDragging],
  );

  const onPointerUp = useCallback(() => {
    if (!dragState.isDragging) return;
    const dx = dragState.currentX - dragState.startX;

    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      triggerSwipe(dx > 0 ? 'right' : 'left');
    } else {
      setDragState((s) => ({ ...s, isDragging: false }));
    }
  }, [dragState, triggerSwipe]);

  const dismissMatch = useCallback(() => {
    setShowMatch(false);
    resetCard();
  }, [resetCard]);

  const spawnHeart = useCallback(() => {
    const id = Date.now();
    setFloatingHearts((h) => [...h, id]);
    setTimeout(() => setFloatingHearts((h) => h.filter((v) => v !== id)), 1200);
  }, []);

  useEffect(() => {
    if (showMatch) {
      const interval = setInterval(spawnHeart, 300);
      const timeout = setTimeout(() => clearInterval(interval), 2400);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [showMatch, spawnHeart]);

  const getFlyTransform = () => {
    if (flyDirection === 'left') return 'translateX(-150vw) rotate(-30deg)';
    if (flyDirection === 'right') return 'translateX(150vw) rotate(30deg)';
    return undefined;
  };

  const cardStyle: React.CSSProperties = flyDirection
    ? {
        transform: getFlyTransform(),
        transition: `transform ${FLY_DURATION}ms ease-in`,
      }
    : dragState.isDragging
      ? {
          transform: `translateX(${offsetX}px) rotate(${rotation}deg)`,
          cursor: 'grabbing',
          transition: 'none',
        }
      : {
          transform: 'translateX(0) rotate(0deg)',
          transition: 'transform 0.3s ease-out',
          cursor: 'grab',
        };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden select-none"
         style={{ background: 'linear-gradient(165deg, #ff6b6b 0%, #ee5a24 30%, #f0932b 60%, #ffbe76 100%)' }}>

      <style dangerouslySetInnerHTML={{ __html: keyframeStyles }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center"
               style={{ background: 'rgba(255,255,255,0.2)' }}>
            <span className="text-white text-lg">🔥</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">FindHim</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/70 text-xs font-medium">
            {profilesViewed} viewed
          </span>
        </div>
      </header>

      {/* Card Area */}
      <div className="flex-1 flex items-center justify-center px-4 pb-2">
        <div className="relative w-full max-w-[380px] aspect-[3/4.5]">
          {/* Shadow card behind to simulate stack */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.15)',
              transform: 'scale(0.95) translateY(12px)',
              borderRadius: '1rem',
            }}
          />
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.25)',
              transform: 'scale(0.975) translateY(6px)',
              borderRadius: '1rem',
            }}
          />

          {/* Main card */}
          <div
            ref={cardRef}
            key={cardKey}
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl"
            style={{
              ...cardStyle,
              animation: flyDirection ? undefined : 'card-enter 0.35s ease-out',
              touchAction: 'none',
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {/* Photo */}
            <img
              src="/michael.png"
              alt={PROFILE.name}
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />

            {/* Gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 35%, transparent 55%)',
              }}
            />

            {/* LIKE stamp */}
            <div
              className="absolute top-8 left-6 border-4 border-green-400 rounded-lg px-4 py-1 -rotate-12"
              style={{
                opacity: flyDirection === 'right' ? 1 : likeOpacity,
                transition: flyDirection ? 'none' : undefined,
              }}
            >
              <span className="text-green-400 font-black text-3xl tracking-wider">LIKE</span>
            </div>

            {/* NOPE stamp */}
            <div
              className="absolute top-8 right-6 border-4 border-red-400 rounded-lg px-4 py-1 rotate-12"
              style={{
                opacity: flyDirection === 'left' ? 1 : nopeOpacity,
                transition: flyDirection ? 'none' : undefined,
              }}
            >
              <span className="text-red-400 font-black text-3xl tracking-wider">NOPE</span>
            </div>

            {/* Profile info */}
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <div className="flex items-end gap-2 mb-1">
                <h2 className="text-3xl font-bold">{PROFILE.name}</h2>
                <span className="text-2xl font-light mb-0.5">{PROFILE.age}</span>
              </div>
              <p className="text-white/80 text-sm mb-3 flex items-center gap-1">
                <span>📍</span> {PROFILE.distance}
              </p>
              <p className="text-white/90 text-sm mb-3">{PROFILE.bio}</p>
              <div className="flex flex-wrap gap-1.5">
                {PROFILE.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="relative z-10 flex items-center justify-center gap-5 pb-8 pt-2">
        <button
          onClick={() => {
            setCardKey((k) => k + 1);
            setProfilesViewed(0);
          }}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-90"
          style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
          aria-label="Reset"
        >
          <RotateCcw className="w-5 h-5 text-white" />
        </button>

        <button
          onClick={() => triggerSwipe('left')}
          className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90"
          style={{ background: 'rgba(255,255,255,0.95)' }}
          aria-label="Nope"
        >
          <X className="w-8 h-8 text-red-500" strokeWidth={3} />
        </button>

        <button
          onClick={() => {
            spawnHeart();
            triggerSwipe('right');
          }}
          className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90"
          style={{ background: 'rgba(255,255,255,0.95)' }}
          aria-label="Like"
        >
          <Heart className="w-8 h-8 text-green-500 fill-green-500" strokeWidth={2} />
        </button>

        <button
          onClick={() => {
            spawnHeart();
            triggerSwipe('right');
          }}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-90"
          style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
          aria-label="Super Like"
        >
          <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
        </button>
      </div>

      {/* Floating hearts */}
      {floatingHearts.map((id) => (
        <div
          key={id}
          className="absolute pointer-events-none text-3xl"
          style={{
            left: `${30 + Math.random() * 40}%`,
            bottom: '20%',
            animation: 'heart-float 1.2s ease-out forwards',
          }}
        >
          ❤️
        </div>
      ))}

      {/* Match overlay */}
      {showMatch && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center"
          style={{ animation: 'match-bg 0.3s ease-out forwards' }}
          onClick={dismissMatch}
        >
          <div className="absolute inset-0"
               style={{ background: 'linear-gradient(to bottom, rgba(255,62,62,0.92), rgba(255,107,107,0.92))' }} />

          <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center"
               style={{ animation: 'match-overlay 0.5s ease-out forwards' }}>
            <h2 className="text-5xl font-black text-white tracking-tight"
                style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
              It&apos;s a Match!
            </h2>
            <p className="text-white/90 text-lg">
              You and <span className="font-bold">Michael</span> liked each other
            </p>

            <div className="flex items-center gap-4 my-4">
              <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden shadow-xl">
                <img src="/michael.png" alt="Michael" className="w-full h-full object-cover" />
              </div>
              <div className="text-white text-4xl">💕</div>
              <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden shadow-xl">
                <img src="/michael.png" alt="You" className="w-full h-full object-cover" />
              </div>
            </div>

            <button
              onClick={dismissMatch}
              className="mt-4 px-8 py-3 bg-white rounded-full text-lg font-bold shadow-xl transition-transform active:scale-95"
              style={{ color: '#ff3e3e' }}
            >
              Keep Swiping
            </button>

            <p className="text-white/60 text-sm mt-2">
              (Spoiler: it&apos;s still Michael)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
