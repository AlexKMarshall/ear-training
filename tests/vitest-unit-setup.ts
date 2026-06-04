/**
 * Minimal DOM globals for Node unit tests that transitively import Solid JSX
 * (solid-js/web delegateEvents). Not a substitute for browser tests.
 */
if (typeof globalThis.window === "undefined") {
  const documentStub = {
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    _$DX_DELEGATE: new Set(),
  };
  globalThis.document = documentStub as Document;
  globalThis.window = {
    document: documentStub,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  } as Window & typeof globalThis;
}
