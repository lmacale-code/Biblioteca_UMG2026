import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  getBooks,
  getCategories,
  getUserRole,
  removeBook,
  saveBook,
  saveCategory,
} from "./api.js";
import "./libros.css";

const actionButton = {
  padding: "9px 13px",
  border: "1px solid #c9dce9",
  borderRadius: 4,
  background: "#fff",
  color: "#14517a",
  cursor: "pointer",
  fontWeight: 650,
};
const fieldStyle = {
  minHeight: 42,
  width: "100%",
  padding: "8px 11px",
  border: "1px solid #c9dce9",
  borderRadius: 4,
  background: "#fff",
  color: "#17314e",
};

function categoryList(payload) {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.items) ? payload.items : [];
}

export default function Libros() {
  const canManage = ["admin", "encargado"].includes(getUserRole());
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalBook, setModalBook] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getBooks({
        q: query,
        categoria_id: categoryId,
        page: String(page),
        limit: "10",
      });
      setBooks(result.items);
      setTotal(Number(result.total));
    } catch (requestError) {
      setError(requestError.message || "No fue posible cargar el catálogo.");
    } finally {
      setLoading(false);
    }
  }, [categoryId, page, query]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    let active = true;
    getCategories()
      .then((result) => {
        if (active) setCategories(categoryList(result));
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "No fue posible cargar las categorías.");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!modalBook) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modalBook]);

  async function submitSearch(event) {
    event.preventDefault();
    setPage(1);
    setQuery(queryInput.trim());
  }

  async function submitBook(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const book = {
      titulo: form.get("titulo").trim(),
      autor: form.get("autor").trim(),
      isbn: form.get("isbn").trim(),
      categoria_id: Number(form.get("categoria_id")),
      anio: Number(form.get("anio")),
      total_ejemplares: Number(form.get("total_ejemplares")),
    };

    setSaving(true);
    setError("");
    try {
      await saveBook(modalBook?.id, book);
      setModalBook(null);
      await loadBooks();
    } catch (requestError) {
      setError(requestError.message || "No fue posible guardar el libro.");
    } finally {
      setSaving(false);
    }
  }

  async function addCategory() {
    const nombre = newCategoryName.trim();
    if (!nombre?.trim()) return;
    setError("");
    try {
      const category = await saveCategory(nombre.trim());
      setCategories((current) => [...current, category].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")));
      setSelectedCategoryId(String(category.id));
      setNewCategoryName("");
    } catch (requestError) {
      setError(requestError.message || "No fue posible crear la categoría.");
    }
  }

  async function handleDelete(book) {
    if (!window.confirm(`¿Eliminar "${book.titulo}" del catálogo?`)) return;
    setError("");
    try {
      await removeBook(book.id);
      if (books.length === 1 && page > 1) {
        setPage((current) => current - 1);
        return;
      }
      await loadBooks();
    } catch (requestError) {
      setError(requestError.message || "No fue posible eliminar el libro.");
    }
  }

  const pages = Math.max(1, Math.ceil(total / 10));

  return (
    <section className="module-page" aria-labelledby="module-title">
      <div className="module-heading">
        <p className="eyebrow">Catálogo</p>
        <h1 id="module-title">Libros</h1>
        <p className="module-description">
          Consulta la colección bibliográfica y la disponibilidad de cada título.
        </p>
      </div>

      <div className="module-card" style={{ display: "block", marginTop: 28 }}>
        <form
          onSubmit={submitSearch}
          style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}
        >
          <label htmlFor="book-search" style={{ position: "absolute", left: "-10000px" }}>
            Buscar libros
          </label>
          <input
            id="book-search"
            aria-label="Buscar por título, autor o ISBN"
            placeholder="Buscar por título, autor o ISBN"
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            style={{ ...fieldStyle, flex: "1 1 250px" }}
          />
          <label htmlFor="category-filter" style={{ position: "absolute", left: "-10000px" }}>
            Filtrar por categoría
          </label>
          <select
            id="category-filter"
            value={categoryId}
            onChange={(event) => {
              setPage(1);
              setCategoryId(event.target.value);
            }}
            style={{ ...fieldStyle, flex: "0 1 230px" }}
          >
            <option value="">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.nombre}</option>
            ))}
          </select>
          <button type="submit" style={actionButton}>Buscar</button>
          {canManage && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategoryId("");
                setModalBook({});
              }}
              style={{ ...actionButton, borderColor: "#0879bd", background: "#0879bd", color: "#fff" }}
            >
              Agregar libro
            </button>
          )}
        </form>

        {error && !modalBook && <p role="alert" style={{ color: "#a32828", margin: "18px 0 0" }}>{error}</p>}
        {loading ? (
          <p role="status" style={{ color: "#6d8095", margin: "24px 0 0" }}>Cargando catálogo…</p>
        ) : books.length === 0 ? (
          <p style={{ color: "#6d8095", margin: "24px 0 0" }}>No se encontraron libros.</p>
        ) : (
          <div style={{ overflowX: "auto", marginTop: 22 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #d8e4ed", color: "#57718a" }}>
                  {["Título", "Autor", "ISBN", "Categoría", "Ejemplares", "Disponibilidad", ...(canManage ? ["Acciones"] : [])].map((label) => (
                    <th key={label} scope="col" style={{ padding: "12px 10px", fontSize: "0.82rem" }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {books.map((book) => {
                  const available = Number(book.ejemplares_disponibles);
                  return (
                    <tr key={book.id} style={{ borderBottom: "1px solid #e4edf3" }}>
                      <td style={{ padding: "13px 10px", color: "#17314e", fontWeight: 650 }}>{book.titulo}</td>
                      <td style={{ padding: "13px 10px", color: "#536b82" }}>{book.autor}</td>
                      <td style={{ padding: "13px 10px", color: "#536b82" }}>{book.isbn || "—"}</td>
                      <td style={{ padding: "13px 10px", color: "#536b82" }}>{book.categoria_nombre || book.categoria}</td>
                      <td style={{ padding: "13px 10px", color: "#536b82" }}>{available} de {book.total_ejemplares}</td>
                      <td style={{ padding: "13px 10px" }}>
                        <span style={{
                          padding: "5px 8px",
                          borderRadius: 3,
                          background: available > 0 ? "#e8f7ee" : "#fff0ef",
                          color: available > 0 ? "#247448" : "#a32828",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                        }}>
                          {available > 0 ? "Disponible" : "Agotado"}
                        </span>
                      </td>
                      {canManage && (
                        <td style={{ padding: "13px 10px", whiteSpace: "nowrap" }}>
                          <button type="button" onClick={() => {
                            setSelectedCategoryId(String(book.categoria_id));
                            setModalBook(book);
                          }} style={actionButton}>Editar</button>
                          <button type="button" onClick={() => handleDelete(book)} style={{ ...actionButton, marginLeft: 7 }}>Eliminar</button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && pages > 1 && (
          <nav aria-label="Paginación del catálogo" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, marginTop: 22 }}>
            <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} style={actionButton}>Anterior</button>
            <span aria-live="polite">Página {page} de {pages}</span>
            <button type="button" disabled={page >= pages} onClick={() => setPage((current) => current + 1)} style={actionButton}>Siguiente</button>
          </nav>
        )}
      </div>

      {modalBook && createPortal(
        <div
          className="libros-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) setModalBook(null);
          }}
        >
          <section className="libros-modal" role="dialog" aria-modal="true" aria-labelledby="book-form-title">
            <h2 id="book-form-title">{modalBook.id ? "Editar libro" : "Agregar libro"}</h2>
            {error && <p role="alert" className="libros-form-error">{error}</p>}
            <form className="libros-form" onSubmit={submitBook}>
              <label>Título<input name="titulo" required maxLength="255" defaultValue={modalBook.titulo || ""} style={fieldStyle} /></label>
              <label>Autor<input name="autor" required maxLength="255" defaultValue={modalBook.autor || ""} style={fieldStyle} /></label>
              <label>ISBN<input name="isbn" required maxLength="20" defaultValue={modalBook.isbn || ""} style={fieldStyle} /></label>
              <label>Categoría
                <span className="libros-form-row">
                  <select name="categoria_id" required value={selectedCategoryId} onChange={(event) => setSelectedCategoryId(event.target.value)} style={fieldStyle}>
                    <option value="" disabled>Selecciona una categoría</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}
                  </select>
                </span>
              </label>
              <label>Nueva categoría
                <span className="libros-form-row libros-category-row">
                  <input value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} maxLength="100" style={fieldStyle} />
                  <button type="button" onClick={addCategory} style={actionButton}>Crear categoría</button>
                </span>
              </label>
              <label>Año<input name="anio" type="number" required min="1" defaultValue={modalBook.anio ?? ""} style={fieldStyle} /></label>
              <label>Total de ejemplares<input name="total_ejemplares" type="number" required min="0" defaultValue={modalBook.total_ejemplares ?? 0} style={fieldStyle} /></label>
              <div className="libros-form-actions">
                <button type="button" disabled={saving} onClick={() => setModalBook(null)} style={actionButton}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ ...actionButton, borderColor: "#0879bd", background: "#0879bd", color: "#fff" }}>
                  {saving ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>
          </section>
        </div>,
        document.body,
      )}
    </section>
  );
}
