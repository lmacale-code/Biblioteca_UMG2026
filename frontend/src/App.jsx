import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/login/index.jsx";
import Libros from "./pages/libros/index.jsx";
import Inventario from "./pages/inventario/index.jsx";
import Rentas from "./pages/rentas/index.jsx";
import Socios from "./pages/socios/index.jsx";
import Informes from "./pages/informes/index.jsx";
import Historial from "./pages/historial/index.jsx";
import Configuracion from "./pages/configuracion/index.jsx";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Home />}>
            <Route index element={<Libros />} />
            <Route path="libros" element={<Libros />} />
            <Route path="inventario" element={<ProtectedRoute roles={["admin", "encargado"]} />}>
              <Route index element={<Inventario />} />
            </Route>
            <Route path="rentas" element={<ProtectedRoute roles={["admin", "encargado"]} />}>
              <Route index element={<Rentas />} />
            </Route>
            <Route path="socios" element={<ProtectedRoute roles={["admin", "encargado"]} />}>
              <Route index element={<Socios />} />
            </Route>
            <Route path="informes" element={<ProtectedRoute roles={["admin"]} />}>
              <Route index element={<Informes />} />
            </Route>
            <Route path="historial" element={<Historial />} />
            <Route path="configuracion" element={<ProtectedRoute roles={["admin"]} />}>
              <Route index element={<Configuracion />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
