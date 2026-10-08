import { BookForm } from "./components/BookForm";
import { BookList } from "./components/BookList";
import { FilterBar } from "./components/FilterBar";
import { StatsBar } from "./components/StatsBar";
import { BooksProvider } from "./state/BooksContext";

export default function App() {
  return (
    <BooksProvider>
      <div className="app">
        <header className="page-header">
          <div className="page-header__titles">
            <h1 className="page-header__title">Leseliste</h1>
            <p className="page-header__subtitle">Bücher, Lesestatus und Bewertungen</p>
          </div>
          <StatsBar />
        </header>

        <main className="page-main">
          <section className="page-region page-region--form" aria-label="Buch anlegen">
            <BookForm />
          </section>
          <section className="page-region page-region--filters" aria-label="Filter">
            <FilterBar />
          </section>
          <section className="page-region page-region--list" aria-label="Bücherliste">
            <BookList />
          </section>
        </main>
      </div>
    </BooksProvider>
  );
}
