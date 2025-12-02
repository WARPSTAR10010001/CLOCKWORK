// src/app/documentation/docs-config.ts

export type DocTag = string;

export interface DocArticle {
  id: string;         // z.B. "rolle-user"
  title: string;      // "Rolle: Nutzer"
  html: string;       // HTML-Content
  tags: DocTag[];     // z.B. ["rolle", "user", "einführung"]
}

export interface DocPage {
  id: string;         // z.B. "aufbau-rollen"
  title: string;      // "Aufbau: Rollen im System"
  description?: string;
  tags: DocTag[];
  articles: DocArticle[];
}

export interface DocSection {
  id: string;         // z.B. "einfuehrung"
  title: string;      // "Einführung"
  description?: string;
  tags: DocTag[];
  pages: DocPage[];
}

export const DOC_SECTIONS: DocSection[] = [
  {
    id: 'einfuehrung',
    title: 'Einführung',
    description: 'Grundidee, Aufbau und Rollen in CLOCKWORK.',
    tags: ['einführung', 'start', 'allgemein'],
    pages: [
      {
        id: 'aufbau-rollen',
        title: 'Aufbau & Rollen',
        description: 'Wie das System aufgebaut ist und wer was darf.',
        tags: ['rollen', 'aufbau', 'rechte'],
        articles: [
          {
            id: 'rolle-user',
            title: 'Rolle: Nutzer',
            tags: ['rolle', 'user', 'mitarbeitende'],
            html: `
              <p>Normale Nutzer sehen ihren eigenen Dienstplan und können keine Änderungen an anderen Personen vornehmen.</p>
              <ul>
                <li>Eigene Einträge im Dienstplan einsehen</li>
                <li>Keine globalen Einstellungen</li>
                <li>Keine Erstellung neuer Jahrespläne</li>
              </ul>
            `
          },
          {
            id: 'rolle-mod',
            title: 'Rolle: Moderator',
            tags: ['rolle', 'mod', 'fachbereich', 'planung'],
            html: `
              <p>Moderatoren sind für die Dienstpläne eines Fachbereichs verantwortlich.</p>
              <ul>
                <li>Jahrespläne für den eigenen Fachbereich erstellen</li>
                <li>Einträge für Mitarbeitende setzen, ändern und löschen</li>
                <li>Mitarbeitende im Planjahr hinzufügen und Zeiträume pflegen</li>
              </ul>
            `
          },
          {
            id: 'rolle-admin',
            title: 'Rolle: Admin',
            tags: ['rolle', 'admin', 'global', 'verwaltung'],
            html: `
              <p>Admins verwalten CLOCKWORK global und können fachbereichsübergreifend arbeiten.</p>
              <ul>
                <li>Alle Fachbereiche und Dienstpläne einsehen</li>
                <li>Impersonation: temporär in andere Fachbereiche "hineinspringen"</li>
                <li>Systemweite Konfiguration und Datenpflege</li>
              </ul>
            `
          }
        ]
      },

      // weitere Pages unter "Einführung" …
    ]
  },

  {
    id: 'zugang-anmeldung',
    title: 'Zugang & Anmeldung',
    description: 'Login, Rollen und Zugangsvoraussetzungen.',
    tags: ['login', 'zugang', 'auth'],
    pages: [
      {
        id: 'login',
        title: 'Anmeldung',
        tags: ['login', 'anmeldung'],
        articles: [
          {
            id: 'login-grundlagen',
            title: 'Grundlagen der Anmeldung',
            tags: ['login', 'grundlagen'],
            html: `
              <p>Hier beschreibst du später detailliert, wie sich Nutzer anmelden (z.B. über SSO, KRZN-Account usw.).</p>
            `
          }
        ]
      }
    ]
  }

  // Weitere Sections nach Bedarf …
];