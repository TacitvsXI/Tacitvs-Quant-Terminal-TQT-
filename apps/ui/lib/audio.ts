/**
 * 🔷 TEZERAKT - Quant Terminal - Audio System
 * Web Audio API for system sounds and feedback
 */

type BeepEvent = 
  | 'sim_start'      // Simulation start
  | 'sim_done'       // Simulation complete
  | 'order_exec'     // Order executed
  | 'error'          // Error alert
  | 'theme_switch'   // Theme changed
  | 'command'        // Command executed
  | 'focus';         // Focus/nav sound

const SOUND_MAP: Record<BeepEvent, { freq: number; duration: number; type?: OscillatorType }> = {
  sim_start: { freq: 880, duration: 70, type: 'square' },
  sim_done: { freq: 660, duration: 100, type: 'square' },
  order_exec: { freq: 1200, duration: 50, type: 'square' },
  error: { freq: 200, duration: 150, type: 'square' },
  theme_switch: { freq: 440, duration: 60, type: 'sine' },
  command: { freq: 550, duration: 40, type: 'sine' },
  focus: { freq: 330, duration: 30, type: 'sine' },
};

let audioContext: AudioContext | null = null;

/**
 * Initialize AudioContext (lazy)
 */
function getAudioContext(): AudioContext {
  if (!audioContext && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioContext = new AudioContextClass();
    }
  }
  return audioContext!;
}

/**
 * Play a beep sound
 */
export function playBeep(
  event: BeepEvent,
  enabled: boolean = true
): void {
  if (!enabled || typeof window === 'undefined') return;
  
  try {
    const ctx = getAudioContext();
    const config = SOUND_MAP[event];
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = config.type || 'square';
    oscillator.frequency.value = config.freq;
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Envelope: quick attack, exponential decay
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.3, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + config.duration / 1000);
    
    oscillator.start(now);
    oscillator.stop(now + config.duration / 1000 + 0.02);
  } catch (error) {
    console.warn('Audio playback failed:', error);
  }
}

/**
 * Play double beep (for completed actions)
 */
export function playDoubleBeep(enabled: boolean = true): void {
  if (!enabled) return;
  
  playBeep('sim_done', enabled);
  setTimeout(() => playBeep('sim_start', enabled), 120);
}

/**
 * Play error buzz
 */
export function playErrorSound(enabled: boolean = true): void {
  if (!enabled) return;
  
  playBeep('error', enabled);
  setTimeout(() => playBeep('error', enabled), 150);
}

