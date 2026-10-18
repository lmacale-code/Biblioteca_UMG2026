import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Login() {
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice("");
    setSubmitting(true);
    try {
      const result = await login(email.trim(), password);
      navigate(result.usuario?.rol === "socio" ? "/libros" : "/", { replace: true });
    } catch (error) {
      setNotice(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handlePasswordReset() {
    setNotice(
      "La recuperación de contraseña estará disponible cuando se integre el servicio de autenticación.",
    );
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <a className="login-brand" href="/">
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
          <label htmlFor="username">Correo electrónico</label>
          <input
            autoComplete="username"
            id="username"
            name="username"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nombre@umg.edu.gt"
            required
            type="email"
          />

          <label htmlFor="password">Contraseña</label>
          <input
            autoComplete="current-password"
            id="password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Escribe tu contraseña"
            required
            type="password"
          />

          <button className="login-submit" disabled={submitting} type="submit">
            {submitting ? "Ingresando..." : "Aceptar"}
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
