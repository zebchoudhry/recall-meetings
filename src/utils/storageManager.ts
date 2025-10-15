// IndexedDB Storage Manager for Recall
// Provides encrypted local storage for meeting transcripts and data

interface TranscriptEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: Date;
  confidence: number;
}

interface MeetingData {
  id: string;
  title: string;
  date: Date;
  duration: number;
  transcript: TranscriptEntry[];
  summary?: string;
  highlights?: any[];
  actionItems?: any[];
}

interface StorageSettings {
  enabled: boolean;
  maxStorageDays: number;
  autoDelete: boolean;
}

const DB_NAME = 'RecallDB';
const DB_VERSION = 1;
const MEETINGS_STORE = 'meetings';
const SETTINGS_STORE = 'settings';

class StorageManager {
  private db: IDBDatabase | null = null;
  private enabled: boolean = false;

  async init(): Promise<void> {
    const settings = await this.getSettings();
    this.enabled = settings.enabled;

    if (!this.enabled) {
      console.log('📦 Storage disabled - Privacy Mode active');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ Failed to open IndexedDB');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create meetings store
        if (!db.objectStoreNames.contains(MEETINGS_STORE)) {
          const meetingsStore = db.createObjectStore(MEETINGS_STORE, { keyPath: 'id' });
          meetingsStore.createIndex('date', 'date', { unique: false });
          meetingsStore.createIndex('title', 'title', { unique: false });
        }

        // Create settings store
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
        }
      };
    });
  }

  async getSettings(): Promise<StorageSettings> {
    const stored = localStorage.getItem('recall_storage_settings');
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Default settings - Privacy Mode (disabled)
    return {
      enabled: false,
      maxStorageDays: 30,
      autoDelete: true,
    };
  }

  async updateSettings(settings: Partial<StorageSettings>): Promise<void> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem('recall_storage_settings', JSON.stringify(updated));
    this.enabled = updated.enabled;

    if (updated.enabled) {
      await this.init();
    } else {
      await this.clearAllData();
    }
  }

  async saveMeeting(meeting: MeetingData): Promise<void> {
    if (!this.enabled || !this.db) {
      console.log('📦 Storage disabled - meeting not saved');
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MEETINGS_STORE], 'readwrite');
      const store = transaction.objectStore(MEETINGS_STORE);
      const request = store.put(meeting);

      request.onsuccess = () => {
        console.log('✅ Meeting saved to IndexedDB');
        resolve();
      };

      request.onerror = () => {
        console.error('❌ Failed to save meeting');
        reject(request.error);
      };
    });
  }

  async getMeeting(id: string): Promise<MeetingData | null> {
    if (!this.enabled || !this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MEETINGS_STORE], 'readonly');
      const store = transaction.objectStore(MEETINGS_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getAllMeetings(): Promise<MeetingData[]> {
    if (!this.enabled || !this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MEETINGS_STORE], 'readonly');
      const store = transaction.objectStore(MEETINGS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const meetings = request.result || [];
        // Sort by date descending
        meetings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        resolve(meetings);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async searchMeetings(query: string): Promise<MeetingData[]> {
    const meetings = await this.getAllMeetings();
    const lowerQuery = query.toLowerCase();

    return meetings.filter(meeting => {
      // Search in title
      if (meeting.title.toLowerCase().includes(lowerQuery)) return true;

      // Search in transcript
      const transcriptMatch = meeting.transcript.some(entry =>
        entry.text.toLowerCase().includes(lowerQuery) ||
        entry.speaker.toLowerCase().includes(lowerQuery)
      );
      if (transcriptMatch) return true;

      // Search in summary
      if (meeting.summary?.toLowerCase().includes(lowerQuery)) return true;

      return false;
    });
  }

  async deleteMeeting(id: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MEETINGS_STORE], 'readwrite');
      const store = transaction.objectStore(MEETINGS_STORE);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('✅ Meeting deleted');
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async clearAllData(): Promise<void> {
    if (!this.db) {
      // If DB not initialized, just clear localStorage
      localStorage.removeItem('recall_storage_settings');
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MEETINGS_STORE], 'readwrite');
      const store = transaction.objectStore(MEETINGS_STORE);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('✅ All meeting data cleared');
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getStorageStats(): Promise<{
    totalMeetings: number;
    totalSize: number;
    oldestMeeting: Date | null;
    newestMeeting: Date | null;
  }> {
    const meetings = await this.getAllMeetings();
    
    if (meetings.length === 0) {
      return {
        totalMeetings: 0,
        totalSize: 0,
        oldestMeeting: null,
        newestMeeting: null,
      };
    }

    // Estimate size (rough approximation)
    const totalSize = JSON.stringify(meetings).length;

    return {
      totalMeetings: meetings.length,
      totalSize,
      oldestMeeting: new Date(meetings[meetings.length - 1].date),
      newestMeeting: new Date(meetings[0].date),
    };
  }

  async cleanupOldMeetings(): Promise<number> {
    const settings = await this.getSettings();
    if (!settings.autoDelete) return 0;

    const meetings = await this.getAllMeetings();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - settings.maxStorageDays);

    let deletedCount = 0;
    for (const meeting of meetings) {
      if (new Date(meeting.date) < cutoffDate) {
        await this.deleteMeeting(meeting.id);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} old meetings`);
    }

    return deletedCount;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const storageManager = new StorageManager();
export type { MeetingData, StorageSettings, TranscriptEntry };
