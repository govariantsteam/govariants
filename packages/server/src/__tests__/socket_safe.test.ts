import { safe } from "../socket_safe";

describe("safe", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("calls through to the wrapped handler with its arguments", async () => {
    const handler = vi.fn();
    safe(handler)("a", 1);
    await vi.waitFor(() => expect(handler).toHaveBeenCalledWith("a", 1));
  });

  it("does not throw when the wrapped handler throws synchronously", () => {
    const handler = vi.fn(() => {
      throw new Error("boom");
    });
    expect(() => safe(handler)()).not.toThrow();
  });

  it("logs instead of rejecting when the wrapped handler rejects", async () => {
    const handler = vi.fn(async () => {
      throw new Error("boom");
    });
    safe(handler)();
    await vi.waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled());
    expect(consoleErrorSpy.mock.calls[0][1]).toEqual(new Error("boom"));
  });

  it("does not interfere with a handler that resolves normally", async () => {
    const handler = vi.fn(async () => {});
    safe(handler)();
    await vi.waitFor(() => expect(handler).toHaveBeenCalled());
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
