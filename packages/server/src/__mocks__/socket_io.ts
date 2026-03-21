// Mock for socket.io module
import { vi } from "vitest";
const mockEmit = vi.fn();
const mockIo = {
  emit: mockEmit,
};

export function init() {
  // no-op in tests
}

export function io() {
  return mockIo;
}

export function resetMocks() {
  mockEmit.mockClear();
}
