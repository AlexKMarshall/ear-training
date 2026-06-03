export function mountHome(root: HTMLElement): void {
  root.innerHTML = `
    <main class="app">
      <header class="header">
        <h1>Ear Training</h1>
        <p class="subtitle">Choose a test to practice</p>
      </header>

      <nav class="test-list" aria-label="Available tests">
        <a href="/stats/" class="test-card test-card-stats">
          <span class="test-card-title">Your progress</span>
          <span class="test-card-desc">Accuracy, pitch error, and first-try rate</span>
        </a>
        <a href="/single-note/" class="test-card">
          <span class="test-card-title">Sing a single note</span>
          <span class="test-card-desc">Hear a note and sing it back</span>
        </a>
        <a href="/chord-middle/" class="test-card">
          <span class="test-card-title">Sing the middle note of a chord</span>
          <span class="test-card-desc">Hear a chord and sing the middle pitch</span>
        </a>
        <a href="/interval-melodic-sing/" class="test-card">
          <span class="test-card-title">Sing melodic intervals</span>
          <span class="test-card-desc">Hear two notes in sequence and sing the top note</span>
        </a>
        <a href="/interval-harmonic-sing/" class="test-card">
          <span class="test-card-title">Sing harmonic intervals</span>
          <span class="test-card-desc">Hear two notes at once and sing the top note</span>
        </a>
        <a href="/interval-melodic-id/" class="test-card">
          <span class="test-card-title">Identify melodic intervals</span>
          <span class="test-card-desc">Hear two notes in sequence and name the interval</span>
        </a>
        <a href="/interval-harmonic-id/" class="test-card">
          <span class="test-card-title">Identify harmonic intervals</span>
          <span class="test-card-desc">Hear two notes together and name the interval</span>
        </a>
      </nav>
    </main>
  `;
}
