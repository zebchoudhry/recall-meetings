interface VoiceProfile {
  id: string;
  name: string;
  voicePattern: {
    avgPitch: number;
    pitchRange: number;
    avgFrequency: number;
    spectralCentroid: number;
  };
}

export class VoiceIdentifier {
  private profiles: VoiceProfile[] = [];
  private audioContext: AudioContext | null = null;

  updateProfiles(profiles: VoiceProfile[]) {
    this.profiles = profiles;
  }

  async analyzeAudioStream(stream: MediaStream): Promise<VoiceProfile['voicePattern']> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    return new Promise((resolve) => {
      const source = this.audioContext!.createMediaStreamSource(stream);
      const analyser = this.audioContext!.createAnalyser();
      
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      
      source.connect(analyser);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Collect audio data for 1 second
      let sampleCount = 0;
      let pitchSum = 0;
      let pitchValues: number[] = [];
      let frequencySum = 0;
      let spectralSum = 0;
      
      const collectData = () => {
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate pitch (fundamental frequency)
        const pitch = this.detectPitchFromFrequencyData(dataArray, this.audioContext!.sampleRate);
        if (pitch > 50 && pitch < 400) {
          pitchValues.push(pitch);
          pitchSum += pitch;
        }
        
        // Calculate average frequency
        let weightedSum = 0;
        let magnitude = 0;
        for (let i = 0; i < dataArray.length; i++) {
          weightedSum += dataArray[i] * i;
          magnitude += dataArray[i];
        }
        
        if (magnitude > 0) {
          frequencySum += weightedSum / magnitude;
          
          // Calculate spectral centroid
          spectralSum += this.calculateSpectralCentroid(dataArray);
        }
        
        sampleCount++;
        
        if (sampleCount < 60) { // Collect for ~3 seconds at 60fps
          requestAnimationFrame(collectData);
        } else {
          // Calculate final pattern
          const avgPitch = pitchSum / pitchValues.length || 0;
          const pitchRange = pitchValues.length > 0 ? 
            Math.max(...pitchValues) - Math.min(...pitchValues) : 0;
          
          resolve({
            avgPitch: Math.round(avgPitch),
            pitchRange: Math.round(pitchRange),
            avgFrequency: Math.round(frequencySum / sampleCount),
            spectralCentroid: Math.round(spectralSum / sampleCount)
          });
          
          source.disconnect();
        }
      };
      
      collectData();
    });
  }

  private detectPitchFromFrequencyData(frequencyData: Uint8Array, sampleRate: number): number {
    // Find the dominant frequency
    let maxMagnitude = 0;
    let dominantFrequencyIndex = 0;
    
    for (let i = 1; i < frequencyData.length / 4; i++) { // Focus on lower frequencies for voice
      if (frequencyData[i] > maxMagnitude) {
        maxMagnitude = frequencyData[i];
        dominantFrequencyIndex = i;
      }
    }
    
    // Convert bin index to frequency
    return (dominantFrequencyIndex * sampleRate) / (frequencyData.length * 2);
  }

  private calculateSpectralCentroid(frequencyData: Uint8Array): number {
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
      numerator += i * frequencyData[i];
      denominator += frequencyData[i];
    }
    
    return denominator > 0 ? numerator / denominator : 0;
  }

  identifySpeaker(currentPattern: VoiceProfile['voicePattern']): { 
    name: string; 
    confidence: number; 
    id: string | null;
  } {
    if (this.profiles.length === 0) {
      return { name: "Unknown Speaker", confidence: 0, id: null };
    }

    let bestMatch = { name: "Unknown Speaker", confidence: 0, id: null };
    
    for (const profile of this.profiles) {
      const confidence = this.calculateSimilarity(currentPattern, profile.voicePattern);
      
      if (confidence > bestMatch.confidence && confidence > 0.5) { // 50% threshold
        bestMatch = {
          name: profile.name,
          confidence,
          id: profile.id
        };
      }
    }
    
    return bestMatch;
  }

  private calculateSimilarity(
    pattern1: VoiceProfile['voicePattern'], 
    pattern2: VoiceProfile['voicePattern']
  ): number {
    // Improved similarity calculation with better tolerance ranges
    const pitchSimilarity = 1 - Math.min(Math.abs(pattern1.avgPitch - pattern2.avgPitch) / 150, 1); // Tighter 150Hz range
    const rangeSimilarity = 1 - Math.min(Math.abs(pattern1.pitchRange - pattern2.pitchRange) / 80, 1); // Tighter range
    const freqSimilarity = 1 - Math.min(Math.abs(pattern1.avgFrequency - pattern2.avgFrequency) / 800, 1); // Better freq matching
    const spectralSimilarity = 1 - Math.min(Math.abs(pattern1.spectralCentroid - pattern2.spectralCentroid) / 400, 1);
    
    // Optimized weights for better voice identification
    const similarity = (
      pitchSimilarity * 0.45 +
      rangeSimilarity * 0.25 +
      freqSimilarity * 0.20 +
      spectralSimilarity * 0.10
    );
    
    return Math.max(0, Math.min(1, similarity));
  }
}