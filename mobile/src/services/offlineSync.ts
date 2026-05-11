import AsyncStorage from '@react-native-async-storage/async-storage';
import { createIncident } from './api';

const QUEUE_KEY = '@incident_sync_queue';

/**
 * Offline Sync Service.
 * Ensures field workers can report incidents without internet connectivity.
 */
export const queueOfflineIncident = async (incidentData: any) => {
  try {
    const existing = await AsyncStorage.getItem(QUEUE_KEY);
    const queue = existing ? JSON.parse(existing) : [];
    queue.push({
      ...incidentData,
      id: Date.now(),
      offline: true,
      timestamp: new Date().toISOString()
    });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return { success: true, message: 'Incident queued for sync' };
  } catch (error) {
    console.error('Failed to queue offline incident:', error);
    throw error;
  }
};

export const syncQueuedIncidents = async () => {
  try {
    const existing = await AsyncStorage.getItem(QUEUE_KEY);
    if (!existing) return;

    const queue = JSON.parse(existing);
    const remaining = [];

    for (const item of queue) {
      try {
        await createIncident(item);
        console.log(`Synced incident ${item.id}`);
      } catch (err) {
        console.warn(`Sync failed for ${item.id}, keeping in queue`);
        remaining.push(item);
      }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  } catch (error) {
    console.error('Offline sync failed:', error);
  }
};
