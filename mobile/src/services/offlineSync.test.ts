import AsyncStorage from '@react-native-async-storage/async-storage';
import { queueOfflineIncident } from './offlineSync';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('offlineSync', () => {
  const QUEUE_KEY = '@incident_sync_queue';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('queueOfflineIncident', () => {
    it('should queue an incident when the queue is initially empty', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const incidentData = { type: 'Maintenance', description: 'Broken light' };
      const result = await queueOfflineIncident(incidentData);

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(QUEUE_KEY);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        QUEUE_KEY,
        expect.stringContaining('"type":"Maintenance"')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        QUEUE_KEY,
        expect.stringContaining('"offline":true')
      );
      expect(result).toEqual({ success: true, message: 'Incident queued for sync' });
    });

    it('should append an incident to an existing queue', async () => {
      const existingQueue = [{ id: 123, type: 'Security', offline: true }];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingQueue));

      const incidentData = { type: 'Maintenance' };
      await queueOfflineIncident(incidentData);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        QUEUE_KEY,
        expect.stringContaining('"type":"Security"')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        QUEUE_KEY,
        expect.stringContaining('"type":"Maintenance"')
      );
    });

    it('should throw an error if AsyncStorage fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('AsyncStorage failed');
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(error);

      const incidentData = { type: 'Maintenance' };

      await expect(queueOfflineIncident(incidentData)).rejects.toThrow('AsyncStorage failed');
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});