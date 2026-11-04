/** Home ("Pond") screen. Phase 2 placeholder; the real pond, frog and quick-add arrive in Phase 3. */
export function Home() {
  return (
    <section className="screen">
      <div className="pond pond--placeholder" aria-hidden="true">
        <div className="frog-placeholder">🐸</div>
      </div>
      <p className="screen__hint">Ribbit is waiting for Phase 3: pond level, quick-add and the first tip.</p>
    </section>
  );
}
