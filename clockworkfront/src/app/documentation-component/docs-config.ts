export type DocTag = string;

export interface DocArticle {
  id: string;
  title: string;
  html: string;
}

export interface DocPage {
  id: string;
  title: string;
  description?: string;
  tags: DocTag[];
  articles: DocArticle[];
}

export interface DocSection {
  id: string;
  title: string;
  description?: string;
  tags: DocTag[];
  pages: DocPage[];
}

export const DOC_SECTIONS: DocSection[] = [
  {
    id: 'einfuehrung-und-erste-schritte',
    title: 'Einführung & Erste Schritte',
    description: 'Grundidee, Aufbau und Rollen in CLOCKWORK.',
    tags: ['einführung', 'start', 'allgemein'],
    pages: [
      {
        id: "was-ist-clockwork",
        title: "Was ist CLOCKWORK?",
        description: "Eine kurze Vorstellung und Zielsetzung des Systems.",
        tags: ["clockwork", "übersicht", "allgemein", "vorstellung", "zielsetzung"],
        articles: [
          {
            id: "vorstellung",
            title: "Vorstellung und Zielsetzung",
            html: `
            <p>CLOCKWORK ist ein webbasiertes Dienstplan-System, das speziell für die Bedürfnisse von der Rheinberger Stadtverwaltung entwickelt wurde. Es ermöglicht eine einfache Verwaltung von Dienstplänen, Urlaubseinträgen und Abwesenheiten für Mitarbeiter, Teams und Abteilungen.</p>
            <p>Die Hauptfunktionen von CLOCKWORK umfassen:</p>
            <ul>
              <li>Erstellung und Verwaltung von Dienstplänen</li>
              <li>Rollenbasierte Zugriffssteuerung</li>
              <li>Benutzerfreundliche und moderne Oberfläche</li>
              <li>Volle Transparenz über Dienstzeiten und Abwesenheiten</li>
              <li>Viele weitere Funktionen, die den Arbeitsalltag und die Planung erleichtern</li>
            </ul>
            <p>Mit CLOCKWORK soll die Dienstplanverwaltung effizienter gestaltet und die Transparenz für alle Beteiligten erhöht werden.</p>
            <p>Außerdem wurde CLOCKWORK von der Rheinberger IT entwickelt und ist daher ein Tool, dass auf die Bedürfnisse der Stadtverwaltung zugeschnitten ist und auf Wunsch auch anpassbar ist.</p>
            `
          },
        ]
      },
      {
        id: 'erste-schritte',
        title: 'Erste Schritte',
        description: "Der Einstieg in die Nutzung von CLOCKWORK.",
        tags: ['start', 'einrichtung', 'nutzung', 'erste schritte', 'login', 'anmeldung', "einstieg", "zugang", "einrichten", "einrichtung"],
        articles: [
          {
            id: 'systemzugriff-erhalten-und-erste-anmeldung',
            title: 'Systemzugriff erhalten & Erste Anmeldung',
            html: `
            <p>Um ersten Zugriff auf CLOCKWORK zu erhalten muss die IT-Abteilung kontaktiert werden. Dies kann per Mail, telefonisch oder persönlich erfolgen. Beim Kontakt geben Sie bitte Ihren Namen und Ihren Teamnamen oder Ihren Fachbereich an. Außerdem muss bestimmt werden, wer aus dem Team oder Fachbereich als Moderator fungiert, da diese Person bzw. diese Personen besondere Rechte und Verantwortlichkeiten im System hat/haben.</p>
            <p>Nach der Kontaktaufnahme erhalten Sie die Zugangsdaten für Ihr Team oder Ihren Fachbereich, bestehend aus einem gemeinsamen Nutzernamen und Passwort für alle Nutzer Ihres Teams. Die ernannten Team-Moderatoren erhalten die Anmeldedaten per Mail. Diese Zugangsdaten ermöglichen es Ihnen, sich in CLOCKWORK anzumelden und mit der Einrichtung Ihrer Dienstpläne zu beginnen.</p>
            <p>Es ist wichtig, dass die Zugangsdaten sicher aufbewahrt und nur an berechtigte Personen innerhalb Ihres Teams weitergegeben werden. Sollten Sie Probleme beim Login haben, wenden Sie sich bitte erneut an die IT-Abteilung, um Unterstützung zu erhalten.</p>
            <p>Um eine Anmeldung durchzuführen, navigieren Sie zum Anmeldeformular (in der Kopfzeile auf den "Anmelden"-Knopf drücken) und geben Sie Ihren Team-Nutzernamen sowie das zugehörige Passwort ein. Nach erfolgreicher Eingabe der Zugangsdaten klicken Sie auf "Anmelden". Bei erfolgreicher Anmeldung werden Sie auf das Dashboard weitergeleitet.</p>
            `
          },
          {
            id: "was-sehe-ich-nach-dem-login",
            title: "Was sehe ich nach dem Login?",
            html: `
            <p>Nach dem ersten erfolgreichen Login (egal ob als Moderator oder Nutzer) werden Sie dazu aufgefordert, Ihr Passwort zu ändern. Dies ist ein wichtiger Schritt, um die Sicherheit Ihres Zugangs zu gewährleisten. Wählen Sie ein sicheres Passwort, das Sie sich gut merken können, aber schwer zu erraten ist. Folgen Sie den Anweisungen auf dem Bildschirm, um Ihr neues Passwort festzulegen. Beachten Sie, dass alle anderen CLOCKWORK-Nutzer mit der gleichen Berechtigungsrolle das gleiche Passwort teilen. Daher ist eine teaminterne Absprache zwingend notwendig.</p>
            <p>Nach der Passwortänderung erhalten Sie Zugriff auf die Jahresübersicht, die als Startseite von CLOCKWORK dient. Hier können Sie die Dienstpläne für Ihr Team oder Ihren Fachbereich einsehen und verwalten.</p>
            <p>Je nach Ihrer Rolle (Nutzer oder Moderator) haben Sie unterschiedliche Zugriffsmöglichkeiten und Navigationselemente. Als Nutzer können Sie Dienstpläne einsehen und Einträge bearbeiten, während Moderatoren zusätzliche Funktionen zur Verwaltung des gesamten Teams haben.</p>
            <p>In der Kopfzeile finden Sie Links zu den Hauptbereichen von CLOCKWORK, wie z.B. der Jahresübersicht (oder wenn Sie Moderatorrechte haben auch dem Modpanel, in dem die ganze Teamverwaltung stattfindet). Diese Navigationselemente ermöglichen es Ihnen, schnell zwischen den verschiedenen Bereichen zu wechseln und Ihre Aufgaben effizient zu erledigen.</p>
            <p>In der Fußzeile können Sie auf weitere Informationen und Hilfeseiten zugreifen, die Ihnen bei der Nutzung von CLOCKWORK unterstützen, wie z.B. dem Feedback-Knopf, der Dokumentation, den Ansichtseinstellungen, aber auch sekundären Seiten wie dem Changelog und der Seite der Mitwirkenden.</p>
            `
          },
          {
            id: "dienstplan-aufrufen-und-eintraege-machen",
            title: "Dienstplan aufrufen und Einträge machen",
            html: `
            <p>Nachdem ein Dienstplan vom Moderator erstellt wurde ist dieser für alle Mitarbeiter des Teams oder Fachbereichs zugänglich. Um den Dienstplan aufzurufen, navigieren Sie zur Jahresübersicht über die Kopfzeile. Hier sehen Sie eine Liste der verfügbaren Dienstpläne für Ihr Team.</p>
            <p>Klicken Sie auf das gewünschte Jahr, um den entsprechenden Dienstplan zu öffnen und innerhalb dieses Jahres auf den gewünschten Monat. Innerhalb des Dienstplans können Sie die Einträge für jeden eingetragenen Mitarbeiter einsehen und bearbeiten.</p>
            <p>Um einen Eintrag zu machen oder zu ändern, klicken Sie einfach auf das entsprechende Feld im Dienstplan. Wenn dieser markiert ist mit einer Umrandung.</p>
            `
          }
        ]
      },
      {
        id: "system-aufbau",
        title: "System Aufbau",
        description: "Der technische und strukturelle Aufbau des Systems.",
        tags: ["aufbau", "struktur", "technisch", "system", "scopes", "teams", "abteilungen"],
        articles: [
          {
            id: "struktureller-aufbau",
            title: "Struktureller Aufbau",
            html: `
            <p>CLOCKWORK wurde konzipiert als gescopedes System, das bedeutet, dass es in verschiedene Bereiche (Scopes) unterteilt ist. Jeder Scope repräsentiert eine Abteilung oder ein Team innerhalb der Stadtverwaltung Rheinberg.</p>
            <p>Innerhalb eines Scopes gibt es verschiedene Rollen (Nutzer, Moderator, Administrator), die unterschiedliche Zugriffsrechte und Funktionen haben. Diese Struktur ermöglicht eine klare Trennung der Verantwortlichkeiten und erleichtert die Verwaltung der Dienstpläne. Die Team-Scopes sind so konzipiert, dass Teams nur Zugriff auf ihre eigenen Dienstpläne und keinen Zugriff auf die Dienstpläne anderer Teams haben. Jedes Team kann seine eigenen Dienstpläne erstellen und verwalten, während die Administratoren der IT-Abteilung einen globalen Überblick über alle Scopes behalten und bei Bedarf eingreifen können.</p>
            <p>Durch diesen strukturierten Aufbau wird sichergestellt, dass jeder Nutzer nur Zugriff auf die für ihn relevanten Informationen hat, was die Sicherheit und Effizienz des Systems erhöht.</p>
            `
          },
          {
            id: "technischer-aufbau",
            title: "Technischer Aufbau (Achtung, es wird technisch!)",
            html: `
            <p>CLOCKWORK ist eine webbasierte Anwendung, die auf modernen Webtechnologien basiert. Das System besteht aus einem Frontend, das in Angular entwickelt wurde, und einem Backend, das auf Node.js und Express läuft. Die Daten werden in einer PostgreSQL-Datenbank gespeichert, die eine flexible und skalierbare Lösung für die Verwaltung der Dienstpläne und Nutzerinformationen bietet.</p>
            <p>Die Kommunikation zwischen dem Frontend und dem Backend erfolgt über RESTful APIs, die eine effiziente Datenübertragung und Interaktion ermöglichen. Das System ist so konzipiert, dass es leicht erweiterbar ist, um zukünftige Anforderungen und Funktionen zu integrieren.</p>
            <p>Zusätzlich wurde CLOCKWORK mit Blick auf Sicherheit entwickelt, um den Schutz der Nutzerdaten und die Integrität der Dienstpläne zu gewährleisten. Dies umfasst Maßnahmen wie verschlüsselte Datenbankeinträge, sichere Authentifizierungsmechanismen und regelmäßige Backups der Datenbank.</p>
            <p>Insgesamt bietet der technische Aufbau von CLOCKWORK eine robuste und zuverlässige Plattform für die Anforderungen des Stadthauses.</p>
            <p>Der vollständige Changelog lässt sich hier finden: <a href="/changelog">Link</a></p>
            `
          }
        ]
      }
    ]
  },
  {
    id: "berechtigungen-und-funktionen",
    title: "Berechtigungen & Funktionen",
    description: "Die verschiedenen Berechtigungen und Funktionen der Rollen.",
    tags: ["aktionen", "rollen", "rechte", "funktionen", "user", "nutzer", "mod", "moderator", "administrator", "admin"],
    pages: [
      {
        id: 'ueberblick-rollen',
        title: 'Überblick der Rollen',
        description: 'Wie die Berechtigungen verteilt sind und was die Rollen können.',
        tags: ['rollen', 'aufbau', 'rechte', "zugriff", "struktur", "user", "nutzer", "mod", "moderator", "administrator", "admin"],
        articles: [
          {
            id: 'rolle-user',
            title: 'Rolle: User (Nutzer)',
            html: `
              <p>Die Rolle "Nutzer" ist die grundlegendste Rolle in CLOCKWORK. Nutzer können Dienstpläne einsehen und Einträge machen und bearbeiten. Sie haben jedoch keinen Zugriff auf administrative Funktionen.</p>
              <p>Der Nutzer ist ein zentraler Zugang eines Teams für alle Mitarbeiter, die das System nutzen. Es gibt keine individuellen Anmeldedaten, da jeder User die gleichen Berechtigungen hat. Somit teilen sich alle Nutzer den Nutzer-Zugang den gleichen Nutzernamen und das gleiche Passwort.</p>
            `
          },
          {
            id: "rolle-mod",
            title: "Rolle: Mod (Moderator)",
            html: `
              <p>Die Rolle "Moderator" hat erweiterte Rechte im Vergleich zum Nutzer. Moderatoren können Dienstpläne erstellen, verwalten und bearbeiten, Passwörter der zugehörenden User zurücksetzen und haben Zugriff auf die Mitarbeiterverwaltung des Teams.</p>
              <p>Der Mod-Zugang ist (wie der Nutzer-Zugang) ein zentraler Zugang eines Teams für alle Moderatoren. Es gibt keine individuellen Anmeldedaten, da jeder Moderator die gleichen Berechtigungen hat. Wie bei den Nutzer-Zugängen auch teilen sich alle Moderatoren eines Teams den gleichen Nutzernamen und das gleiche Passwort.</p>
              <p>Die Moderator-Rolle wird an die technik-affinsten Mitarbeiter eines Teams vergeben, die sich um die Teamverwaltung kümmern.</p>
              `
          },
          {
            id: "rolle-admin",
            title: "Rolle: Admin (Administrator)",
            html: `
              <p>Die Rolle "Administrator" hat die höchsten Rechte im CLOCKWORK-System. Administratoren können alle Funktionen nutzen, einschließlich der Verwaltung von Teams, Nutzern und Moderatoren sowie der Systemkonfiguration.</p>
              <p>Der Admin-Zugang ist für die IT-Abteilung der Stadtverwaltung reserviert, die das System wartet, neue Funktionen programmiert und bei Problemen unterstützt.</p>
              <p>Administratoren haben vollen Zugriff auf alle Bereiche des Systems und können Änderungen vornehmen, die sich auf alle Nutzer auswirken. Außerdem können Admins die Benutzerpasswörter für Moderatoren zurücksetzen.</p>
            `
          }
        ]
      },
      {
        id: "funktionen-der-moderatoren",
        title: "Funktionen der Moderatoren",
        description: "Dienstpläne erstellen, Mitarbeiter verwalten und Passwörter zurücksetzen.",
        tags: ["aktionen", "moderator", "mod", "rechte", "funktionen"],
        articles: [
           {
            id: "mitarbeiter-verwalten",
            title: "Mitarbeiter verwalten",
            html: `
              <p>Moderatoren haben Zugriff auf die Mitarbeiterverwaltung ihres Teams. Dies umfasst das Hinzufügen neuer Mitarbeiter, das Bearbeiten von Mitarbeiterinformationen und das Entfernen von Mitarbeitern aus dem System. Dieser Schritt ist essenziell für die Aufrechterhaltung aktueller und korrekter Daten innerhalb des Teams und ermöglicht das Erstellen von Dienstplänen.</p>
              <p>Um einen neuen Mitarbeiter hinzuzufügen, navigieren Sie zum Modpanel und wählen Sie die Option "Mitarbeiter bearbeiten & anlegen" aus. Oben sind leere Eingabefelder zu sehen. In diese müssen Sie die erforderlichen Informationen eingeben, wie Name, Startdatum und Enddatum.</p>
              <ul>
              <li>Name: In diesem Feld geben Sie den Namen des Mitarbeiters ein. Dies ist der Name, der im Dienstplan angezeigt wird.</li>
              <li>Startdatum: Hier geben Sie das Datum ein, an dem der Mitarbeiter seine Tätigkeit im Team beginnt oder begonnen hat. Ein ungefähres Datum ist ausreichend.</li>
              <li>Enddatum: In diesem Feld können Sie optional das Datum eingeben, an dem der Mitarbeiter das Team verlässt. Wenn kein Enddatum angegeben ist, wird davon ausgegangen, dass der Mitarbeiter weiterhin im Team tätig ist und sein wird.</li>
              </ul>
              <p>Alle eingetragenen Informationen können später jederzeit bearbeitet werden. Gehen Sie dafür einfach wieder in den "Mitarbeiter bearbeiten & anlegen" Bereich im Modpanel, nehmen Sie die gewünschten Änderungen vor und speichern Sie diese.</p>
              <p>In einem weiteren Artikel "Dienstpläne bearbeiten" wird beschrieben, wie Sie die Aktualisierung an dem Mitarbeiter auch im Dienstplan anzeigen lassen können (also z.B. das nachträgliche Hinzufügen eines Mitarbeiters und Änderungen am Start und Enddatum)</p>
              `
           },
           {
            id: "dienstplan-erstellen",
            title: "Dienstplan erstellen",
            html: `
            <p>Wenn die Mitarbeiterverwaltung abgeschlossen ist und die Liste der Mitarbeiter aktuell ist, können Moderatoren Dienstpläne für ihr Team erstellen.</p>
            <p>Um einen neuen Dienstplan zu erstellen, navigieren Sie zum Modpanel und wählen Sie die Option "Dienstplan erstellen" aus. Hier können Sie das gewünschte Jahr für den neuen Dienstplan auswählen. Das System zeigt automatisch alle in dem ausgewählten Jahr aktiven Mitarbeiter an. Bitte prüfen Sie diese Liste auf Vollständigkeit und Richtigkeit, bevor Sie den Dienstplan erstellen.</p>
            <p>Wenn die Liste der Mitarbeiter korrekt ist, muss nun für jeden Mitarbeiter der Urlaubsübertrag aus dem Vorjahr eingetragen werden und der Urlaubsanspruch für das ausgewählte Jahr eingetragen werden.</p>
            <p>Nachdem alle erforderlichen Informationen eingegeben wurden, klicken Sie auf "Dienstplan erstellen". Das System generiert daraufhin den Dienstplan für das ausgewählte Jahr, der nun in der Jahresübersicht verfügbar ist. Alle CLOCKWORK-Nutzer aus Ihrem Fachbereich/Team können den erstellten Dienstplan nun in der Jahresübersicht sehen, Einträge vornehmen, uvm..</p>
            `
           },
           {
            id: "dienstplaene-bearbeiten",
            title: "Dienstpläne bearbeiten",
            html: `
            <p>Falls der Urlaubsanspruch oder der Urlaubsübertrag eines Mitarbeiters für einen Dienstplan nachträglich geändert werden muss, können Moderatoren diese Änderungen in der Jahresübersicht vornehmen. Dafür muss das Jahr gefunden werden, für das die Änderungen gelten sollen. Neben der passenden Jahreszahl wird der Knopf "Bearbeiten" angezeigt. Durch Klicken auf diesen Knopf kommen Sie auf die Bearbeitungsseite für den ausgewähltenDienstplan.</p>
            <p>Auf der Bearbeitungsseite werden alle in dem Jahr aktiven Mitarbeiter angezeigt. Suchen Sie den Mitarbeiter, dessen Urlaubsanspruch oder Urlaubsübertrag geändert werden muss, und nehmen Sie die gewünschten Anpassungen vor. Nachdem alle Änderungen vorgenommen wurden, klicken Sie auf "Speichern", um die Aktualisierungen zu übernehmen.</p>
            <p>Falls ein Mitarbeiter in dem Jahr aktiv ist, aber z.B. nachträglich hinzugefügt wurde, kann man das an dem roten Status "nicht im Plan" erkennen. Um diesen Mitarbeiter in den Dienstplan aufzunehmen muss man auf den Knopf "In Plan aufnehmen" klicken. Daraufhin wird der Mitarbeiter aufgenommen und wird ab sofort im Dienstplan angezeigt. Falls mehrere solcher Mitarbeiter vorhanden sind, können diese direkt über den Knopf "Mitarbeiter-Sync" in den Plan hinzugefügt werden.</p>
            <p>Falls das Start- oder Enddatum eines Mitarbeiters sich nachträglich geändert hat, muss man auf den Knopf "Datum-Sync" klicken. Dadurch werden die neuen Daten übernommen und der Mitarbeiter wird entsprechend im Dienstplan angezeigt.</p>
            `
           },
           {
            id: "passwoerter-zuruecksetzen",
            title: "Passwörter zurücksetzen",
            html: `
            <p>Moderatoren haben die Berechtigung, das Passwort des Nutzer-Zugangs ihres Teams zurückzusetzen. Dies ist besonders nützlich, wenn das Passwort vergessen wurde oder aus Sicherheitsgründen geändert werden muss.</p>
            <p>Um das Passwort zurückzusetzen, navigieren Sie zum Modpanel und scrollen Sie unten in den Bereich "Systemnutzer verwalten". Bitte lesen Sie sich den unten stehenden Hinweis sorgfältig durch, bevor Sie fortfahren.</p>
            <p>Beim Bestätigen des Zurücksetzens gilt nun für alle Nutzer des Teams das neue Passwort. Dieses muss direkt beim ersten Login nach der Zurücksetzung geändert werden.</p>
            `
           }
        ]
      },
      {
        id: "funktionen-der-administratoren",
        title: "Funktionen der Administratoren",
        description: "Fachbereiche/Teams anlegen, Impersonationsmodus aktivieren und erweitere Systemkonfiguration.",
        tags: ["aktionen", "administrator", "admin", "rechte", "funktionen"],
        articles: [
          {
            id: "fachbereiche-und-teams-anlegen",
            title: "Fachbereiche und Teams anlegen",
            html: `

            `
          }
        ]
      }
    ]
  },
  {
    id: 'placeholder',
    title: 'placeholder',
    description: 'placeholder',
    tags: [],
    pages: [
      {
        id: 'placeholder',
        title: 'placeholder',
        tags: [],
        articles: [
          {
            id: 'placeholder',
            title: 'placeholder',
            html: `
              <p>placeholder</p>
            `
          }
        ]
      }
    ]
  }
];