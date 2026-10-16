import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client.js";
import "./socios.css";

const emptyForm = {
  nombre: "",
  email: "",
  carnet: "",
  telefono: "",
  tipo_socio: "estudiante",
};

export default function Socios() {
  const [socios, setSocios] = useState([]);
  const [query, setQuery] = useState("");
  const [tipo, setTipo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const parameters = new URLSearchParams();
    if (query.trim()) parameters.set("q", query.trim());
    if (tipo) parameters.set("tipo", tipo);

    setLoading(true);
    setError("");
    apiRequest(`/socios?${parameters.toString()}`, { signal: controller.signal })
      .then((result) => setSocios(result.socios ?? []))
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [query, tipo, refreshKey]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(socio) {
    setEditingId(socio.id);
    setForm({
      nombre: socio.nombre ?? "",
      email: socio.email ?? "",
      carnet: socio.carnet ?? "",
      telefono: socio.telefono ?? "",
      tipo_socio: socio.tipo_socio ?? "estudiante",
    });
    setError("");
    setModalOpen(true);
  }

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function saveSocio(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const endpoint = editingId ? `/socios/${editingId}` : "/socios";
      await apiRequest(endpoint, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      setModalOpen(false);
      setNotice(editingId ? "Los datos del socio se actualizaron." : "El socio se registró correctamente.");
      setRefreshKey((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function deactivateSocio(socio) {
    if (!window.confirm(`¿Deseas desactivar a ${socio.nombre}?`)) return;
    setError("");
    setNotice("");
    try {
      const result = await apiRequest(`/socios/${socio.id}`, { method: "DELETE" });
      setNotice(result.mensaje ?? "Socio desactivado correctamente.");
      setRefreshKey((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function isActive(value) {
    return value === true || value === 1;
  }

  return (
    <section className="module-page socios-page" aria-labelledby="module-title">
      <div className="module-heading">
        <p className="eyebrow">Comunidad universitaria</p>
        <h1 id="module-title">Socios</h1>
        <p className="module-description">Consulta y administra las cuentas de socios de la biblioteca.</p>
      </div>

      <div className="socios-toolbar">
        <label className="socios-field">
          <span>Buscar socio</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nombre, carnet o correo"
            type="search"
            value={query}
          />
        </label>
        <label className="socios-field">
          <span>Tipo de socio</span>
          <select onChange={(event) => setTipo(event.target.value)} value={tipo}>
            <option value="">Todos</option>
            <option value="estudiante">Estudiante</option>
            <option value="docente">Docente</option>
          </select>
        </label>
        <button className="socios-primary-button" onClick={openCreate} type="button">
          Nuevo socio
        </button>
      </div>

      {error && !modalOpen && <p className="socios-alert" role="alert">{error}</p>}
      {notice && <p className="socios-notice" role="status">{notice}</p>}

      <div className="socios-table-wrap">
        <table className="socios-table">
          <thead>
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">Correo</th>
              <th scope="col">Carnet</th>
              <th scope="col">Tipo</th>
              <th scope="col">Teléfono</th>
              <th scope="col">Estado</th>
              <th scope="col"><span className="visually-hidden">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="socios-table-state" colSpan="7">Cargando socios...</td></tr>
            )}
            {!loading && socios.length === 0 && (
              <tr><td className="socios-table-state" colSpan="7">No se encontraron socios.</td></tr>
            )}
            {!loading && socios.map((socio) => {
              const active = isActive(socio.activo);
              return (
                <tr key={socio.id}>
                  <td className="socios-name">{socio.nombre}</td>
                  <td>{socio.email}</td>
                  <td>{socio.carnet}</td>
                  <td>{socio.tipo_socio === "docente" ? "Docente" : "Estudiante"}</td>
                  <td>{socio.telefono || "—"}</td>
                  <td><span className={`socios-status ${active ? "is-active" : "is-inactive"}`}>
                    {active ? "Activo" : "Inactivo"}
                  </span></td>
                  <td className="socios-row-actions">
                    <button className="socios-text-button" onClick={() => openEdit(socio)} type="button">
                      Editar
                    </button>
                    <button
                      className="socios-text-button is-danger"
                      disabled={!active}
                      onClick={() => deactivateSocio(socio)}
                      type="button"
                    >
                      Desactivar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="socios-overlay">
          <section aria-labelledby="socios-dialog-title" aria-modal="true" className="socios-dialog" role="dialog">
            <div className="socios-dialog-header">
              <div>
                <p className="socios-dialog-eyebrow">Registro bibliotecario</p>
                <h2 id="socios-dialog-title">{editingId ? "Editar socio" : "Nuevo socio"}</h2>
              </div>
              <button aria-label="Cerrar" className="socios-close-button" onClick={() => setModalOpen(false)} type="button">×</button>
            </div>
            <form className="socios-form" onSubmit={saveSocio}>
              <div className="socios-form-grid">
                <label className="socios-field">
                  <span>Nombre completo</span>
                  <input autoComplete="name" maxLength="150" name="nombre" onChange={updateField} required value={form.nombre} />
                </label>
                <label className="socios-field">
                  <span>Correo electrónico</span>
                  <input autoComplete="email" maxLength="190" name="email" onChange={updateField} required type="email" value={form.email} />
                </label>
                <label className="socios-field">
                  <span>Carnet</span>
                  <input maxLength="40" name="carnet" onChange={updateField} required value={form.carnet} />
                </label>
                <label className="socios-field">
                  <span>Teléfono <span className="socios-optional">(opcional)</span></span>
                  <input autoComplete="tel" maxLength="30" name="telefono" onChange={updateField} value={form.telefono} />
                </label>
                <label className="socios-field socios-field-wide">
                  <span>Tipo de socio</span>
                  <select name="tipo_socio" onChange={updateField} required value={form.tipo_socio}>
                    <option value="estudiante">Estudiante</option>
                    <option value="docente">Docente</option>
                  </select>
                </label>
              </div>
              {!editingId && <p className="socios-password-hint">La contraseña inicial del socio será su carnet.</p>}
              {error && <p className="socios-alert" role="alert">{error}</p>}
              <div className="socios-dialog-actions">
                <button className="socios-secondary-button" onClick={() => setModalOpen(false)} type="button">Cancelar</button>
                <button className="socios-primary-button" disabled={saving} type="submit">
                  {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear socio"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}