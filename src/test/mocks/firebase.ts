import { vi } from "vitest";

export const mockAuth = {
  currentUser: null,
  onAuthStateChanged: vi.fn(),
  signInAnonymously: vi.fn(),
  signOut: vi.fn(),
};

export const mockDb = {};

vi.mock("~/lib/firebase/config", () => ({
  auth: mockAuth,
  db: mockDb,
  app: {},
}));

vi.mock("solid-firebase", () => ({
  useAuth: vi.fn(() => ({ data: null, loading: false, error: null })),
  useFirestore: vi.fn(() => ({ data: null, loading: false, error: null })),
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => mockAuth),
  signInAnonymously: vi.fn(),
  signOut: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => mockDb),
  doc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  enableMultiTabIndexedDbPersistence: vi.fn().mockResolvedValue(undefined),
}));
