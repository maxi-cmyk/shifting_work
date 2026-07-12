import { useEffect, useRef } from 'react';
import { createAudio } from '../audio';

export function useSound(soundEnabled: boolean) {
  const audioRef = useRef<ReturnType<typeof createAudio> | null>(null);

  useEffect(() => {
    audioRef.current = createAudio();
  }, []);

  return {
    playGateEngage: (gear: number) => {
      if (soundEnabled && audioRef.current) audioRef.current.playGateEngage(gear);
    },
    playNeutralClick: () => {
      if (soundEnabled && audioRef.current) audioRef.current.playNeutralClick();
    },
    playSessionStart: () => {
      if (soundEnabled && audioRef.current) audioRef.current.playSessionStart();
    },
    playSessionEnd: () => {
      if (soundEnabled && audioRef.current) audioRef.current.playSessionEnd();
    },
    playRecommendation: () => {
      if (soundEnabled && audioRef.current) audioRef.current.playRecommendation();
    },
    playShiftClick: () => {
      if (soundEnabled && audioRef.current) audioRef.current.playShiftClick();
    },
  };
}
