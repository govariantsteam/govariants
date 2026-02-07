// Mock for socket.io module
const mockEmit = jest.fn();
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
