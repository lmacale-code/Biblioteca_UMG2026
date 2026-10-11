import { useState } from "react";

export default function Login() {
  const [notice, setNotice] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setNotice(
      "El inicio de sesión todavía no está conectado a un servicio de autenticación.",
    );
  }

  function handlePasswordReset() {
    setNotice(
      "La recuperación de contraseña estará disponible cuando se integre el servicio de autenticación.",
    );
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <a className="login-brand" href="#libros">
          <span className="brand-mark" aria-hidden="true">
            B
          </span>
          <span>
            <strong>Biblioteca UMG</strong>
            <small>Universidad Mariano Gálvez</small>
          </span>
        </a>

        <div className="login-heading">
          <p className="eyebrow">Acceso al sistema</p>
          <h1 id="login-title">Bienvenido</h1>
          <p>Ingresa tus datos para continuar.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="username">Usuario</label>
          <input
            autoComplete="username"
            id="username"
            name="username"
            placeholder="Escribe tu usuario"
            required
          />

          <label htmlFor="password">Contraseña</label>
          <input
            autoComplete="current-password"
            id="password"
            name="password"
            placeholder="Escribe tu contraseña"
            required
            type="password"
          />

          <button className="login-submit" type="submit">
            Aceptar
          </button>
        </form>

        <button
          className="password-reset"
          onClick={handlePasswordReset}
          type="button"
        >
          Reiniciar Password
        </button>

        {notice && (
          <p className="login-notice" role="status">
            {notice}
          </p>
        )}
      </section>
      <p className="login-footer">Sistema de gestión bibliotecaria</p>
    </main>
  );
}
