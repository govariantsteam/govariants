// Mock for socket.io module
import { vi } from "vitest";
const mockEmit = vi.fn();
const mockSocketsLeave = vi.fn();
const mockIn = vi.fn(() => ({ socketsLeave: mockSocketsLeave }));
const mockIo = {
  emit: mockEmit,
  in: mockIn,
};

export function init() {
  // no-op in tests
}

export function io() {
  return mockIo;
}

export { mockSocketsLeave };

export function resetMocks() {
  mockEmit.mockClear();
  mockIn.mockClear();
  mockSocketsLeave.mockClear();
}
