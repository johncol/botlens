import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  loadHistory,
  saveHistory,
  addHistoryEntry,
  removeHistoryEntry,
} from "./history";

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------
function makeLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((k) => delete store[k]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
}

const KEY = "test-history-key";

type Entry = { id: string; createdAt: number; label: string };

let localStorageMock: ReturnType<typeof makeLocalStorageMock>;

beforeEach(() => {
  localStorageMock = makeLocalStorageMock();
  vi.stubGlobal("window", { localStorage: localStorageMock });
  vi.stubGlobal("localStorage", localStorageMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// loadHistory
// ---------------------------------------------------------------------------
describe("loadHistory", () => {
  it("returns an empty array when the key does not exist", () => {
    expect(loadHistory(KEY)).toEqual([]);
  });

  it("returns parsed entries when the key exists", () => {
    const entries: Entry[] = [{ id: "1", createdAt: 1000, label: "a" }];
    localStorageMock.setItem(KEY, JSON.stringify(entries));
    expect(loadHistory<Entry>(KEY)).toEqual(entries);
  });

  it("returns an empty array when the stored value is malformed JSON", () => {
    localStorageMock.setItem(KEY, "not-json");
    expect(loadHistory(KEY)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// saveHistory
// ---------------------------------------------------------------------------
describe("saveHistory", () => {
  it("persists entries to localStorage", () => {
    const entries: Entry[] = [{ id: "1", createdAt: 1000, label: "a" }];
    saveHistory(KEY, entries);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      KEY,
      JSON.stringify(entries),
    );
  });

  it("round-trips through loadHistory", () => {
    const entries: Entry[] = [
      { id: "1", createdAt: 1000, label: "first" },
      { id: "2", createdAt: 2000, label: "second" },
    ];
    saveHistory(KEY, entries);
    expect(loadHistory<Entry>(KEY)).toEqual(entries);
  });
});

// ---------------------------------------------------------------------------
// addHistoryEntry
// ---------------------------------------------------------------------------
describe("addHistoryEntry", () => {
  beforeEach(() => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "00000000-0000-0000-0000-000000000001",
    );
    vi.spyOn(Date, "now").mockReturnValue(9999);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prepends the new entry and returns updated array", () => {
    const existing: Entry[] = [{ id: "existing", createdAt: 1, label: "old" }];
    const result = addHistoryEntry<Entry>(KEY, existing, { label: "new" });

    expect(result[0]).toEqual({
      id: "00000000-0000-0000-0000-000000000001",
      createdAt: 9999,
      label: "new",
    });
    expect(result[1]).toEqual(existing[0]);
    expect(result).toHaveLength(2);
  });

  it("persists the updated list to localStorage", () => {
    addHistoryEntry<Entry>(KEY, [], { label: "test" });
    const stored = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(stored).toHaveLength(1);
    expect(stored[0].label).toBe("test");
  });

  it("does not mutate the original entries array", () => {
    const original: Entry[] = [{ id: "x", createdAt: 1, label: "x" }];
    const copy = [...original];
    addHistoryEntry<Entry>(KEY, original, { label: "new" });
    expect(original).toEqual(copy);
  });
});

// ---------------------------------------------------------------------------
// removeHistoryEntry
// ---------------------------------------------------------------------------
describe("removeHistoryEntry", () => {
  it("removes the entry with the matching id", () => {
    const entries: Entry[] = [
      { id: "keep", createdAt: 1, label: "keep" },
      { id: "remove", createdAt: 2, label: "remove" },
    ];
    const result = removeHistoryEntry<Entry>(KEY, entries, "remove");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("keep");
  });

  it("returns the same array when id is not found", () => {
    const entries: Entry[] = [{ id: "a", createdAt: 1, label: "a" }];
    const result = removeHistoryEntry<Entry>(KEY, entries, "nonexistent");
    expect(result).toEqual(entries);
  });

  it("returns an empty array when the only entry is removed", () => {
    const entries: Entry[] = [{ id: "only", createdAt: 1, label: "only" }];
    expect(removeHistoryEntry<Entry>(KEY, entries, "only")).toEqual([]);
  });

  it("persists the updated list to localStorage", () => {
    const entries: Entry[] = [
      { id: "a", createdAt: 1, label: "a" },
      { id: "b", createdAt: 2, label: "b" },
    ];
    removeHistoryEntry<Entry>(KEY, entries, "a");
    const stored = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe("b");
  });
});
