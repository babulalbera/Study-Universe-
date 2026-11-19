import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import BookmarkButton from "@/features/bookmarks/BookmarkButton";
import FolderFavButton from "@/features/bookmarks/FolderFavButton";
import { getFavorites } from "@/features/bookmarks/queries";
import { getUser } from "@/lib/auth";
import "@/features/bookmarks/bookmarks.css";

export const metadata: Metadata = { title: "Meri Favorites" };

export default async function FavoritesPage() {
  const user = await getUser();
  if (!user) {
    return (
      <>
        <PageHeader title="❤ Meri Favorites" subtitle="Login karne par yahan tumhari saved Books, Tests aur Folders dikhenge." />
        <div className="su-row">
          <Link className="su-btn su-btn-primary" href="/login?next=/profile/favorites">Login</Link>
        </div>
      </>
    );
  }

  const { books, tests, folders } = await getFavorites();

  return (
    <>
      <PageHeader title="❤ Meri Favorites" subtitle="Jo Books, Tests aur Folders tumne save kiye, sab yahan hain." />
      <div className="su-row" style={{ marginTop: 0 }}>
        <Link className="su-btn su-btn-ghost" href="/profile">← Profile</Link>
      </div>

      {books.length === 0 && tests.length === 0 && folders.length === 0 ? (
        <EmptyState icon="🤍" title="Abhi kuch save nahi hai" text="Books page par kisi book ke ❤ ko dabao, ya Courses me kisi Folder ke ❤ ko dabao, wo yahan aa jayega." />
      ) : null}

      {folders.length > 0 ? (
        <section id="folders" style={{ scrollMarginTop: 72 }}>
          <h3 style={{ margin: "16px 0 10px" }}>📁 Saved Folders ({folders.length})</h3>
          <div className="su-list">
            {folders.map((f) => (
              <div key={f.id} className="su-item">
                <div style={{ minWidth: 0 }}>
                  <h3>{f.title}</h3>
                  <p>{f.course_title}</p>
                </div>
                <div className="pr-act">
                  <FolderFavButton folderId={f.id} initialSaved />
                  <Link className="su-btn su-btn-primary" href={`/courses/${f.course_id}?folder=${f.id}`}>📁 Kholo</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {books.length > 0 ? (
        <section id="books" style={{ scrollMarginTop: 72 }}>
          <h3 style={{ margin: "16px 0 10px" }}>📚 Saved Books ({books.length})</h3>
          <div className="su-list">
            {books.map((b) => (
              <div key={b.id} className="su-item">
                <div style={{ minWidth: 0 }}>
                  <h3>{b.title}</h3>
                  <p>{b.author || "PDF"}</p>
                </div>
                <div className="pr-act">
                  <BookmarkButton type="book" id={b.id} initialSaved />
                  <a className="su-btn su-btn-primary" href={`/books/${b.id}/open`} target="_blank" rel="noopener noreferrer">📖 Kholo</a>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {tests.length > 0 ? (
        <section id="tests" style={{ scrollMarginTop: 72 }}>
          <h3 style={{ margin: "16px 0 10px" }}>📝 Saved Tests ({tests.length})</h3>
          <div className="su-list">
            {tests.map((t) => (
              <div key={t.id} className="su-item">
                <div style={{ minWidth: 0 }}><h3>{t.title}</h3></div>
                <div className="pr-act">
                  <BookmarkButton type="test" id={t.id} initialSaved />
                  <Link className="su-btn su-btn-primary" href={`/mock-tests/${t.id}`}>Shuru</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
