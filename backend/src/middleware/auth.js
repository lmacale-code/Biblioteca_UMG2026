import jwt from "jsonwebtoken";

export function requireAuth(request, response, next) {
  const authorization = request.get("Authorization");
  const [scheme, token] = authorization?.split(" ") ?? [];
  const secret = process.env.JWT_SECRET;

  if (scheme !== "Bearer" || !token || !secret) {
    return response.status(401).json({ error: "Autenticación requerida" });
  }

  try {
    const payload = jwt.verify(token, secret);
    if (!payload || typeof payload !== "object" || !payload.id || !payload.rol) {
      return response.status(401).json({ error: "Token inválido" });
    }
    request.user = { id: payload.id, rol: payload.rol };
    return next();
  } catch {
    return response.status(401).json({ error: "Token inválido o vencido" });
  }
}

export function requireRole(...roles) {
  return (request, response, next) => {
    if (!request.user || !roles.includes(request.user.rol)) {
      return response.status(403).json({ error: "No tienes permiso para acceder" });
    }
    return next();
  };
}