import { Button } from '../../shared/components/Button';
import { NavBar } from '../../shared/components/NavBar';
import { Badge } from '../../shared/components/Badge';
import { featuredAnime } from '../../shared/mocks/animeData';
import styles from './WatchPartyPage.module.css';

const messages = [
  { author: 'Mora', text: 'Ese plano del opening sigue siendo una locura.' },
  { author: 'Leo', text: 'Cuando tengamos sync real, esto va a quedar increíble.' },
  { author: 'Juli', text: 'La sala ya se siente lista para una premiere grupal.' },
];

const participants = ['Mora', 'Leo', 'Juli', 'Sofi'];

export function WatchPartyPage() {
  return (
    <main className="page-shell">
      <div className="page-frame">
        <NavBar />

        <section className={styles.pageHero}>
          <div>
            <p className="section-kicker">Social room stage</p>
            <h1 className={styles.title}>Watch Party</h1>
            <p className={styles.copy}>Una sala pensada para verse como player + espacio social al mismo tiempo, lista para evolucionar hacia embeds legales o una experiencia centrada en progreso compartido.</p>
          </div>
          <div className={styles.heroActions}>
            <Button>Invitar amigos</Button>
            <Button variant="outline">Compartir sala</Button>
          </div>
        </section>

        <section className={styles.roomLayout}>
          <div className={styles.stageColumn}>
            <div className={styles.animeInfoBar}>
              <div>
                <p className={styles.sectionLabel}>Sala activa</p>
                <h2 className={styles.animeTitle}>{featuredAnime.title}</h2>
              </div>
              <div className={styles.metaRow}>
                <Badge status={featuredAnime.status} />
                <span className={styles.metaText}>{featuredAnime.studio} · Episodio 08 · Subtítulos ES</span>
              </div>
            </div>

            <div className={styles.stagePlaceholder}>
              <div className={styles.playerGlass}>
                <p className={styles.sectionLabel}>Room stage</p>
                <div className={styles.playButton}>▶</div>
                <p className={styles.stageCopy}>Placeholder de player listo para un embed legal o una experiencia de progreso sincronizado.</p>
              </div>
            </div>

            <div className={styles.roomStatusGrid}>
              <div className={styles.statusCard}>
                <p className={styles.sectionLabel}>Progreso compartido</p>
                <div className={styles.progressTrack}>
                  <span className={styles.progressFill} />
                </div>
                <p className={styles.metaText}>18:42 / 24:00 · modo sincronizado pendiente</p>
              </div>

              <div className={styles.statusCard}>
                <p className={styles.sectionLabel}>Participantes conectados</p>
                <div className={styles.participantRow}>
                  {participants.map((participant) => (
                    <span key={participant} className={styles.participantBadge}>{participant}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className={styles.chatColumn}>
            <div className={styles.chatHeader}>
              <div>
                <p className={styles.sectionLabel}>Live chat</p>
                <h2 className={styles.chatTitle}>Conversación de la sala</h2>
              </div>
              <span className={styles.presencePill}>4 online</span>
            </div>

            <div className={styles.messageList}>
              {messages.map((message) => (
                <div key={message.author} className={styles.messageItem}>
                  <span className={styles.messageAuthor}>{message.author}</span>
                  <p>{message.text}</p>
                </div>
              ))}
            </div>

            <div className={styles.chatComposer}>
              <textarea className={styles.composer} defaultValue="Escribí un mensaje para la sala…" />
              <div className={styles.composerActions}>
                <Button>Enviar</Button>
                <Button variant="ghost">Emoji</Button>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
