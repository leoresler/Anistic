import { NavBar } from '../../shared/components/NavBar';
import { AnimeCard } from '../../shared/components/AnimeCard';
import { Button } from '../../shared/components/Button';
import { SearchInput } from '../../shared/components/SearchInput';
import { animeData } from '../../shared/mocks/animeData';
import styles from './AiRecommendationsPage.module.css';

const prompts = [
  'algo como AoT pero más oscuro',
  'anime corto para el fin de semana',
  'algo romántico con buena dirección de arte',
];

export function AiRecommendationsPage() {
  return (
    <main className="page-shell">
      <div className="page-frame">
        <NavBar />

        <section className={styles.pageHero}>
          <div>
            <p className="section-kicker">Assistant workspace</p>
            <h1 className={styles.title}>Recomendaciones IA</h1>
            <p className={styles.copy}>Describí un tono, una vibra o una referencia y la interfaz responde como un asistente curatorial con picks listos para explorar.</p>
          </div>
          <div className={styles.heroSearchShell}>
            <SearchInput />
          </div>
        </section>

        <section className={styles.quickPromptSection}>
          <p className={styles.sectionLabel}>Sugerencias rápidas</p>
          <div className={styles.promptRow}>
            {prompts.map((prompt) => (
              <button key={prompt} type="button" className={styles.promptChip}>
                {prompt}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.chatLayout}>
          <div className={styles.chatColumn}>
            <div className={styles.messageUser}>
              <span className={styles.messageMeta}>Vos</span>
              <p>Quiero algo como AoT pero más oscuro, con misterio y que se pueda maratonear.</p>
            </div>

            <div className={styles.messageAssistant}>
              <span className={styles.messageMeta}>Anistic IA</span>
              <p>Te armé una selección con tensión alta, atmósfera más sombría y series que se prestan para bingear el fin de semana.</p>
              <div className={styles.recommendationGrid}>
                {animeData.slice(4, 8).map((anime) => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
              </div>
            </div>

            <div className={styles.messageUserAlt}>
              <span className={styles.messageMeta}>Vos</span>
              <p>¿Y si quiero algo más corto y psicológico?</p>
            </div>

            <div className={styles.messageAssistantCompact}>
              <span className={styles.messageMeta}>Anistic IA</span>
              <p>Probá <strong>Bloom Protocol</strong>, <strong>Ivory District</strong> o <strong>Quiet Harbor</strong>. Tienen mejor ritmo para una sesión breve y un tono más introspectivo.</p>
            </div>
          </div>

          <aside className={styles.sideColumn}>
            <div className={styles.composerCard}>
              <p className={styles.sectionLabel}>Prompt actual</p>
              <textarea className={styles.composer} defaultValue="Busco un anime con tensión, giros y una estética más oscura que lo normal." />
              <div className={styles.composerActions}>
                <Button>Consultar IA</Button>
                <Button variant="outline">Guardar prompt</Button>
              </div>
            </div>

            <div className={styles.contextCard}>
              <p className={styles.sectionLabel}>Contexto útil</p>
              <ul className={styles.contextList}>
                <li>Duración ideal: 12 a 24 episodios</li>
                <li>Evitar comedia muy dominante</li>
                <li>Priorizar misterio y buena dirección visual</li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
