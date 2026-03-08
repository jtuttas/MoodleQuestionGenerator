# Lastenheft
## Webapplikation zur KI-gestützten Generierung von Moodle-Fragen im Moodle-XML-Format

**Version:** 1.1  
**Stand:** 08.03.2026  
**Dokumenttyp:** Lastenheft  
**Ausgabeformat:** Markdown

---

## 1. Ausgangssituation

Lehrkräfte und Kursverantwortliche erstellen für Moodle regelmäßig digitale Test- und Prüfungsfragen. Die manuelle Erstellung ist zeitaufwendig, insbesondere wenn unterschiedliche Fragetypen, Schwierigkeitsstufen und fachliche Kontexte berücksichtigt werden müssen. Zusätzlich muss die Ausgabe in einem für Moodle importierbaren Format erfolgen, insbesondere als **Moodle XML**.

Zur Unterstützung dieses Prozesses soll eine Webapplikation entwickelt werden, die mithilfe von **Large Language Models (LLMs)** automatisch Fragen generiert. Dabei sollen sowohl **API-basierte Modelle** als auch **lokal ausführbare Modelle** nutzbar sein. Die generierten Fragen sollen auf Basis definierter Vorlagen und Beispiele erzeugt, in einer Vorschau dargestellt, dauerhaft gespeichert und als Moodle-XML exportiert werden können.

---

## 2. Zielsetzung

Ziel ist die Entwicklung einer Webapplikation, mit der Anwender auf einfache Weise Moodle-Fragen erzeugen können. Dazu gibt der Nutzer eine fachliche Aufgabenbeschreibung ein und wählt zusätzlich:

- den gewünschten **Fragetyp**,
- die **Schwierigkeit**,
- das zu verwendende **KI-Modell** bzw. die Modellquelle.

Die Anwendung soll daraus eine oder mehrere passende Fragen generieren, rechtsseitig in einer Vorschau darstellen, in einer Datenbank speichern und im **Moodle-XML-Format** ausgeben, sodass ein direkter Import in Moodle möglich ist.

---

## 3. Produktvision

Die geplante Webapplikation ist ein Assistenzsystem zur automatisierten Erstellung von Moodle-Fragen. Sie verbindet didaktische Vorgaben mit KI-gestützter Textgenerierung, strukturierter Datenhaltung und standardisierten Ausgabeformaten. Die Anwendung soll sowohl lokal in geschützten Umgebungen als auch mit Cloud-LLMs betrieben werden können.

---

## 4. Zielgruppen

### Primäre Zielgruppen

- Lehrkräfte
- Ausbilderinnen und Ausbilder
- Dozierende
- Administratoren von Lernplattformen

### Sekundäre Zielgruppen

- Fachbereiche, die große Mengen an Übungs- oder Prüfungsfragen erstellen
- Bildungseinrichtungen mit Datenschutzanforderungen, die lokale Modelle bevorzugen

---

## 5. Produktnutzung

Die Webapplikation wird über einen Browser genutzt. Ein Anwender beschreibt die gewünschte Frage in natürlicher Sprache, wählt Schwierigkeitsgrad und Fragetyp aus und bestimmt, mit welchem Modell die Generierung erfolgen soll. Anschließend erhält er eine Vorschau sowie die finale XML-Ausgabe zur Weiterverarbeitung oder zum Export. Die erzeugten Fragen sollen zusätzlich in einer Datenbank gespeichert werden, damit sie später erneut aufgerufen, geprüft oder weiterverwendet werden können.

---

## 6. Rahmenbedingungen

- Die Anwendung soll als **Webapplikation** ausgeführt werden.
- Die Bedienung soll auf Desktop-Geräten komfortabel möglich sein.
- Die Benutzeroberfläche soll in zwei Hauptbereiche gegliedert sein:
  - **linke Hälfte:** Eingabe- und Steuerbereich
  - **rechte Hälfte:** Vorschaufenster
- Die Anwendung soll mit verschiedenen Fragetypen arbeiten, zu denen jeweils **Templates** und **Beispiele** vorliegen.
- Es sollen sowohl **externe API-Modelle** als auch **lokale Modelle** auswählbar sein.
- Das Ergebnis muss im **Moodle XML Format** erzeugt werden.
- Generierte Fragen sollen in einer **Datenbank** gespeichert werden.
- Die Applikation soll in einem **Dockercontainer** lauffähig bereitgestellt werden.

---

## 7. Funktionale Anforderungen

### 7.1 Verwaltung und Auswahl von Fragetypen

Die Anwendung muss mehrere Moodle-Fragetypen unterstützen. Für jeden Fragetyp sollen mindestens folgende Informationen hinterlegt werden können:

- Bezeichnung des Fragetypen
- Beschreibung
- Template für die Generierung
- Beispiel für Eingabe/Ausgabe
- ggf. Hinweise zu besonderen Parametern

Die Auswahl des Fragetypen muss für den Nutzer einfach und übersichtlich erfolgen.

**Muss-Anforderungen:**

- Auswahl eines Fragetypen aus einer Liste
- Anzeige des zugehörigen Templates
- Anzeige eines hinterlegten Beispiels
- Berücksichtigung des ausgewählten Fragetypen bei der Prompt-Erstellung

**Kann-Anforderungen:**

- Gruppierung der Fragetypen nach Kategorien
- Favoritenfunktion für häufig genutzte Typen
- Suchfunktion innerhalb der Fragetypen

---

### 7.2 Erfassung der Nutzeranforderungen

Der Nutzer muss die gewünschte Aufgabe in freier Form eingeben können.

Zusätzlich muss er mindestens folgende Parameter festlegen können:

- Fragetyp
- Schwierigkeitsgrad
- Modellquelle bzw. konkretes Modell

**Muss-Anforderungen:**

- Textfeld für Aufgabenbeschreibung / Anweisung an die KI
- Auswahlfeld für Schwierigkeitsgrad
- Auswahlfeld für Fragetyp
- Auswahlfeld für Modell oder Modellquelle

**Kann-Anforderungen:**

- Eingabe eines Themengebiets oder Fachs
- Eingabe einer Zielgruppe / Klassenstufe
- Eingabe einer gewünschten Anzahl an Fragen
- Eingabe einer Sprache
- Eingabe zusätzlicher Randbedingungen

---

### 7.3 Schwierigkeitsgrade

Die Anwendung soll unterschiedliche Schwierigkeitsstufen unterstützen, damit Fragen an Lernniveau und Zielgruppe angepasst werden können.

**Muss-Anforderungen:**

- Auswahl einer Schwierigkeit, z. B. `leicht`, `mittel`, `schwer`
- Übergabe der Schwierigkeit an die Prompt-Logik
- Berücksichtigung in Vorschau und XML-Ergebnis

**Kann-Anforderungen:**

- frei definierbare Schwierigkeitsstufen
- didaktische Hinweise zur Stufe

---

### 7.4 KI-gestützte Generierung

Die Anwendung soll Fragen mithilfe von LLMs generieren. Dabei müssen zwei Betriebsarten möglich sein:

1. **API-basierte Nutzung externer Modelle**
2. **Nutzung lokaler Modelle**

#### 7.4.1 API-basierte Modelle

**Muss-Anforderungen:**

- Auswahl mindestens eines API-basierten LLMs
- konfigurierbare Schnittstelle für API-Schlüssel und Endpunkte
- Senden des generierten Prompts an das gewählte Modell
- Rückgabe und Verarbeitung der Modellantwort

**Kann-Anforderungen:**

- Unterstützung mehrerer Anbieter
- Anzeige von Antwortzeit und Fehlermeldungen
- Auswahl von Modellparametern wie Temperatur oder Token-Limit

#### 7.4.2 Lokale Modelle

**Muss-Anforderungen:**

- Auswahl mindestens eines lokal verfügbaren Modells
- Anbindung an einen lokalen Modelldienst
- Ausführung ohne externe Cloud-Verbindung

**Kann-Anforderungen:**

- Anzeige der lokal verfügbaren Modelle mit Status
- Auswahl unterschiedlicher Quantisierungen oder Varianten
- Umschaltmöglichkeit zwischen lokal und API-basiert

---

### 7.5 Prompt-Generierung auf Basis von Templates

Die Applikation muss die Eingaben des Nutzers mit den hinterlegten Templates und Beispielen kombinieren, um daraus einen strukturierten Prompt zu erzeugen.

**Muss-Anforderungen:**

- Zusammenführen von Nutzereingabe, Fragetyp, Schwierigkeit und Beispiel
- Nutzung eines pro Fragetyp hinterlegten Templates
- reproduzierbare Prompt-Struktur

**Kann-Anforderungen:**

- Anzeige des finalen Prompts für fortgeschrittene Nutzer
- Bearbeitung des generierten Prompts vor dem Absenden
- Versionierung von Templates

---

### 7.6 Vorschaufenster

Die rechte Hälfte der Benutzeroberfläche soll ein Vorschaufenster enthalten. Dort soll die generierte Aufgabe für den Nutzer nachvollziehbar dargestellt werden.

Da Beispiele für die Vorschau bereits vorliegen, sollen diese als Grundlage für die Darstellung verwendet werden.

**Muss-Anforderungen:**

- feste Platzierung der Vorschau in der rechten Bildschirmhälfte
- Darstellung der generierten Aufgabe in lesbarer Form
- Darstellung aktualisierter Inhalte nach jeder Generierung
- Trennung zwischen Rohdaten/XML und benutzerfreundlicher Vorschau

**Kann-Anforderungen:**

- Umschalten zwischen Vorschauansicht und XML-Ansicht
- Syntaxhervorhebung für XML
- Validierungshinweise bei fehlerhafter Struktur
- Vergleich zwischen Beispiel und generiertem Ergebnis

---

### 7.7 Ausgabe im Moodle XML Format

Die Webapplikation muss die generierten Fragen im korrekten Moodle-XML-Format erzeugen.

**Muss-Anforderungen:**

- Erzeugung valider Moodle-XML-Strukturen
- Berücksichtigung des ausgewählten Fragetypen
- Export oder Kopiermöglichkeit der XML-Ausgabe

**Kann-Anforderungen:**

- Download als `.xml`-Datei
- Export mehrerer Fragen in einer Datei
- XML-Validierung vor Export

---

### 7.8 Nutzung von Templates und Beispielen

Für jeden unterstützten Fragetyp liegen Templates und Beispiele vor. Diese sollen in der Anwendung nicht nur technisch hinterlegt, sondern auch nutzbar und nachvollziehbar dargestellt werden.

**Muss-Anforderungen:**

- Speicherung von Templates pro Fragetyp
- Speicherung mindestens eines Beispiels pro Fragetyp
- Anzeige des Beispiels in der Oberfläche
- Einbezug in die Generierung

**Kann-Anforderungen:**

- Bearbeitung der Templates durch berechtigte Nutzer
- Import/Export von Template-Sammlungen
- mehrere Beispiele pro Fragetyp

---

### 7.9 Speicherung in einer Datenbank

Die erzeugten Fragen sollen dauerhaft in einer Datenbank gespeichert werden. Dadurch sollen bereits erzeugte Inhalte erneut genutzt, geprüft, gefiltert und exportiert werden können.

**Muss-Anforderungen:**

- Speicherung generierter Fragen in einer Datenbank
- Speicherung zentraler Metadaten wie Fragetyp, Schwierigkeit, Modell, Erstellungszeitpunkt und XML-Ausgabe
- erneutes Laden gespeicherter Fragen in die Oberfläche
- Trennung zwischen Vorlagen-/Beispieldaten und erzeugten Fragedaten

**Kann-Anforderungen:**

- Such- und Filterfunktionen für gespeicherte Fragen
- Versionierung oder Historie von Änderungen
- Kennzeichnung von freigegebenen, geprüften oder favorisierten Fragen

---

### 7.10 Fehlerbehandlung

**Muss-Anforderungen:**

- verständliche Fehlermeldung bei nicht erreichbarer API
- verständliche Fehlermeldung bei lokalem Modellfehler
- Fehlermeldung bei ungültiger XML-Struktur
- Hinweis bei fehlenden Pflichteingaben
- Fehlermeldung bei Problemen mit der Datenbankverbindung

**Kann-Anforderungen:**

- technische Detailansicht für Administratoren
- Protokollierung von Fehlern

---

## 8. Nichtfunktionale Anforderungen

### 8.1 Benutzerfreundlichkeit

- intuitive Bedienoberfläche
- klare Trennung von Eingabe und Vorschau
- geringe Einarbeitungszeit
- gut lesbare Darstellung auf typischen Bildschirmgrößen

### 8.2 Performance

- zügige Reaktion der Oberfläche
- sichtbare Ladeanzeige während der Generierung
- keine Blockierung der Oberfläche während langer Modellanfragen
- speicherbare Fragen sollen ohne spürbare Verzögerung abrufbar sein

### 8.3 Wartbarkeit

- Fragetypen, Templates und Beispiele sollen modular verwaltbar sein
- neue Modelle und Fragetypen sollen erweiterbar sein
- saubere Trennung von Frontend, Backend, Datenhaltung und Modellanbindung

### 8.4 Sicherheit und Datenschutz

- sichere Speicherung von API-Schlüsseln
- Trennung von Benutzeroberfläche und sensibler Konfiguration
- Möglichkeit zum lokalen Betrieb ohne externe Datenübertragung
- nachvollziehbarer Umgang mit übertragenen Eingaben
- Schutz gespeicherter Daten vor unberechtigtem Zugriff

### 8.5 Kompatibilität

- Nutzung in aktuellen Browsern
- Ausgabe kompatibel zu Moodle-Importprozessen

### 8.6 Bereitstellung und Deployment

- Die Anwendung soll containerisiert bereitgestellt werden.
- Der Betrieb soll in mindestens einem **Dockercontainer** möglich sein.
- Die Bereitstellung soll reproduzierbar und einfach installierbar sein.
- Konfigurationen wie Ports, Modellzugänge, API-Schlüssel und Datenbankzugänge sollen über Umgebungsvariablen oder vergleichbare Mechanismen verwaltbar sein.

---

## 9. Benutzerrollen

### 9.1 Standardnutzer

Darf:

- Fragen formulieren
- Fragetyp und Schwierigkeit auswählen
- Modell auswählen
- Vorschau ansehen
- Moodle-XML erzeugen und exportieren
- gespeicherte eigene oder freigegebene Fragen laden

### 9.2 Administrator

Darf zusätzlich:

- Templates verwalten
- Beispiele verwalten
- Modellquellen konfigurieren
- API-Einstellungen pflegen
- lokale Modelle einbinden
- Datenbankanbindung konfigurieren
- Container-Konfiguration für den Betrieb vorbereiten

---

## 10. Systemkontext

### Eingaben

- freie Aufgabenbeschreibung des Nutzers
- Auswahl von Fragetyp, Schwierigkeit und Modell
- Templates und Beispiele aus interner Datenhaltung

### Verarbeitung

- Prompt-Zusammenstellung
- Aufruf eines externen oder lokalen LLMs
- Rückgabeanalyse
- Erstellung einer Vorschau
- Umwandlung in Moodle XML
- Speicherung der Ergebnisse in einer Datenbank

### Ausgaben

- menschenlesbare Vorschau
- XML-Rohformat
- exportierbare Moodle-XML-Datei
- gespeicherter Datensatz für spätere Wiederverwendung

---

## 11. Schnittstellen

### 11.1 Schnittstellen zu externen LLM-APIs

Die Anwendung soll externe KI-Dienste über standardisierte APIs ansprechen können.

**Erwartete Eigenschaften:**

- Übergabe eines Prompts
- Empfang strukturierter Textantworten
- Authentifizierung per API-Schlüssel

### 11.2 Schnittstellen zu lokalen Modellen

Die Anwendung soll lokale LLM-Dienste ansprechen können.

**Erwartete Eigenschaften:**

- Aufruf über lokale Endpunkte oder lokale Laufzeitumgebung
- Modellwahl aus verfügbaren lokalen Modellen
- Rückgabe generierter Inhalte an das Backend

### 11.3 Schnittstelle zur Datenbank

Die Anwendung soll eine Datenbank zur Ablage von Konfigurations- und Fragedaten nutzen.

**Erwartete Eigenschaften:**

- Speichern, Lesen und Aktualisieren relevanter Datensätze
- Trennung von Stammdaten und generierten Inhalten
- stabile Verbindung zwischen Anwendung und Datenbank

### 11.4 Schnittstelle zum Export

- Bereitstellung der Ausgabe als Moodle XML
- Kopier- und Downloadfunktion

---

## 12. Datenhaltung

Mindestens folgende Datenobjekte sind erforderlich:

- Fragetyp
- Template
- Beispiel
- Modellkonfiguration
- generierte Frage
- Generierungsergebnis
- XML-Ausgabe
- Erstellungszeitpunkt
- Exportdaten

**Kann optional enthalten:**

- Benutzerprofile
- Historie der Generierungen
- Favoriten und Vorlagen
- Freigabestatus oder Prüfstatus

Die Daten sollen in einer persistenten Datenbank gespeichert werden.

---

## 13. Qualitätsanforderungen

Besonders wichtig sind:

- korrekte XML-Ausgabe
- fachlich sinnvolle Fragen
- gute Nachvollziehbarkeit für den Nutzer
- stabile Modellanbindung
- zuverlässige Speicherung in der Datenbank
- reproduzierbarer Betrieb im Container
- schnelle Bedienbarkeit

---

## 14. Abgrenzung

Nicht Bestandteil dieses Lastenhefts sind zunächst:

- automatische Bewertung der erzeugten Fragenqualität
- direkte Synchronisation mit einer Moodle-Instanz
- umfassende Benutzer- und Rechteverwaltung mit Mandantenfähigkeit
- mobile Optimierung für Smartphones als Hauptnutzungsszenario
- verteilte Container-Orchestrierung, sofern diese nicht gesondert gefordert wird

---

## 15. Muss-Kriterien zur Abnahme

Das Produkt gilt als im Kern funktionsfähig, wenn mindestens folgende Punkte erfüllt sind:

1. Der Nutzer kann eine Aufgabenbeschreibung eingeben.
2. Der Nutzer kann Fragetyp und Schwierigkeitsgrad auswählen.
3. Der Nutzer kann zwischen API-basierten und lokalen Modellen wählen.
4. Für jeden Fragetyp können Template und Beispiel hinterlegt und genutzt werden.
5. Die Anwendung erzeugt auf Basis der Eingaben eine KI-generierte Frage.
6. Die rechte Bildschirmhälfte zeigt eine Vorschau der generierten Aufgabe.
7. Die Ausgabe kann als Moodle XML angezeigt und exportiert werden.
8. Generierte Fragen werden in einer Datenbank gespeichert und erneut abrufbar gemacht.
9. Die Anwendung ist in einem Dockercontainer lauffähig bereitstellbar.

---

## 16. Wunschkriterien

- Mehrfachgenerierung in einem Lauf
- Vergleich mehrerer Modelle
- XML-Validierung in Echtzeit
- Historie der letzten Generierungen
- Bearbeitung und manuelle Nachkorrektur vor Export
- Import eigener Templates durch Administratoren
- Container-Start zusammen mit Datenbank über Docker Compose oder vergleichbare Mechanismen

---

## 17. Risiken

- unterschiedliche Qualität der Antworten je nach Modell
- lokale Modelle können langsamer oder weniger präzise sein
- XML-Strukturen können bei ungeeigneter Generierung fehlerhaft werden
- API-Kosten können bei intensiver Nutzung steigen
- unterschiedliche Moodle-Fragetypen benötigen teils sehr spezifische Strukturen
- Datenbankmodell und Persistenzlogik müssen sauber geplant werden
- Containerbetrieb kann zusätzliche Konfiguration für Modell- und Datenbankzugriffe erfordern

---

## 18. Offene Punkte

- Welche konkreten Moodle-Fragetypen werden in der ersten Version unterstützt?
- Welche lokalen Modelllaufzeiten oder Dienste sollen angebunden werden?
- Welche Datenbank soll eingesetzt werden?
- Sollen Generierungen nur gespeichert oder auch versioniert werden?
- Soll die Vorschau rein didaktisch-lesbar oder zusätzlich Moodle-nah visualisiert sein?
- Sollen mehrere Fragen auf einmal erzeugt werden können?
- Soll die Datenbank im selben Container, in einem separaten Container oder extern betrieben werden?

---

## 19. Zusammenfassung

Es soll eine Webapplikation entwickelt werden, die mithilfe von KI automatisch Moodle-Fragen im Moodle-XML-Format erzeugt. Der Nutzer gibt eine Aufgabenbeschreibung ein und wählt Fragetyp, Schwierigkeit und Modell. Die Anwendung nutzt hinterlegte Templates und Beispiele, generiert daraus passende Fragen, zeigt eine Vorschau in der rechten Bildschirmhälfte an, speichert die Ergebnisse in einer Datenbank und stellt die Ausgabe als Moodle XML bereit. Neben API-basierten LLMs sollen auch lokale Modelle unterstützt werden. Die Bereitstellung der Anwendung soll containerisiert erfolgen, sodass ein Betrieb in einem Dockercontainer möglich ist.
