// Mock for the main index module to prevent server startup during tests
import { vi } from "vitest";
import { ITimeoutService } from "../time-control/timeout";

// Mock timeout service
const mockTimeoutService: ITimeoutService = {
  clearGameTimeouts: vi.fn(),
  clearPlayerTimeout: vi.fn(),
  scheduleTimeout: vi.fn(),
};

export function getTimeoutService(): ITimeoutService {
  return mockTimeoutService;
}
