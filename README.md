# Leseliste

Die Leseliste ist eine kleine Web-App, mit der man seine Bücher verwaltet: jedes
Buch hat Titel, Autor, einen Lesestatus (geplant, lese gerade, gelesen) und eine
Bewertung von 1 bis 5 Sternen. Die Liste lässt sich nach Status filtern und über
Titel und Autor durchsuchen, eine Statistik zählt die Bücher, die im laufenden
Kalenderjahr als gelesen abgeschlossen wurden. Das Go-Backend hält alle Daten in
einer JSON-Datei auf der Platte, das React-Frontend spricht es über eine
REST-API an.

## Tech-Stack

- **Backend**: Go, ausschließlich Standardbibliothek (`net/http`, `encoding/json`)
- **Persistenz**: eine JSON-Datei auf der Platte, kein Datenbankserver
- **Frontend**: Vite + React + TypeScript
- **Backend-Tests**: `go test` mit `httptest`
- **Frontend-Tests**: Vitest für Filter-, Such- und Statistiklogik

## Installation und Start

### Backend

Im Verzeichnis `backend/`:

```bash
go run .
```

Standardmäßig lauscht der Server auf Port `8080` und legt seine Daten in
`data/books.json` ab. Beides lässt sich über Umgebungsvariablen ändern:

```bash
PORT=9000 BOOKS_FILE=/tmp/meine-buecher.json go run .
```

Beim ersten Start existiert die Datei noch nicht — die Liste ist dann leer. Ein
Neustart lädt alle zuvor gespeicherten Bücher wieder.

### Frontend

Im Verzeichnis `frontend/`:

```bash
npm install
npm run dev
```

Der Vite-Dev-Server läuft auf `http://localhost:5173`. Die Basis-URL des
Backends wird über die Umgebungsvariable `VITE_API_BASE_URL` gesetzt und fällt
ohne Angabe auf `http://localhost:8080` zurück. Das Backend erlaubt genau diesen
Frontend-Ursprung per CORS.

## API

Basis: `http://localhost:8080`. Alle Antworten sind JSON. Der Fehlerkörper ist
immer `{"error":{"code":string,"message":string}}` mit den Codes
`invalid_input` (400) und `not_found` (404).

| Methode | Pfad | Body | Antwort |
| --- | --- | --- | --- |
| GET | `/api/health` | – | `200 {"status":"ok"}` |
| GET | `/api/books` | – | `200 {"books":[Book]}` |
| POST | `/api/books` | `{"title":string,"author":string}` | `201 Book` \| `400` |
| PUT | `/api/books/{id}` | `{"title":string,"author":string}` | `200 Book` \| `400` \| `404` |
| PUT | `/api/books/{id}/status` | `{"status":"planned"\|"reading"\|"read"}` | `200 Book` \| `400` \| `404` |
| PUT | `/api/books/{id}/rating` | `{"rating":1..5\|null}` | `200 Book` \| `400` \| `404` |
| DELETE | `/api/books/{id}` | – | `204` \| `404` |

Ein `Book` sieht so aus:

```json
{
  "id": "b1c2d3",
  "title": "Dune",
  "author": "Frank Herbert",
  "status": "reading",
  "rating": 5,
  "finishedAt": null
}
```

`finishedAt` wird gesetzt, sobald der Status `read` wird, und wieder geleert,
sobald er den Status `read` verlässt.

## Umgebungsvariablen (Backend)

| Variable | Standard | Bedeutung |
| --- | --- | --- |
| `PORT` | `8080` | Port, auf dem der HTTP-Server lauscht |
| `BOOKS_FILE` | `data/books.json` | Pfad zur JSON-Datei mit den Büchern |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | erlaubter CORS-Ursprung des Frontends |

## Funktionen

- Bücher anlegen, bearbeiten und löschen
- Lesestatus umschalten (geplant, lese gerade, gelesen)
- Bewertung mit 1 bis 5 Sternen setzen
- Filtern nach Status und Suchen über Titel und Autor
- Jahresstatistik der gelesenen Bücher
- persistente Speicherung in einer JSON-Datei
