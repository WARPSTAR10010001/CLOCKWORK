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
    description: 'Grundidee und erste Schritte in CLOCKWORK.',
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
            <p>Außerdem wurde CLOCKWORK von der IT-Abteilung der Stadt Rheinberg entwickelt und ist daher ein Tool, das auf die Bedürfnisse der Stadtverwaltung zugeschnitten ist und auf Wunsch auch anpassbar ist.</p>
            `
          },
        ]
      },
      {
        id: "schnellstart",
        title: "Schnellstart",
        description: "Kurzanleitung für den schnellen Einstieg.",
        tags: ["kurzanleitung", "schnellstart", "übersicht", "einführung", "start", "erste_schritte"],
        articles: [
          {
            id: "kurzanleitung-für-den-schnellen-einstieg",
            title: "Kurzanleitung für den schnellen Einstieg",
            html: `
            <p>Willkommen zu CLOCKWORK! Diese Kurzanleitung hilft Ihnen, schnell mit dem System vertraut zu werden und die wichtigsten Funktionen zu nutzen. Es wird empfohlen, diese Anleitung zu befolgen, wenn Sie die Moderatorberechtigungen haben.</p>
            <p>Die wichtigsten Schritte für den Einstieg in CLOCKWORK sind:</p>
            <ul>
              <li>Zugang erhalten und erste Anmeldung</li>
              <li>Was sehe ich nach dem Login?</li>
              <li>Wie erstelle ich den ersten Dienstplan? (Wenn Sie keine Moderatorrechte haben, überspringen Sie diesen Schritt)</li>
              <li>Dienstplan aufrufen und Einträge machen</li>
            </ul>
            <p>Jeder dieser Schritte wird in den folgenden Abschnitten ausführlich erklärt, um Ihnen den Einstieg zu erleichtern. Natürlich stehen wir Ihnen bei Fragen jederzeit zur Verfügung oder Sie können sich die ausführlichen Dokumentationen durchlesen.</p>
            `
          },
          {
            id: 'systemzugriff-erhalten-und-erste-anmeldung',
            title: 'Systemzugriff erhalten & Erste Anmeldung',
            html: `
            <p>Um ersten Zugriff auf CLOCKWORK zu erhalten, muss die IT-Abteilung kontaktiert werden. Dies kann per Mail, telefonisch oder persönlich erfolgen. Beim Kontakt geben Sie bitte Ihren Namen und Ihren Teamnamen oder Ihren Fachbereich an. Außerdem muss bestimmt werden, wer aus dem Team oder Fachbereich als Moderator fungiert, da diese Person bzw. diese Personen besondere Rechte und Verantwortlichkeiten im System hat/haben.</p>
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
            id: "erstellen-des-ersten-dienstplans",
            title: "Erstellen des ersten Dienstplans",
            html: `
            <p>Um den ersten Dienstplan zu erstellen, müssen Sie als Moderator angemeldet sein. Navigieren Sie zum Modpanel, indem Sie in der Kopfzeile auf den entsprechenden Link klicken. Im Modpanel finden Sie die Teamverwaltung, in der Sie neue Dienstpläne erstellen und bestehende verwalten können.</p>
            <p>Klicken Sie auf die Schaltfläche "Mitarbeiter anlegen & verwalten", um zur Mitarbeiterverwaltung zu gelangen. Hier können Sie alle Mitarbeiter Ihres Teams hinzufügen, bearbeiten oder entfernen. Es ist wichtig, dass alle Mitarbeiter korrekt im System erfasst sind, da sie später in den Dienstplänen erscheinen werden.</p>
            <p>Hinweis: Das Angeben eines Enddatums für einen Mitarbeiter ist optional. Wenn kein Enddatum angegeben wird, bleibt der Mitarbeiter im System aktiv, bis er manuell entfernt wird.</p>
            <p>Nachdem Sie alle Mitarbeiter hinzugefügt haben, kehren Sie zum Modpanel zurück und klicken Sie auf "Dienstplan erstellen". Wählen Sie das gewünschte Jahr für den neuen Dienstplan aus, tragen Sie den Urlaub von allen Mitarbeitern ein und bestätigen Sie die Erstellung. Der Dienstplan wird nun generiert und ist bereit zur Bearbeitung.</p>
            <p>Nachdem der Dienstplan erstellt wurde, können Sie ihn in der Jahresübersicht aufrufen und mit der Planung beginnen. Klicken Sie auf das entsprechende Jahr, um den Dienstplan zu öffnen und Einträge für die Mitarbeiter vorzunehmen.</p>
            `
          },
          {
            id: "dienstplan-aufrufen-und-erste-eintraege-machen",
            title: "Dienstplan aufrufen und erste Einträge machen",
            html: `
            <p>Nachdem ein Dienstplan vom Moderator erstellt wurde ist dieser für alle Mitarbeiter des Teams oder Fachbereichs zugänglich. Um den Dienstplan aufzurufen, navigieren Sie zur Jahresübersicht über die Kopfzeile. Hier sehen Sie eine Liste der verfügbaren Dienstpläne für Ihr Team.</p>
            <p>Klicken Sie auf das gewünschte Jahr, um den entsprechenden Dienstplan zu öffnen und innerhalb dieses Jahres auf den gewünschten Monat. Innerhalb des Dienstplans können Sie die Einträge für jeden eingetragenen Mitarbeiter einsehen und bearbeiten.</p>
            <p>Um einen Eintrag zu machen oder zu ändern, klicken Sie einfach auf das entsprechende Feld im Dienstplan. Wenn dieser markiert ist mit einer Umrandung kann nun z.B. auf den "Urlaub"-Knopf geklickt werden und die ausgewählte Zelle wird als Urlaub hinterlegt. Wie man mehrere Tage auf einmal auswählt und die Tastenkürzel nutzt erfahren Sie in dem Hauptdokument.</p>
            `
          }
        ]
      }
    ]
  },
  {
    id: "grundlagen-der-nutzung",
    title: "Grundlagen der Nutzung",
    description: "Wichtige Konzepte und Funktionen für die tägliche Arbeit mit CLOCKWORK.",
    tags: ["grundlagen", "konzepte", "funktionen", "tägliche_arbeit", "nutzung", "allgemein", "übersicht", "basiswissen", "einführung", "start", "erste_schritte"],
    pages: [
      {
        id: "dienstplaene-auswählen-und-navigieren",
        title: "Dienstpläne auswählen und navigieren",
        description: "Wie man sich in Dienstplänen zurechtfindet.",
        tags: ["navigation", "menü", "kopfzeile", "fußzeile", "bereiche", "seiten", "übersicht"],
        articles: [
          {
            id: "jahresübersicht",
            title: "Jahresübersicht",
            html: `
            <p>Die Jahresübersicht ist das zentrale Dashboard von CLOCKWORK, auf dem alle Dienstpläne angezeigt werden. Hier können Nutzer und Moderatoren schnell auf die Dienstpläne zugreifen und diese verwalten.</p>
            <p>Der aktuelle Dienstplan wird immer ganz oben links angezeigt, gefolgt von den vorherigen Jahren in absteigender Reihenfolge. Moderatoren haben zusätzlich die Möglichkeit, in der Jahresübersicht die spezifischen Pläne zu bearbeiten.</p>
          `
          },
          {
            id: "monatsübersicht",
            title: "Monatsübersicht",
            html: `
            <p>Nachdem ein Jahr ausgewählt wurde öffnet sich die Monatsübersicht. Hier werden alle Monate des ausgewählten Jahres angezeigt. Nutzer können auf einen Monat klicken, um die detaillierte Ansicht des Dienstplans (auch Planviewer genannt) für diesen Monat zu öffnen.</p>
          `
          },
          {
            id: "planviewer",
            title: "Planviewer",
            html: `
            <p>Der Planviewer ist die detaillierte Ansicht eines Dienstplans für einen bestimmten Monat eines bestimmten Jahres. Hier können Nutzer und Moderatoren die Einträge für jeden Mitarbeiter sehen und bearbeiten.</p>
            <p>Im Planviewer befinden sich die primäre Knopfleiste oben, die es ermöglicht, für eine ausgewählte Zelle einen Status einzutragen (also z.B. Urlaub, Krank, Gleitzeit, etc.). Außerdem kann die momentane Auswahl auch aufgehoben werden. Zusätzlich dazu kann ein gesetzter Status auch wieder mit dem "Löschen"-Knopf aufgehoben werden.</p>
            <p>Jede Zelle steht für einen Mitarbeiter an einem bestimmten Tag. Ausgewählte Zellen werden hervorgehoben, und es können mehrere Zellen gleichzeitig ausgewählt werden - zusammenhängend über <b>Shift</b> oder getrennt über <b>Strg</b>.</p>
            <p>Feiertage werden in der Kopfzeile invertiert dargestellt. Wochenenden können optional eingeblendet werden, sind jedoch nicht beschreibbar.</p>
            <p>Wenn eine Zelle eine Plannotiz enthält, wird ein kleiner Punkt oben rechts in der Zelle angezeigt. Dies erleichtert das schnelle Erkennen von Zellen mit zusätzlichen Informationen.</p>
            <p>Die im Planviewer verfügbaren Tastenkürzel sind:</p>
            <ul>
              <li>U - Urlaub eintragen</li>
              <li>H - Alternierende Telearbeit eintragen</li>
              <li>K - Krank eintragen</li>
              <li>L - Lehrgang eintragen</li>
              <li>G - Gleitzeit eintragen</li>
              <li>T - Termin eintragen</li>
              <li>O - Anderes eintragen</li>
              <li>Entf - Einträge löschen</li>
              <li>Esc - Auswahl aufheben</li>
            </ul>
            <p>Unten befindet sich die sekundäre Knopfleiste (Navigation: vorheriger Monat / nächster Monat, Wochenenden anzeigen/ausblenden, Logs anzeigen).</p>
            <p>Hinweis: Für eine detaillierte Nachverfolgung aller Änderungen kann der Knopf "Logs anzeigen" verwendet werden.</p>
          `
          },
          {
            id: "plannotizen",
            title: "Plannotizen",
            html: `
            <p>Plannotizen ermöglichen es, für jeden Eintrag im Dienstplan zusätzliche Informationen zu hinterlegen. Diese Funktion wurde aufgrund von Nutzerfeedback eingeführt.</p>
            <p>Durch einen Doppelklick auf eine Zelle mit einem Eintrag wird das Notizfenster geöffnet. Falls bereits eine Notiz existiert, wird diese direkt angezeigt und kann beim Drücken des entsprechenden Knopfes bearbeitet werden.</p>
            <p>Im Bearbeitungsfenster einer Notiz kann ein beliebiger Text eingetragen werden. Durch Speichern wird die Notiz der entsprechenden Zelle zugewiesen.</p>
            <p>Wenn der Text vollständig entfernt und gespeichert wird, gilt die Notiz als gelöscht.</p>
            <p>Außerdem wird eine Notiz gelöscht wenn sich der Status der Zelle ändert (z.B. von Urlaub zu Krank).</p>
            <p>Änderungen an den Notizen werden natürlich auch in den Planlogs angezeigt.</p>
          `
          },
          {
            id: "logs",
            title: "Logs",
            html: `
            <p>Die Logs dienen der vollständigen Nachverfolgung aller Änderungen im Dienstplan. Hierbei werden Eintragungen, Löschungen und (neu) auch Änderungen an Plannotizen protokolliert.</p>
            <p>Über den Knopf "Logs anzeigen" im Planviewer gelangt man zur Log-Übersicht des aktuellen Monats.</p>
            <p>Ein Log beinhaltet folgende Informationen:</p>
            <ul>
              <li>Datum und Uhrzeit der Aktion</li>
              <li>Art der Aktion (Eintrag, Löschung, Notizänderung)</li>
              <li>Betroffener Mitarbeiter</li>
              <li>Korrigierter Zeitraum (jetzt fehlerfrei - ein früherer Datumsfehler wurde behoben)</li>
              <li>Liste der betroffenen Tage</li>
            </ul>
            <p>Logs können nach Aktionstyp und Mitarbeiter gefiltert werden, um schnelle Analysen zu ermöglichen.</p>
            <p>Um zurück zum Planviewer zu gelangen, kann die Jahreszahl im Titel angeklickt werden.</p>
          `
          }
        ]
      },
      {
        id: "weitere-funktionen",
        title: "Weitere Funktionen",
        description: "Feedback geben, Changelog einsehen, und mehr.",
        tags: ["zusatzfunktionen", "features", "nützlich", "optionen", "einstellungen"],
        articles: [
          {
            id: "feedback-geben",
            title: "Feedback geben",
            html: `
            <p>Feedback ist ein wichtiger Bestandteil der kontinuierlichen Verbesserung von CLOCKWORK. Nutzer und Moderatoren haben die Möglichkeit, ihre Erfahrungen, Vorschläge und Probleme direkt an die IT-Abteilung zu übermitteln. Dies kann entweder telefonisch, per Mail oder über das integrierte Feedback-System in CLOCKWORK erfolgen.</p>
            <p>Um Feedback über das integrierte System zu geben, klicken Sie in der Fußzeile auf den "Feedback"-Knopf. Dies öffnet ein Formular, in dem Sie eine Kategorie eingeben können und Ihre Nachricht eingeben können. Bitte seien Sie so detailliert wie möglich, damit die IT-Abteilung Ihre Anliegen effektiv bearbeiten kann.</p>
            <p>Wenn Sie fertig mit dem Ausfüllen des Formulars sind, klicken Sie auf "Feedback schicken". Ihr Feedback wird dann direkt an die IT-Abteilung gesendet, die sich so schnell wie möglich um Ihr Anliegen kümmern wird.</p>
            `
          },
          {
            id: "changelog-einsehen",
            title: "Changelog einsehen",
            html: `
            <p>Das Changelog ist eine wichtige Ressource, um über die neuesten Änderungen, Verbesserungen und Fehlerbehebungen in CLOCKWORK informiert zu bleiben. Es bietet eine detaillierte Übersicht über alle Updates, die am System vorgenommen wurden.</p>
            <p>Um das Changelog einzusehen, klicken Sie in der Fußzeile auf die Versionsnummer. Dies öffnet eine neue Seite, auf der alle Änderungen chronologisch aufgelistet sind, beginnend mit den neuesten Updates.</p>
            <p>Jeder Eintrag im Changelog enthält folgende Informationen:</p>
            <ul>
            <li>Versionsnummer: Die spezifische Version von CLOCKWORK, in der die Änderung vorgenommen wurde.</li>
            <li>Datum: Das Datum, an dem die Änderung implementiert wurde.</li>
            <li>Titel: Eine kurze Beschreibung der Änderung, die vorgenommen wurde.</li>
            <li>Details: Eine ausführlichere Erklärung der Änderung, einschließlich der Gründe für die Änderung und deren Auswirkungen auf die Nutzer.</li>
            <li>Zusammenfassung: Eine kurze Zusammenfassung der wichtigsten Punkte des Eintrags und ggf. zukünftige Pläne.</li>
            </ul>
            <p>Das Changelog ist in folgende Abschnitte unterteilt:</p>
            <ul>
            <li>Vollversionen: Detaillierte Einträge für jede veröffentlichte Version von CLOCKWORK.</li>
            <li>Betaversionen: Einträge für Beta-Releases, die vor der offiziellen Veröffentlichung getestet werden.</li>
            <li>Alphaversionen: Einträge für frühe Entwicklungsstadien von CLOCKWORK.</li>
            </ul>
            `
          },
          {
            id: "mitwirkende-ansehen",
            title: "Mitwirkende ansehen",
            html: `
            <p>Die Seite der Mitwirkenden bietet eine Übersicht über alle Personen, die an der Entwicklung und Wartung von CLOCKWORK beteiligt sind. Dies umfasst Entwickler, Tester, Ideegeber und andere Teammitglieder, die einen Beitrag zum Projekt geleistet haben.</p>
            <p>Außerdem werden alle Programme, die während der Entwicklung oder produktiven Nutzung von CLOCKWORK verwendet wurden, aufgelistet. Dies umfasst sowohl Open-Source-Software als auch proprietäre Tools, die zur Erstellung und Pflege des Systems beigetragen haben.</p>
            <p>Um die Seite der Mitwirkenden zu besuchen, klicken Sie in der Fußzeile auf den Text "Rheinberger IT". Dies öffnet eine neue Seite, auf der alle Mitwirkenden und verwendeten Programme aufgelistet sind, zusammen mit einer kurzen Beschreibung ihrer Rolle oder Funktion im Projekt.</p>
            `
          }
        ]
      },
      {
        id: "visuelle-anpassungen-vornehmen",
        title: "Visuelle Anpassungen vornehmen",
        description: "Wie man die Anzeige nach eigenen Wünschen anpasst.",
        tags: ["anzeige", "darstellung", "einstellungen", "anpassungen", "visuell", "design", "farben", "layout"],
        articles: [
          {
            id: "ansichtseinstellungen-aufrufen",
            title: "Ansichtseinstellungen aufrufen",
            html: `
            <p>Um die Ansichtseinstellungen in CLOCKWORK aufzurufen, navigieren Sie zur Fußzeile der Seite. Dort finden Sie den Link "Ansichtseinstellungen". Klicken Sie auf diesen Link, um das Einstellungsmenü zu öffnen.</p>
            <p>Im Einstellungsmenü können Sie verschiedene visuelle Anpassungen vornehmen, um die Anzeige des Programmes nach Ihren persönlichen Vorlieben zu gestalten.</p>
            <p>Alle Änderungen, die Sie in den Ansichtseinstellungen vornehmen, werden sofort übernommen und auf alle Seiten von CLOCKWORK angewendet. Dies ermöglicht es Ihnen, die Darstellung des Programmes in Echtzeit anzupassen und zu sehen, wie die Änderungen aussehen.</p>
            <p>Außerdem werden die gewählten Einstellungen in Ihrem Browser gespeichert. Dies bedeutet, dass Ihre Anpassungen auch nach dem Schließen und erneuten Öffnen des Browsers erhalten bleiben, sodass Sie CLOCKWORK immer in Ihrer bevorzugten Ansicht nutzen können.</p>
            `
          },
          {
            id: "anzeigemodus-auswaehlen",
            title: "Anzeigemodus auswählen",
            html: `
            <p>Der Anzeigemodus bestimmt, wie CLOCKWORK dargestellt wird. Es gibt verschiedene Modi zur Auswahl, die jeweils unterschiedliche visuelle Stile bieten. Diese lauten:</p>
            <ul>
            <li>"Hell" (Standard): Ein heller Modus mit einem weißen Hintergrund und dunkler Schrift. Gute Lesbarkeit, besonders bei Tageslicht, kann jedoch anstrengend für die Augen sein.</li>
            <li>"Dim": Ein dunklerer Modus mit einem dunkelgrauen Hintergrund und heller Schrift. Reduziert die Belastung der Augen, sieht jedoch trotzdem modern und übersichtlich aus.</li>
            <li>"Neon": Ein dunkel gehaltener Modus mit einem dunkelblauen Hintergrund und heller Schrift. Bietet eine schöne Optik, ist angenehm für die Augen. Eignet sich besonders gut für Menschen die ein wenig Farbe in ihren Arbeitsalltag bringen möchten.</li>
            </ul>
            `
          },
          {
            id: "farbscheme-auswaehlen",
            title: "Farbscheme auswählen",
            html: `
            <p>Das Farbscheme bestimmt die Farbpalette, die in CLOCKWORK verwendet wird. Es gibt verschiedene Farbschemes zur Auswahl, die jeweils unterschiedliche Intensitäten bieten. Diese lauten:</p>
            <ul>
            <li>"Standard" (Standard): Ein ausgewogenes Farbschema mit klarer und intensiver Farbgebung. Bietet gute Sichtbarkeit und Kontrast für alle Statusanzeigen.</li>
            <li>"Soft": Ein abgeschwächtes Farbschema mit sanfteren Farben. Reduziert die visuelle Belastung und sorgt für eine angenehmere Anzeige, besonders bei längerer Nutzung.</li>
            </ul>
            `
          },
          {
            id: "material-auswaehlen",
            title: "Material auswählen",
            html: `
            <p>Das Material bestimmt das Design und die Texturen, die in CLOCKWORK verwendet werden. Es gibt verschiedene Materialien zur Auswahl, die jeweils unterschiedliche Stile bieten. Diese lauten:</p>
            <ul>
            <li>"Solide" (Standard): Ein klarer und einfacher Stil ohne Texturen und ohne durchsichtige Elemente. Bietet eine saubere und übersichtliche Anzeige und erleichtert zusätzlich die Lesbarkeit. Außerdem können hier die verschiedenen visuellen Ebenen am einfachsten voneinander getrennt werden.</li>
            <li>"Glass": Ein moderner Stil mit durchsichtigen Elementen und Glas-Effekten. Bietet eine ansprechende Optik, kann jedoch die Lesbarkeit beeinträchtigen, besonders bei komplexen Anzeigen. Dieser Modus ist angelehnt an die "Liquid Glass"-Optik von Apple.</li>
            </ul>
            `
          },
          {
            id: "konturen-anpassen",
            title: "Konturen anpassen",
            html: `
            <p>Die Konturen-Einstellung ermöglicht es Ihnen, die Sichtbarkeit der Umrandungen in CLOCKWORK anzupassen. Sie können wählen, ob Konturen angezeigt werden sollen oder nicht. Diese Einstellung beeinflusst die Trennung von verschiedenen visuellen Ebenen.</p>
            <p>Wenn Konturen aktiviert sind, werden die verschiedenen Bereiche und Elemente klar voneinander abgegrenzt, was die Übersichtlichkeit erhöht. Dies ist besonders hilfreich, wenn Sie viele Informationen auf einmal anzeigen.</p>
            `
          },
          {
            id: "empfehlung",
            title: "Empfehlung",
            html: `
            <p>Für die beste Lesbarkeit und Übersichtlichkeit empfehle ich die Kombination aus dem "Dim"-Anzeigemodus, dem "Soft"-Farbscheme, dem "Solide"-Material und aktivierten Konturen. Diese Einstellungen sorgen für eine angenehme Anzeige, die die Augen schont und gleichzeitig eine klare Trennung der verschiedenen visuellen Ebenen ermöglicht.</p>
            <p>Für die ästhetisch ansprechendste Darstellung empfehle ich die Kombination aus dem "Neon"-Anzeigemodus, dem "Standard"-Farbscheme, dem "Glass"-Material und deaktivierten Konturen. Diese Einstellungen bieten eine moderne und stilvolle Optik, die besonders in dunklen Umgebungen gut zur Geltung kommt. Dies ist auch der eigentlich vorgesehene Anzeigemodus des Programmes.</p>
            `
          }
        ]
      }
    ]
  },
  {
    id: "rollen-berechtigungen-und-anmeldung",
    title: "Rollen, Berechtigungen & Anmeldung",
    description: "Die verschiedenen Berechtigungen und Funktionen der Rollen.",
    tags: ["aktionen", "rollen", "rechte", "funktionen", "user", "nutzer", "mod", "moderator", "administrator", "admin"],
    pages: [
      {
        id: 'ueberblick-der-rollen',
        title: 'Überblick der Rollen',
        description: 'Wie die Berechtigungen verteilt sind und was die Rollen können.',
        tags: ['rollen', 'aufbau', 'rechte', "zugriff", "struktur", "user", "nutzer", "mod", "moderator", "administrator", "admin"],
        articles: [
          {
            id: 'rolle-user',
            title: 'Rolle: User (Nutzer)',
            html: `
              <p>Die Rolle "Nutzer" ist die grundlegendste Rolle in CLOCKWORK. Nutzer können Dienstpläne einsehen und Einträge machen und bearbeiten. Sie haben jedoch keinen Zugriff auf administrative Funktionen.</p>
              <p>Der Nutzer ist ein zentraler Zugang eines Teams für alle Mitarbeiter, die das System nutzen. Es gibt keine individuellen Anmeldedaten, da jeder User die gleichen Berechtigungen hat. Somit teilen sich alle Nutzer beim Nutzer-Zugang den gleichen Nutzernamen und das gleiche Passwort.</p>
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
          },
          {
            id: "die-rollen-im-vergleich",
            title: "Die Rollen im Vergleich",
            html: `
            <p>Hier ist eine Übersicht der verschiedenen Rollen und ihrer Berechtigungen in CLOCKWORK:</p>

            <div class="doc-table-wrapper">
              <table class="doc-role-table">
                <thead>
                  <tr>
                    <th>Funktion/Berechtigung</th>
                    <th>Nutzer</th>
                    <th>Moderator</th>
                    <th>Administrator</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Dienstpläne einsehen</td>
                    <td>Ja</td>
                    <td>Ja</td>
                    <td>Ja</td>
                  </tr>
                  <tr>
                    <td>Dienstpläne bearbeiten</td>
                    <td>Ja</td>
                    <td>Ja</td>
                    <td>Ja</td>
                  </tr>
                  <tr>
                    <td>Dienstpläne erstellen</td>
                    <td>Nein</td>
                    <td>Ja</td>
                    <td>Ja</td>
                  </tr>
                  <tr>
                    <td>Mitarbeiter verwalten</td>
                    <td>Nein</td>
                    <td>Ja</td>
                    <td>Ja</td>
                  </tr>
                  <tr>
                    <td>Passwörter zurücksetzen</td>
                    <td>Nein</td>
                    <td>Ja (für Nutzer)</td>
                    <td>Ja (für Nutzer & Moderatoren)</td>
                  </tr>
                  <tr>
                    <td>Teams anlegen</td>
                    <td>Nein</td>
                    <td>Nein</td>
                    <td>Ja</td>
                  </tr>
                  <tr>
                    <td>Impersonation</td>
                    <td>Nein</td>
                    <td>Nein</td>
                    <td>Ja</td>
                  </tr>
                </tbody>  
              </table>
            </div>
          `
          }
        ]
      },
      {
        id: "anmeldung-und-zugangsdaten",
        title: "Anmeldung & Zugangsdaten",
        description: "Wie die Zugänge organisiert sind und was bei einem Passwort-Reset passiert.",
        tags: ["anmeldung", "login", "zugangsdaten", "passwort", "nutzername", "zugriff", "rollen", "passwort-änderung", "passwort-zurücksetzen", "user", "nutzer", "mod", "moderator", "administrator", "admin"],
        articles: [
          {
            id: "was-passiert-bei-der-passwort-zurücksetzung",
            title: "Was passiert bei der Passwort-Zurücksetzung?",
            html: `
            <p>Wenn das Passwort eines Nutzers oder Moderators zurückgesetzt wird, wird es auf ein temporäres Passwort geändert. Dieses temporäre Passwort muss dann bei der nächsten Anmeldung geändert werden, um die Sicherheit des Zugangs zu gewährleisten.</p>
            <p>Administratoren und Moderatoren können nicht einsehen, welches Passwort aktuell gesetzt ist. Dies dient dem Schutz der Zugangsdaten und verhindert unbefugten Zugriff.</p>
            <p>Nach der Zurücksetzung des Passworts sollten die betroffenen Nutzer oder Moderatoren das temporäre Passwort so schnell wie möglich ändern, um den Zugriff auf das System wiederherzustellen. Eine Passwortänderung kann ausgelöst werden, indem sich die betroffenen Nutzer mit den temporären Anmeldedaten das erste Mal anmelden. Bei der ersten Anmeldung wird man direkt aufgefordert das Passwort zu ändern.</p>
            <p>Es ist wichtig, dass bei der Wahl eines neuen Passwortes darauf geachtet wird, dass alle CLOCKWORK-Nutzer eines Teams oder Fachbereiches sich nun das gleiche Passwort merken müssen. Daher sollte das Passwort sicher, aber auch für alle Teammitglieder leicht merkbar sein.</p>
            <p>Hinweis: Mitglieder aus anderen Teams oder Fachbereichen sind von dieser Passwortänderung nicht betroffen und behalten ihre eigenen Zugangsdaten.</p>
            `
          },
          {
            id: "warum-gibt-es-keine-individuellen-zugänge",
            title: "Warum gibt es keine individuellen Zugänge?",
            html: `
            <p>CLOCKWORK wurde bewusst so konzipiert, dass es keine individuellen Zugänge für jeden Mitarbeiter gibt. Dies hat mehrere Gründe:</p>
            <ul>
              <li>Einfachheit: Durch die Verwendung von gemeinsamen Zugängen für Nutzer und Moderatoren wird die Verwaltung der Zugänge erheblich vereinfacht. Es müssen keine individuellen Konten erstellt, verwaltet oder zurückgesetzt werden, was den administrativen Aufwand reduziert.</li>
              <li>Teamorientierung: CLOCKWORK ist darauf ausgelegt, die Zusammenarbeit innerhalb von Teams zu fördern. Gemeinsame Zugänge erleichtern den Austausch von Informationen und die Koordination von Aufgaben, da alle Teammitglieder auf denselben Dienstplan zugreifen können.</li>
              <li>Sicherheit: Obwohl individuelle Zugänge theoretisch sicherer sein könnten, birgt die Verwaltung vieler Konten auch Risiken, wie z.B. vergessene Passwörter oder unbefugten Zugriff. Durch die Verwendung gemeinsamer Zugänge kann die Sicherheit durch klare Verantwortlichkeiten und regelmäßige Passwortänderungen gewährleistet werden.</li>
            </ul>
            <p>Insgesamt bietet die Entscheidung für gemeinsame Zugänge eine pragmatische Lösung, die den Bedürfnissen der Stadtverwaltung gerecht wird und gleichzeitig die Effizienz und Benutzerfreundlichkeit von CLOCKWORK maximiert.</p>
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
            <p>Falls der Urlaubsanspruch oder der Urlaubsübertrag eines Mitarbeiters für einen Dienstplan nachträglich geändert werden muss, können Moderatoren diese Änderungen in der Jahresübersicht vornehmen. Dafür muss das Jahr gefunden werden, für das die Änderungen gelten sollen. Neben der passenden Jahreszahl wird der Knopf "Bearbeiten" angezeigt. Durch Klicken auf diesen Knopf kommen Sie auf die Bearbeitungsseite für den ausgewählten Dienstplan.</p>
            <p>Auf der Bearbeitungsseite werden alle in dem Jahr aktiven Mitarbeiter angezeigt. Suchen Sie den Mitarbeiter, dessen Urlaubsanspruch oder Urlaubsübertrag geändert werden muss, und nehmen Sie die gewünschten Anpassungen vor. Nachdem alle Änderungen vorgenommen wurden, klicken Sie auf "Speichern", um die Aktualisierungen zu übernehmen.</p>
            <p>Falls ein Mitarbeiter in dem Jahr aktiv ist, aber z.B. nachträglich hinzugefügt wurde, kann man das an dem roten Status "nicht im Plan" erkennen. Um diesen Mitarbeiter in den Dienstplan aufzunehmen muss man auf den Knopf "In Plan aufnehmen" klicken. Daraufhin wird der Mitarbeiter aufgenommen und wird ab sofort im Dienstplan angezeigt. Falls mehrere solcher Mitarbeiter vorhanden sind, können diese direkt über den Knopf "Mitarbeiter-Sync" in den Plan hinzugefügt werden.</p>
            <p>Falls das Start- oder Enddatum eines Mitarbeiters sich nachträglich geändert hat, muss man auf den Knopf "Datum-Sync" klicken. Dadurch werden die neuen Daten übernommen und der Mitarbeiter wird entsprechend im Dienstplan angezeigt.</p>
            `
          },
          {
            id: "nutzerpasswoerter-zuruecksetzen",
            title: "Nutzerpasswörter zurücksetzen",
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
        description: "Fachbereiche/Teams anlegen, Impersonationsmodus aktivieren und erweiterte Systemkonfiguration.",
        tags: ["aktionen", "administrator", "admin", "rechte", "funktionen"],
        articles: [
          {
            id: "fachbereiche-und-teams-anlegen",
            title: "Fachbereiche und Teams anlegen",
            html: `
            <p>Administratoren haben die Berechtigung, neue Fachbereiche/Teams zu erstellen. Um diese zu erstellen, navigieren Sie zum Adminpanel über die Kopfzeile. Im Adminpanel finden Sie den Bereich "Neuen Fachbereich erstellen".</p>
            <p>Geben Sie den Namen des neuen Fachbereichs/Teams in das dafür vorgesehene Eingabefeld ein. Standardmäßig folgen die angelegten Nutzernamen diesem Format:</p>
            <ul>
            <li>"user-[teamname]" für den Nutzer-Zugang des Teams</li>
            <li>"mod-[teamname]" für den Moderator-Zugang des Teams</li>
            </ul>
            <p>Falls gewünscht, können Sie die Standard-Nutzernamen anpassen, indem Sie auf den Text "Optionale Benutzernamen festlegen" klicken. Dadurch öffnen sich Bearbeitungsfelder, wo die Nutzernamen angepasst werden können.</p>
            <p>Hinweis: Fachbereich/Teamnamen sowie die zugehörigen Nutzernamen können nach Erstellung nicht mehr geändert werden.</p>
            <p>Nachdem Sie den Namen des Fachbereichs/Teams und die gewünschten Nutzernamen eingegeben haben, klicken Sie auf "Fachbereich & Nutzer anlegen". Das System erstellt daraufhin den neuen Fachbereich/Team zusammen mit den zugehörigen Nutzer- und Moderator-Zugängen.</p>
            <p>Die neuen Fachbereiche/Teams sind nun im System verfügbar, und die zugehörigen Nutzer können sich mit den bereitgestellten Zugangsdaten anmelden.</p>
            <p>Unter dem genannten Bereich finden Sie eine Liste aller bereits angelegten Fachbereiche/Teams. Diese Liste zeigt die Namen der Fachbereiche/Teams sowie die zugehörigen Nutzernamen für den Nutzer- und Moderator-Zugang an. Außerdem werden die letzten Anmeldedaten angezeigt.</p>
            `
          },
          {
            id: "fachbereiche-und-teams-loeschen",
            title: "Fachbereiche und Teams löschen",
            html: `
            <p>Administratoren haben ebenfalls die Berechtigung, erstellte Fachbereiche/Teams zu löschen. Dies ist z.B. bei inaktiven oder versehentlich erstellten Fachbereichen/Teams sinnvoll.</p>
            <p>Hinweis: Damit ein Team gelöscht werden kann, müssen alle Mitarbeiter des Teams gelöscht werden und es dürfen keine Dienstpläne für das Team existieren.</p>
            <p>Um ein Team zu löschen müssen Administratoren auf das Adminpanel und unten in der "Bestehende Fachbereiche"-Liste den gewünschten Fachbereich auswählen. Es befindet sich ein roter Knopf in der Zeile des Fachbereiches mit der Beschriftung "Fachbereich löschen". Auf diesen muss geklickt werden.</p>
            <p>Sobald ein Fachbereich/Team gelöscht wurde, besteht kein Eintrag mehr in der Datenbank, also können sich die Nutzer des Teams sich nicht mehr anmelden (da auch die Benutzer gelöscht werden) und Administratoren können sich nicht über den Impersonationsmodus draufschalten.</p>
            `
          },
          {
            id: "impersonationsmodus-aktivieren",
            title: "Impersonationsmodus aktivieren",
            html: `
            <p>Der Impersonationsmodus ermöglicht es Administratoren, sich temporär als ein Nutzer oder Moderator eines Fachbereichs/Teams anzumelden. Dies ist besonders nützlich für Support- und Wartungszwecke, da Administratoren so Probleme aus der Perspektive des betroffenen Nutzers nachvollziehen können.</p>
            <p>Um in den Impersonationsmodus zu wechseln, muss man als angemeldeter Administrator zum Modpanel über die Kopfzeile navigieren. Oben wird nun der Bereich "Fachbereich auswählen" angezeigt. Wenn in dem Auswahlmenü kein Fachbereich ausgewählt ist, hat man keinen Zugriff auf alle anderen Sachen auf der Seite.</p>
            <p>Wählen Sie den gewünschten Fachbereich/Team aus dem Dropdown-Menü aus. Nachdem ein Fachbereich/Team ausgewählt wurde, erhalten Sie Zugriff auf alle Funktionen, die es auch für den Moderator des ausgewählten Fachbereiches gibt. Also können Mitarbeiter verwaltet werden, Dienstpläne erstellt werden und man erhält Zugriff auf den Impersonationsmodus im Bereich "Plandaten verwalten".</p>
            <p>Wenn der Impersonationsmodus aktiviert wird, sieht man nun die Jahresübersicht des ausgewählten Fachbereichs/Teams, so wie es der Moderator dieses Teams sehen würde. Nun können alle Funktionen genutzt werden, die auch dem Moderator zur Verfügung stehen.</p>
            `
          },
          {
            id: "modpasswoerter-zuruecksetzen",
            title: "Mod-Passwörter zurücksetzen",
            html: `
            <p>Genauso wie Moderatoren die Nutzer-Passwörter zurücksetzen können, haben Administratoren die Berechtigung, zusätzlich auch noch die Passwörter der Moderator-Zugänge aller Fachbereiche/Teams zurückzusetzen. Dies ist besonders nützlich, wenn ein Moderator sein Passwort vergessen hat oder aus Sicherheitsgründen geändert werden muss.</p>
            <p>Um das Passwort eines Moderators und/oder Nutzers zurückzusetzen, navigieren Sie zum Modpanel und begeben Sie sich in den Bereich "Systemnutzer verwalten". Dort befinden sich zwei Knöpfe, mit denen entweder das Nutzer und/oder das Moderatorpasswort zurückgesetzt werden kann. Bitte lesen Sie sich den unten stehenden Hinweis sorgfältig durch, bevor Sie fortfahren.</p>
            <p>Beim Bestätigen des Zurücksetzens gilt nun für alle Moderatoren und/oder Nutzer des Teams das neue Passwort. Dieses muss direkt beim ersten Login nach der Zurücksetzung geändert werden.</p>
            `
          },
          {
            id: "feedback-anzeigen",
            title: "Feedback anzeigen",
            html: `
            <p>Um als Administrator das Feedback der Systemnutzer einzusehen, navigieren Sie unten in der Fußzeile auf den Link "Feedback". Dadurch gelangen Sie zur Feedback-Übersichtsseite, auf der alle eingereichten Feedback-Einträge angezeigt werden.</p>
            <p>Auf der Feedback-Übersichtsseite sehen Sie eine Liste aller Feedback-Einträge, die von den Nutzern des Systems eingereicht wurden. Jeder Eintrag enthält Informationen wie das Datum und Uhrzeit der Einreichung, einer Kategorie, den Nutzernamen, die Version, mit der das Feedback abgeschickt wurde und dem eigentlichen Feedback-Text.</p>
            <p>Jedes Feedback-Element hat außerdem einen Status-Indikator, der den aktuellen Bearbeitungsstatus des Feedbacks anzeigt. Die möglichen Status sind "neu", "gelesen" und "bearbeitet". Als Administrator können Sie den Status eines Feedback-Eintrags ändern. Es kann nach dem Status gefiltert werden, um gezielt Feedbacks in einem bestimmten Bearbeitungsstadium anzuzeigen.</p>
            <p>Außerdem können bei Bedarf Feedback-Einträge gelöscht werden, um die Übersichtlichkeit zu gewährleisten.</p>
            `
          }
        ]
      }
    ]
  },
  {
    id: "technischer-und-organisatorischer-aufbau",
    title: "Technischer & organisatorischer Aufbau",
    description: "Technischer und struktureller Aufbau von CLOCKWORK.",
    tags: ["sonstiges", "weitere_informationen", "wichtig", "allgemein"],
    pages: [
      {
        id: "systemaufbau",
        title: "Systemaufbau",
        description: "Der technische und strukturelle Aufbau des Systems.",
        tags: ["aufbau", "struktur", "technisch", "system", "scopes", "teams", "abteilungen"],
        articles: [
          {
            id: "struktureller-aufbau",
            title: "Struktureller Aufbau",
            html: `
            <p>CLOCKWORK wurde konzipiert als abteilungsbezogenes System (sogenannte "Scopes"), das bedeutet, dass es in verschiedene Bereiche unterteilt ist. Jeder Scope repräsentiert eine Abteilung oder ein Team innerhalb der Stadtverwaltung Rheinberg.</p>
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
            <p>Zusätzlich wurde CLOCKWORK mit Blick auf Sicherheit entwickelt, um den Schutz der Nutzerdaten und die Integrität der Dienstpläne zu gewährleisten. Dies umfasst Maßnahmen wie sicherer Passwortspeicherung, rollenbasierte Zugriffskontrollen, sichere Authentifizierungsmechanismen und regelmäßige Backups der Datenbank.</p>
            <p>Insgesamt bietet der technische Aufbau von CLOCKWORK eine robuste und zuverlässige Plattform für die Anforderungen der Stadtverwaltung Rheinberg.</p>
            `
          }
        ]
      }
    ]
  },
  {
    id: "haeufige-probleme-und-faq",
    title: "Häufige Probleme & FAQ",
    description: "Antworten auf typische Fragen zu Anmeldung, Mitarbeitern, Status und Dienstplänen.",
    tags: ["faq", "problem", "probleme", "anmeldung", "hilfe", "frage", "status", "mitarbeiter", "sync"],
    pages: [
      {
        id: "allgemeine-fragen-und-anmeldung",
        title: "Allgemeine Fragen & Anmeldung",
        description: "Was tun, wenn die Anmeldung oder der Einstieg in CLOCKWORK nicht funktioniert?",
        tags: ["anmeldung", "login", "zugang", "passwort", "hilfe", "faq"],
        articles: [
          {
            id: "ich-kann-mich-nicht-anmelden",
            title: "Ich kann mich nicht anmelden - was kann ich tun?",
            html: `
          <p>Wenn die Anmeldung nicht funktioniert, können Sie folgende Punkte prüfen:</p>
          <ul>
            <li>Richtigen Nutzernamen verwenden: Achten Sie darauf, dass Sie den korrekten Team-Nutzernamen eingeben (z.B. user-[teamname] oder mod-[teamname]).</li>
            <li>Passwort prüfen: Stellen Sie sicher, dass die Feststelltaste (Caps Lock) nicht aktiviert ist und keine zusätzlichen Leerzeichen vor oder nach dem Passwort eingegeben werden.</li>
            <li>Richtige Rolle verwenden: Wenn Sie Moderator sind, melden Sie sich mit dem Mod-Zugang an, nicht mit dem Nutzer-Zugang (und umgekehrt).</li>
            <li>Teamzugehörigkeit: Vergewissern Sie sich, dass Sie die Zugangsdaten Ihres eigenen Teams/Fachbereichs verwenden.</li>
          </ul>
          <p>Wenn die Anmeldung trotz aller Schritte nicht funktioniert, wenden Sie sich bitte an die Moderatorinnen/Moderatoren Ihres Teams oder an die IT-Abteilung, damit das Passwort zurückgesetzt oder der Zugang geprüft werden kann.</p>
          `
          },
          {
            id: "ich-habe-mein-passwort-vergessen",
            title: "Ich habe mein Passwort vergessen - wie bekomme ich wieder Zugang?",
            html: `
          <p>Wenn das Passwort vergessen wurde oder nicht mehr bekannt ist, kann es zurückgesetzt werden:</p>
          <ul>
            <li>Für Nutzer-Zugänge: Wenden Sie sich an die Moderatorinnen/Moderatoren Ihres Teams. Diese können das Nutzer-Passwort über das Modpanel zurücksetzen.</li>
            <li>Für Moderator-Zugänge: Wenden Sie sich an die IT-Abteilung. Administratoren können Mod-Passwörter zurücksetzen.</li>
          </ul>
          <p>Nach dem Zurücksetzen wird ein temporäres Passwort vergeben. Beim nächsten Login werden Sie automatisch dazu aufgefordert, ein neues Passwort zu vergeben. Dieses neue Passwort gilt dann für alle CLOCKWORK-Nutzer der jeweiligen Rolle in Ihrem Team/Fachbereich.</p>
          `
          },
          {
            id: "ich-bin-eingeloggt-sehe-aber-keine-dienstplaene",
            title: "Ich bin eingeloggt, sehe aber keine Dienstpläne - warum?",
            html: `
          <p>Wenn Sie nach der Anmeldung keine Dienstpläne sehen, kann das folgende Gründe haben:</p>
          <ul>
            <li>Es wurde noch kein Dienstplan erstellt: Für das aktuelle Jahr wurde möglicherweise noch kein Plan angelegt. In diesem Fall müssen die Moderatorinnen/Moderatoren Ihres Teams im Modpanel einen Dienstplan erstellen.</li>
            <li>Der Login ist abgelaufen: Wenn die letzte Anmeldung schon länger her ist, liefert das System keine Daten mehr. Um dies zu beheben müssen Sie sich über die Kopfzeile abmelden und dann wieder anmelden.</li>
            <li>Falsches Team/Fachbereich: Wenn Sie zu mehreren Teams gehören, vergewissern Sie sich, dass Sie die Zugangsdaten des richtigen Teams verwenden.</li>
            <li>Impersonation (nur Admins): Wenn Sie als Administrator arbeiten, stellen Sie sicher, dass im Modpanel der korrekte Fachbereich ausgewählt ist.</li>
          </ul>
          <p>Bleibt das Problem bestehen, wenden Sie sich bitte an die Moderatorinnen/Moderatoren oder an die IT-Abteilung, damit geprüft werden kann, ob der Plan korrekt angelegt wurde.</p>
          `
          }
        ]
      },
      {
        id: "mitarbeiter-und-dienstplaene",
        title: "Mitarbeiter & Dienstpläne (Sync-Funktionen)",
        description: "Hilfe bei fehlenden Mitarbeitern im Plan und bei Änderungen von Zeiträumen.",
        tags: ["mitarbeiter", "dienstplan", "bearbeiten", "sync", "datum-sync", "mitarbeiter-sync", "faq"],
        articles: [
          {
            id: "ein-mitarbeiter-fehlt-im-dienstplan",
            title: "Ein Mitarbeiter fehlt im Dienstplan - was kann die Ursache sein?",
            html: `
          <p>Wenn ein Mitarbeiter in der Dienstplanansicht fehlt, können folgende Ursachen vorliegen:</p>
          <ul>
            <li>Mitarbeiter ist nicht in der Mitarbeiterverwaltung angelegt: Prüfen Sie im Modpanel unter "Mitarbeiter bearbeiten & anlegen", ob die Person überhaupt eingetragen ist.</li>
            <li>Start- und Enddatum passen nicht: Der Mitarbeiter hat möglicherweise ein Startdatum, das nach dem betrachteten Jahr liegt, oder ein Enddatum, das davor liegt.</li>
            <li>Mitarbeiter wurde nachträglich angelegt: Wenn der Mitarbeiter erst nach Erstellung des Dienstplans angelegt wurde, taucht er im Plan zunächst nicht auf und muss per Mitarbeiter-Sync in den Plan übernommen werden.</li>
          </ul>
          <p>In vielen Fällen reicht es aus, den betroffenen Dienstplan in der Jahresübersicht zu bearbeiten und den Mitarbeiter über den "Mitarbeiter-Sync" in den Plan aufzunehmen.</p>
          `
          },
          {
            id: "was-macht-der-mitarbeiter-sync",
            title: "Was macht der Mitarbeiter-Sync genau?",
            html: `
          <p>Der Mitarbeiter-Sync sorgt dafür, dass die Mitarbeiterliste aus der Mitarbeiterverwaltung mit dem ausgewählten Dienstplan abgeglichen wird.</p>
          <p>Typische Anwendungsfälle:</p>
          <ul>
            <li>Es wurden neue Mitarbeiter angelegt, nachdem der Dienstplan erstellt wurde.</li>
            <li>Ein bereits existierender Mitarbeiter war beim Erstellen des Plans nicht aktiv und wurde später wieder aufgenommen.</li>
          </ul>
          <p>Auf der Bearbeitungsseite eines Dienstplans werden solche Mitarbeiter mit dem Status "nicht im Plan" angezeigt. Durch Klicken auf den Knopf "In Plan aufnehmen" wird der Mitarbeiter in den Dienstplan übernommen. Über den allgemeinen "Mitarbeiter-Sync" können mehrere fehlende Mitarbeiter in einem Schritt übernommen werden.</p>
          <p>Hinweis: Der Mitarbeiter-Sync legt keine Urlaubsansprüche oder andere Werte automatisch fest, diese müssen weiterhin manuell geprüft und eingetragen werden.</p>
          `
          },
          {
            id: "was-macht-der-datum-sync",
            title: "Was macht der Datum-Sync und wann sollte ich ihn verwenden?",
            html: `
          <p>Der Datum-Sync sorgt dafür, dass Änderungen an Start- und Enddatum eines Mitarbeiters aus der Mitarbeiterverwaltung im Dienstplan übernommen werden.</p>
          <p>Beispiele, wann der Datum-Sync sinnvoll ist:</p>
          <ul>
            <li>Der Beschäftigungsbeginn eines Mitarbeiters wurde korrigiert (z.B. statt 01.02. nun 15.01.).</li>
            <li>Ein Mitarbeiter verlässt das Team früher oder später als ursprünglich geplant, und das Enddatum wurde angepasst.</li>
          </ul>
          <p>Durch den Datum-Sync wird der sichtbare Zeitraum des Mitarbeiters im Dienstplan automatisch an die neuen Daten angepasst. Tage außerhalb des gültigen Beschäftigungszeitraums werden entsprechend entfernt oder ausgeblendet.</p>
          <p>Hinweis: Der Datum-Sync verändert keine bestehenden Urlaubs- oder Status-Einträge innerhalb des gültigen Zeitraums, sondern passt nur den Zeitraum an, in dem der Mitarbeiter im Plan geführt wird.</p>
          `
          }
        ]
      },
      {
        id: "status-und-eintraege",
        title: "Status & Einträge im Dienstplan",
        description: "Bedeutung der verschiedenen Status und typische Fragen zur Planung.",
        tags: ["status", "urlaub", "krank", "gleitzeit", "lehrgang", "termin", "andere", "faq", "einträge"],
        articles: [
          {
            id: "welche-status-gibt-es-und-was-bedeuten-sie",
            title: "Welche Status gibt es und was bedeuten sie?",
            html: `
          <p>In CLOCKWORK gibt es verschiedene Status, mit denen Tage im Dienstplan markiert werden können. Die wichtigsten sind:</p>
          <ul>
            <li>Urlaub (U): Markiert genehmigte Urlaubstage.</li>
            <li>Krank (K): Markiert Krankheitstage, an denen die Person arbeitsunfähig ist.</li>
            <li>Gleitzeit (G): Kennzeichnet Tage, an denen Gleitzeit genommen oder ausgeglichen wird.</li>
            <li>Lehrgang (L): Zeigt an, dass die Person an einem Lehrgang, einer Schulung oder Fortbildung teilnimmt.</li>
            <li>Termin (T): Markiert Termine, die für die Tagesplanung relevant sind (z.B. wichtige externe Termine).</li>
            <li>Alternierende Telearbeit (H): Kennzeichnet Tage, an denen im Rahmen der alternierenden Telearbeit nicht im Büro gearbeitet wird.</li>
            <li>Anderes (O): Für sonstige Abwesenheiten oder besondere Konstellationen, die nicht in eine der oben genannten Kategorien fallen.</li>
          </ul>
          <p>Die Status werden sowohl in der Legende als auch in der farblichen Darstellung im Dienstplan visualisiert, sodass Sie auf einen Blick erkennen können, welche Art von Eintrag vorliegt.</p>
          `
          },
          {
            id: "warum-kann-ich-am-wochenende-keine-eintraege-machen",
            title: "Warum kann ich an Wochenenden keine Einträge machen?",
            html: `
          <p>Wochenenden sind in CLOCKWORK standardmäßig als arbeitsfreie Tage hinterlegt. Daher können an Samstagen und Sonntagen im Regelfall keine Einträge vorgenommen werden.</p>
          <p>Die Anzeige der Wochenenden kann über die sekundäre Knopfleiste im Planviewer ein- oder ausgeblendet werden. Dies dient vor allem der besseren Orientierung, hat aber keinen Einfluss auf die Eintragbarkeit.</p>
          <p>Falls besondere Regelungen (z.B. Wochenenddienste) bestehen, können diese in Absprache mit der IT-Abteilung geprüft und ggf. technisch abgebildet werden.</p>
          `
          },
          {
            id: "warum-sind-einige-tage-im-plan-invertiert",
            title: "Warum sind einige Tage im Plan invertiert dargestellt?",
            html: `
          <p>Invertiert dargestellte Tage sind in CLOCKWORK als Feiertage markiert. Sie dienen der visuellen Orientierung und machen auf arbeitsfreie Tage aufmerksam.</p>
          `
          },
          {
            id: "kann-ich-eintraege-rueckgaengig-machen",
            title: "Kann ich Einträge rückgängig machen oder Änderungen nachvollziehen?",
            html: `
          <p>Einträge im Dienstplan können jederzeit geändert oder gelöscht werden:</p>
          <ul>
            <li>Einträge löschen: Markieren Sie die entsprechende Zelle oder mehrere Zellen und nutzen Sie entweder den "Löschen"-Knopf in der Knopfleiste oder die Entf-Taste Ihrer Tastatur.</li>
            <li>Status ändern: Markieren Sie die Zelle(n) und setzen Sie einfach einen neuen Status. Der alte Eintrag wird überschrieben.</li>
          </ul>
          <p>Über die Logs (Knopf "Logs anzeigen" im Planviewer) können Sie nachvollziehen, welche Änderungen an einem Dienstplan vorgenommen wurden. Dort sehen Sie unter anderem Datum, Uhrzeit, Zeitraum und Art der Änderung.</p>
          <p>Auf diese Weise können Sie Änderungen transparent nachverfolgen und bei Bedarf intern klären.</p>
          `
          }
        ]
      }
    ]
  }
];