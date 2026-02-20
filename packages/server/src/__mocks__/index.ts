// Mock for the main index module to prevent server startup during tests
import { ITimeoutService } from "../time-control/timeout";

// Mock timeout service
const mockTimeoutService: ITimeoutService = {
  clearGameTimeouts: jest.fn(),
  clearPlayerTimeout: jest.fn(),
  scheduleTimeout: jest.fn(),
};

export function getTimeoutService(): ITimeoutService {
  return mockTimeoutService;
}
