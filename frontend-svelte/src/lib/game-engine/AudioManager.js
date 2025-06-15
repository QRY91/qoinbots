/**
 * QOIN Audio Manager
 * Handles all game audio including sound effects, notifications, and ambient sounds
 */

class AudioManager {
  constructor() {
    this.enabled = true;
    this.volume = {
      master: 0.7,
      sfx: 0.8,
      ui: 0.6,
      ambient: 0.3,
    };

    // Audio context for advanced audio features
    this.audioContext = null;
    this.audioBuffers = new Map();
    this.activeSounds = new Set();

    // Sound definitions
    this.sounds = {
      // UI Sounds
      buttonClick: { frequency: 800, duration: 0.1, type: "ui" },
      buttonHover: { frequency: 600, duration: 0.05, type: "ui" },
      modalOpen: { frequency: 400, duration: 0.2, type: "ui" },
      modalClose: { frequency: 300, duration: 0.15, type: "ui" },

      // Trading Sounds
      tradeBuy: { frequency: 880, duration: 0.3, type: "sfx" },
      tradeSell: { frequency: 660, duration: 0.3, type: "sfx" },
      tradeProfit: {
        frequencies: [523, 659, 784], // C, E, G chord
        duration: 0.5,
        type: "sfx",
      },
      tradeLoss: {
        frequencies: [440, 370, 330], // Descending sad notes
        duration: 0.4,
        type: "sfx",
      },

      // Bot Sounds
      botSpeak: { frequency: 450, duration: 0.2, type: "sfx" },
      botMoodChange: { frequency: 500, duration: 0.25, type: "sfx" },
      botUnlock: {
        frequencies: [523, 659, 784, 1047], // Rising scale
        duration: 0.8,
        type: "sfx",
      },

      // Market Events
      marketTick: { frequency: 200, duration: 0.05, type: "ambient" },
      phaseChange: { frequency: 350, duration: 0.4, type: "sfx" },
      bubbleGrow: { frequency: 400, duration: 0.3, type: "ambient" },
      marketCrash: {
        frequencies: [800, 600, 400, 200], // Dramatic fall
        duration: 1.2,
        type: "sfx",
      },

      // Achievement Sounds
      achievement: {
        frequencies: [659, 784, 988, 1319], // E, G, B, E
        duration: 1.0,
        type: "sfx",
      },
      levelUp: {
        frequencies: [523, 659, 784, 1047, 1319], // Major scale up
        duration: 1.2,
        type: "sfx",
      },

      // Ambient/Background
      tradingAmbient: { frequency: 60, duration: 0.1, type: "ambient" },
      philosophicalHum: { frequency: 80, duration: 2.0, type: "ambient" },
    };

    // Initialize audio context
    this.initializeAudio();

    // Bind methods
    this.handleUserInteraction = this.handleUserInteraction.bind(this);
  }

  /**
   * Initialize Web Audio API
   */
  async initializeAudio() {
    try {
      // Create audio context (handle browser prefixes)
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioContext = new AudioContext();

        // Audio context starts suspended, need user interaction
        if (this.audioContext.state === "suspended") {
          document.addEventListener("click", this.handleUserInteraction, {
            once: true,
          });
          document.addEventListener("keydown", this.handleUserInteraction, {
            once: true,
          });
        }
      } else {
        console.warn(
          "Web Audio API not supported, falling back to basic audio",
        );
      }
    } catch (error) {
      console.warn("Failed to initialize audio context:", error);
    }
  }

  /**
   * Handle user interaction to resume audio context
   */
  async handleUserInteraction() {
    if (this.audioContext && this.audioContext.state === "suspended") {
      try {
        await this.audioContext.resume();
        console.log("Audio context resumed");
      } catch (error) {
        console.warn("Failed to resume audio context:", error);
      }
    }
  }

  /**
   * Set master audio enabled/disabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;

    if (!enabled) {
      this.stopAllSounds();
    }
  }

  /**
   * Set volume for a category
   */
  setVolume(category, volume) {
    if (this.volume.hasOwnProperty(category)) {
      this.volume[category] = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Get effective volume for a sound type
   */
  getEffectiveVolume(soundType) {
    const categoryVolume = this.volume[soundType] || 1.0;
    return this.volume.master * categoryVolume;
  }

  /**
   * Create an oscillator for basic sound synthesis
   */
  createOscillator(frequency, duration, volume = 1.0) {
    if (!this.audioContext || !this.enabled) return null;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      // Connect oscillator to gain to audio context destination
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configure oscillator
      oscillator.frequency.setValueAtTime(
        frequency,
        this.audioContext.currentTime,
      );
      oscillator.type = "sine"; // Default to sine wave

      // Configure gain (volume envelope)
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.01); // Quick attack
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration); // Decay

      return { oscillator, gainNode, duration };
    } catch (error) {
      console.warn("Failed to create oscillator:", error);
      return null;
    }
  }

  /**
   * Play a synthesized sound
   */
  playSound(soundName, volumeMultiplier = 1.0) {
    if (!this.enabled || !this.audioContext) return;

    const soundDef = this.sounds[soundName];
    if (!soundDef) {
      console.warn(`Unknown sound: ${soundName}`);
      return;
    }

    const effectiveVolume =
      this.getEffectiveVolume(soundDef.type) * volumeMultiplier;

    if (effectiveVolume <= 0) return;

    try {
      if (soundDef.frequencies) {
        // Multi-frequency sound (chord or sequence)
        this.playMultiFrequencySound(soundDef, effectiveVolume);
      } else {
        // Single frequency sound
        this.playSingleFrequencySound(soundDef, effectiveVolume);
      }
    } catch (error) {
      console.warn(`Failed to play sound ${soundName}:`, error);
    }
  }

  /**
   * Play a single frequency sound
   */
  playSingleFrequencySound(soundDef, volume) {
    const sound = this.createOscillator(
      soundDef.frequency,
      soundDef.duration,
      volume,
    );
    if (!sound) return;

    const { oscillator, duration } = sound;

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);

    // Track active sound
    this.activeSounds.add(oscillator);

    // Clean up when done
    oscillator.onended = () => {
      this.activeSounds.delete(oscillator);
    };
  }

  /**
   * Play a multi-frequency sound (chord or sequence)
   */
  playMultiFrequencySound(soundDef, volume) {
    const frequencies = soundDef.frequencies;
    const totalDuration = soundDef.duration;
    const isChord = soundDef.type !== "sequence"; // Play simultaneously vs sequentially

    if (isChord) {
      // Play all frequencies at once (chord)
      frequencies.forEach((freq, index) => {
        const sound = this.createOscillator(
          freq,
          totalDuration,
          volume / frequencies.length,
        );
        if (sound) {
          const { oscillator } = sound;
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + totalDuration);
          this.activeSounds.add(oscillator);

          oscillator.onended = () => {
            this.activeSounds.delete(oscillator);
          };
        }
      });
    } else {
      // Play frequencies in sequence
      const noteDuration = totalDuration / frequencies.length;
      frequencies.forEach((freq, index) => {
        const startTime = this.audioContext.currentTime + index * noteDuration;
        const sound = this.createOscillator(freq, noteDuration, volume);
        if (sound) {
          const { oscillator } = sound;
          oscillator.start(startTime);
          oscillator.stop(startTime + noteDuration);
          this.activeSounds.add(oscillator);

          oscillator.onended = () => {
            this.activeSounds.delete(oscillator);
          };
        }
      });
    }
  }

  /**
   * Stop all currently playing sounds
   */
  stopAllSounds() {
    this.activeSounds.forEach((oscillator) => {
      try {
        oscillator.stop();
      } catch (error) {
        // Oscillator might already be stopped
      }
    });
    this.activeSounds.clear();
  }

  /**
   * Game-specific sound methods
   */

  playWelcome() {
    this.playSound("achievement");
  }

  playTradeSound(isProfit) {
    if (isProfit) {
      this.playSound("tradeProfit");
    } else {
      this.playSound("tradeLoss");
    }
  }

  playBotSpeak() {
    this.playSound("botSpeak", 0.5);
  }

  playBotUnlock() {
    this.playSound("botUnlock");
  }

  playMarketCrash() {
    this.playSound("marketCrash");
  }

  playAchievement() {
    this.playSound("achievement");
  }

  playPhaseChange() {
    this.playSound("phaseChange");
  }

  playButtonClick() {
    this.playSound("buttonClick", 0.3);
  }

  playButtonHover() {
    this.playSound("buttonHover", 0.2);
  }

  playModalOpen() {
    this.playSound("modalOpen");
  }

  playModalClose() {
    this.playSound("modalClose");
  }

  /**
   * Ambient sound management
   */
  startAmbientSound(soundName, interval = 5000) {
    if (!this.enabled) return;

    const playAmbient = () => {
      if (this.enabled) {
        this.playSound(soundName, 0.3);
        setTimeout(playAmbient, interval + (Math.random() * 2000 - 1000)); // Add randomness
      }
    };

    // Start after a random delay
    setTimeout(playAmbient, Math.random() * interval);
  }

  /**
   * Advanced audio effects
   */

  /**
   * Create a frequency sweep effect
   */
  createFrequencySweep(startFreq, endFreq, duration, volume = 0.5) {
    if (!this.audioContext || !this.enabled) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      const now = this.audioContext.currentTime;
      const effectiveVolume = this.getEffectiveVolume("sfx") * volume;

      // Frequency sweep
      oscillator.frequency.setValueAtTime(startFreq, now);
      oscillator.frequency.exponentialRampToValueAtTime(
        endFreq,
        now + duration,
      );

      // Volume envelope
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(effectiveVolume, now + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

      oscillator.start(now);
      oscillator.stop(now + duration);

      this.activeSounds.add(oscillator);
      oscillator.onended = () => {
        this.activeSounds.delete(oscillator);
      };
    } catch (error) {
      console.warn("Failed to create frequency sweep:", error);
    }
  }

  /**
   * Create a bubble pop effect
   */
  playBubblePop() {
    this.createFrequencySweep(800, 200, 0.3, 0.4);
  }

  /**
   * Create a rising excitement effect
   */
  playExcitement() {
    this.createFrequencySweep(200, 1000, 0.8, 0.6);
  }

  /**
   * Diagnostic and utility methods
   */

  /**
   * Test all sounds
   */
  testAllSounds() {
    if (!this.enabled) {
      console.log("Audio is disabled");
      return;
    }

    console.log("Testing all sounds...");
    const soundNames = Object.keys(this.sounds);

    soundNames.forEach((soundName, index) => {
      setTimeout(() => {
        console.log(`Playing: ${soundName}`);
        this.playSound(soundName);
      }, index * 500);
    });
  }

  /**
   * Get audio context state info
   */
  getAudioInfo() {
    return {
      enabled: this.enabled,
      audioContextState: this.audioContext?.state || "not available",
      activeSounds: this.activeSounds.size,
      volumes: { ...this.volume },
      soundsAvailable: Object.keys(this.sounds).length,
    };
  }

  /**
   * Cleanup method
   */
  destroy() {
    this.stopAllSounds();

    if (this.audioContext) {
      this.audioContext.close();
    }

    // Remove event listeners
    document.removeEventListener("click", this.handleUserInteraction);
    document.removeEventListener("keydown", this.handleUserInteraction);
  }
}

// Export for ES6 modules
export default AudioManager;
