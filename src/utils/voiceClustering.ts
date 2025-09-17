interface VoicePattern {
  avgPitch: number;
  pitchRange: number;
  avgFrequency: number;
  spectralCentroid: number;
}

interface SpeakerCluster {
  id: string;
  name: string;
  patterns: VoicePattern[];
  centroid: VoicePattern;
}

export class VoiceClustering {
  private clusters: SpeakerCluster[] = [];
  private expectedSpeakers: number = 2;
  private minSamplesForCluster = 2;

  setExpectedSpeakers(count: number) {
    this.expectedSpeakers = Math.max(1, Math.min(10, count));
    console.log('🎯 VoiceClustering: Expected speakers set to', this.expectedSpeakers);
  }

  reset() {
    this.clusters = [];
    console.log('🔄 VoiceClustering: Reset all clusters');
  }

  updateSpeakerName(speakerId: string, newName: string) {
    const cluster = this.clusters.find(c => c.id === speakerId);
    if (cluster) {
      cluster.name = newName;
      console.log(`✏️ VoiceClustering: Renamed speaker ${speakerId} to ${newName}`);
    }
  }

  getClusters(): SpeakerCluster[] {
    return this.clusters;
  }

  identifySpeaker(pattern: VoicePattern): { name: string; confidence: number } {
    console.log('🔍 VoiceClustering: Identifying speaker with pattern:', pattern);
    
    if (this.clusters.length === 0) {
      // Create first cluster
      const newCluster: SpeakerCluster = {
        id: '1',
        name: 'Speaker 1',
        patterns: [pattern],
        centroid: { ...pattern }
      };
      this.clusters.push(newCluster);
      console.log('✅ VoiceClustering: Created first cluster - Speaker 1');
      return { name: 'Speaker 1', confidence: 1.0 };
    }

    // Find closest cluster
    let bestMatch = { cluster: null as SpeakerCluster | null, distance: Infinity };
    
    for (const cluster of this.clusters) {
      const distance = this.calculateDistance(pattern, cluster.centroid);
      console.log(`📊 Distance to ${cluster.name}:`, distance.toFixed(3));
      
      if (distance < bestMatch.distance) {
        bestMatch = { cluster, distance };
      }
    }

    // Define similarity threshold (lower distance = more similar)
    const similarityThreshold = 0.3;
    
    if (bestMatch.cluster && bestMatch.distance < similarityThreshold) {
      // Add to existing cluster and update centroid
      bestMatch.cluster.patterns.push(pattern);
      this.updateCentroid(bestMatch.cluster);
      
      const confidence = Math.max(0.5, 1 - bestMatch.distance);
      console.log(`✅ VoiceClustering: Matched to ${bestMatch.cluster.name} with confidence ${(confidence * 100).toFixed(1)}%`);
      return { name: bestMatch.cluster.name, confidence };
    } else if (this.clusters.length < this.expectedSpeakers) {
      // Create new cluster for new speaker
      const speakerNumber = this.clusters.length + 1;
      const newCluster: SpeakerCluster = {
        id: speakerNumber.toString(),
        name: `Speaker ${speakerNumber}`,
        patterns: [pattern],
        centroid: { ...pattern }
      };
      this.clusters.push(newCluster);
      console.log(`✅ VoiceClustering: Created new cluster - Speaker ${speakerNumber}`);
      return { name: `Speaker ${speakerNumber}`, confidence: 1.0 };
    } else {
      // Force assignment to closest cluster if we've reached max speakers
      if (bestMatch.cluster) {
        bestMatch.cluster.patterns.push(pattern);
        this.updateCentroid(bestMatch.cluster);
        
        const confidence = Math.max(0.3, 1 - bestMatch.distance);
        console.log(`🔀 VoiceClustering: Force-assigned to ${bestMatch.cluster.name} with confidence ${(confidence * 100).toFixed(1)}%`);
        return { name: bestMatch.cluster.name, confidence };
      }
      
      console.log('❌ VoiceClustering: Could not identify speaker');
      return { name: 'Unknown Speaker', confidence: 0 };
    }
  }

  private calculateDistance(pattern1: VoicePattern, pattern2: VoicePattern): number {
    // Normalized euclidean distance between voice patterns
    const pitchDiff = Math.abs(pattern1.avgPitch - pattern2.avgPitch) / 200; // Normalize by 200Hz
    const rangeDiff = Math.abs(pattern1.pitchRange - pattern2.pitchRange) / 100;
    const freqDiff = Math.abs(pattern1.avgFrequency - pattern2.avgFrequency) / 1000;
    const spectralDiff = Math.abs(pattern1.spectralCentroid - pattern2.spectralCentroid) / 500;
    
    // Weighted distance (pitch is most important)
    const distance = Math.sqrt(
      (pitchDiff * 0.4) ** 2 +
      (rangeDiff * 0.3) ** 2 +
      (freqDiff * 0.2) ** 2 +
      (spectralDiff * 0.1) ** 2
    );
    
    return distance;
  }

  private updateCentroid(cluster: SpeakerCluster) {
    if (cluster.patterns.length === 0) return;
    
    const avgPitch = cluster.patterns.reduce((sum, p) => sum + p.avgPitch, 0) / cluster.patterns.length;
    const pitchRange = cluster.patterns.reduce((sum, p) => sum + p.pitchRange, 0) / cluster.patterns.length;
    const avgFrequency = cluster.patterns.reduce((sum, p) => sum + p.avgFrequency, 0) / cluster.patterns.length;
    const spectralCentroid = cluster.patterns.reduce((sum, p) => sum + p.spectralCentroid, 0) / cluster.patterns.length;
    
    cluster.centroid = {
      avgPitch: Math.round(avgPitch),
      pitchRange: Math.round(pitchRange),
      avgFrequency: Math.round(avgFrequency),
      spectralCentroid: Math.round(spectralCentroid)
    };
    
    console.log(`🎯 Updated centroid for ${cluster.name}:`, cluster.centroid);
  }
}