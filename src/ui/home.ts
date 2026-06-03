export function mountHome(root: HTMLElement): void {
  root.innerHTML = `
    <main class="app">
      <header class="header">
        <h1>Ear Training</h1>
        <p class="subtitle">Choose a test to practice</p>
      </header>

      <nav class="test-list" aria-label="Available tests">
        <a href="/single-note/" class="test-card">
          <span class="test-card-title">Sing a single note</span>
          <span class="test-card-desc">Hear a note and sing it back</span>
        </a>
        <a href="/chord-middle/" class="test-card">
          <span class="test-card-title">Sing the middle note of a chord</span>
          <span class="test-card-desc">Hear a chord and sing the middle pitch</span>
        </a>
      </nav>
    </main>
  `;
}
