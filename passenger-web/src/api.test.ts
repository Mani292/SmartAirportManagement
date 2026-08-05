import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { reportIncident, trackIncident } from './api';

// Mock axios
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => ({
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
      })),
      post: vi.fn(),
      get: vi.fn(),
    },
  };
});

describe('Passenger API', () => {
  const originalHostname = window.location.hostname;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'localhost',
      },
      writable: true,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: {
        hostname: originalHostname,
      },
      writable: true,
    });
  });

  describe('reportIncident', () => {
    it('should call axios.post with the correct URL, data, and timeout', async () => {
      const mockData = { description: 'Test incident', location: 'Terminal 1' };
      const mockResponse = { data: { id: 'INC123' } };

      vi.mocked(axios.post).mockResolvedValueOnce(mockResponse);

      const response = await reportIncident(mockData);

      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/incidents/',
        mockData,
        { timeout: 30000 }
      );
      expect(response).toEqual(mockResponse);
    });
  });

  describe('trackIncident', () => {
    it('should call axios.get with the correct URL and timeout', async () => {
      const mockNumber = 'INC123';
      const mockResponse = { data: { id: 'INC123', status: 'In Progress' } };

      vi.mocked(axios.get).mockResolvedValueOnce(mockResponse);

      const response = await trackIncident(mockNumber);

      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith(
        `http://localhost:8000/api/v1/incidents/track/${mockNumber}`,
        { timeout: 10000 }
      );
      expect(response).toEqual(mockResponse);
    });
  });
});
