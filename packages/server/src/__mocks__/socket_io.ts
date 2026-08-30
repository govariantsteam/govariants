// Mock for socket.io module
import { vi } from "vitest";
const mockEmit = vi.fn();
const mockSocketsLeave = vi.fn();
const mockIn = vi.fn(() => ({ socketsLeave: mockSocketsLeave }));
const mockRoomEmit = vi.fn<(event: string, ...args: unknown[]) => void>();
const mockTo = vi.fn((_room: string) => ({ emit: mockRoomEmit }));
const mockIo = {
  emit: mockEmit,
  in: mockIn,
  to: mockTo,
};

export function init() {
  // no-op in tests
}

export function io() {
  return mockIo;
}

export { mockSocketsLeave, mockTo, mockRoomEmit };

export function resetMocks() {
  mockEmit.mockClear();
  mockIn.mockClear();
  mockSocketsLeave.mockClear();
  mockTo.mockClear();
  mockRoomEmit.mockClear();
}
