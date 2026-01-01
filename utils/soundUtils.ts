
// Sound Utilities using Web Speech API

// Voices cache
let voices: SpeechSynthesisVoice[] = [];

// Try to load voices
if (typeof window !== 'undefined' && window.speechSynthesis) {
  const loadVoices = () => {
    voices = window.speechSynthesis.getVoices();
  };
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

export const speakText = (text: string, playerId: number) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // Cancel previous speech to avoid queue buildup
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';

  // --- Voice Personas ---
  
  // Player 0: 小赢 (Child/User) - Energetic, youthful
  if (playerId === 0) {
    utterance.pitch = 1.25; // Youthful but not squeaky
    utterance.rate = 1.2;
  }
  
  // Player 1: 老赢 (Dad) - Deep, calm, authoritative
  else if (playerId === 1) {
    utterance.pitch = 0.8; // Deep voice
    utterance.rate = 0.9; // Measured pace
  }
  
  // Player 2: 老输 (Mom) - Clear, slightly higher than Dad
  else if (playerId === 2) {
    utterance.pitch = 1.15; // Feminine range
    utterance.rate = 1.05;
  }

  // Attempt to select a Chinese voice (Preferably Google's if available for better quality)
  const chineseVoice = voices.find(v => v.lang === 'zh-CN' && v.name.includes('Google')) || 
                       voices.find(v => v.lang.includes('zh-CN') || v.lang.includes('cmn'));
                       
  if (chineseVoice) {
    utterance.voice = chineseVoice;
  }

  window.speechSynthesis.speak(utterance);
};
