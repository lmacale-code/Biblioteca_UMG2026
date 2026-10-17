import { useCallback, useEffect, useState } from "react";
import { getBooks, getUserRole, saveBook } from "../libros/api.js";

const buttonStyle = {
  padding: "8px 11px",
  border: "1px solid #c9dce9",
  borderRadius: 4,
  background: "#fff",
  color: "#14517a",
  cursor: "pointer",
  fontWeight: 650,
};

export default function Inventario() {
  const allowed = ["admin", "encargado"].includes(getUserRole());
  const [books, setBooks] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const firstPage = await getBooks({ page: "1", limit: "100" });
      let allBooks = firstPage.items;
      const pageCount = Math.ceil(Number(firstPage.total) / Number(firstPage.limit));
      for (let page = 2; page <= pageCount; page += 1) {
        const result = await getBooks({ page: String(page), limit: String(firstPage.limit) });
        allBooks = allBooks.concat(result.items);
      }
      setBooks(allBooks);
      setDrafts(Object.fromEntries(allBooks.map((book) => [book.id, String(book.total_ejemplares)])));
    } catch (requestError) {
      setError(requestError.message || "No fue posible cargar el inventario.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  async function updateTotal(book) {
    const total = Number(drafts[book.id]);
    if (!Number.isSafeInteger(total) || total < 0) {
      setError("El total debe ser un número entero igual o mayor que cero.");
      return;
    }
    setSavingId(book.id);
    setError("");
    setNotice("");
    try {
      await saveBook(book.id, { total_ejemplares: total });
      setNotice(`Se actualizó el inventario de "${book.titulo}".`);
      await loadInventory();
    } catch (requestError) {
      setError(requestError.message || "No fue posible actualizar las existencias.");
    } finally {
      setSavingId(null);
    }
  }

  if (!allowed) {
    return (
      <section className="module-page" aria-labelledby="module-title">
        <div className="module-heading">
          <p className="eyebrow">Existencias</p>
          <h1 id="module-title">Inventario</h1>
        </div>
        <div className="module-card"><p>El inventario está disponible únicamente para administración y encargados.</p></div>
      </section>
    );
  }

  return (
    <section className="module-page" aria-labelledby="module-title">
      <div className="module-heading">
        <p className="eyebrow">Existencias</p>
        <h1 id="module-title">Inventario</h1>
        <p className="module-description">
          Consulta y ajusta las existencias de cada título. Los ejemplares prestados no se modifican desde este módulo.
        </p>
      </div>
      <div className="module-card" style={{ display: "block", marginTop: 28 }}>
        {error && <p role="alert" style={{ color: "#a32828" }}>{error}</p>}
        {notice && <p role="status" style={{ color: "#247448" }}>{notice}</p>}
        {loading ? (
          <p role="status">Cargando inventario…</p>
        ) : books.length === 0 ? (
          <p>No hay libros activos para mostrar.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #d8e4ed", color: "#57718a" }}>
                  {["Libro", "Categoría", "Total", "Disponibles", "Prestados", "Ajustar total"].map((label) => (
                    <th scope="col" key={label} style={{ padding: "12px 10px", fontSize: "0.82rem" }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {books.map((book) => {
                  const total = Number(book.total_ejemplares);
                  const available = Number(book.ejemplares_disponibles);
                  const borrowed = total - available;
                  const exhausted = available === 0;
                  const fewCopies = available > 0 && available <= 2;
                  return (
                    <tr key={book.id} style={{
                      borderBottom: "1px solid #e4edf3",
                      background: exhausted ? "#fff0ef" : fewCopies ? "#fff8e8" : "transparent",
                    }}>
                      <td style={{ padding: "13px 10px", color: "#17314e", fontWeight: 650 }}>{book.titulo}<small style={{ display: "block", marginTop: 4, color: "#6d8095", fontWeight: 400 }}>{book.autor}</small></td>
                      <td style={{ padding: "13px 10px", color: "#536b82" }}>{book.categoria_nombre || book.categoria}</td>
                      <td style={{ padding: "13px 10px" }}>{total}</td>
                      <td style={{ padding: "13px 10px", fontWeight: 700, color: exhausted ? "#a32828" : fewCopies ? "#8b5b00" : "#247448" }}>
                        {available}{exhausted ? " · Agotado" : fewCopies ? " · Pocas copias" : ""}
                      </td>
                      <td style={{ padding: "13px 10px" }}>{borrowed}</td>
                      <td style={{ padding: "13px 10px", whiteSpace: "nowrap" }}>
                        <label htmlFor={`total-${book.id}`} style={{ position: "absolute", left: "-10000px" }}>Nuevo total para {book.titulo}</label>
                        <input
                          id={`total-${book.id}`}
                          type="number"
                          min="0"
                          step="1"
                          value={drafts[book.id] ?? ""}
                          onChange={(event) => setDrafts((current) => ({ ...current, [book.id]: event.target.value }))}
                          style={{ width: 92, minHeight: 36, padding: "5px 8px", border: "1px solid #c9dce9", borderRadius: 4 }}
                        />
                        <button
                          type="button"
                          disabled={savingId === book.id || Number(drafts[book.id]) === total}
                          onClick={() => updateTotal(book)}
                          style={{ ...buttonStyle, marginLeft: 7 }}
                        >
                          {savingId === book.id ? "Guardando…" : "Guardar"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
