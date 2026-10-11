import Header from "../components/Header.jsx";

export default function Home() {
  return (
    <>
      <Header />
      <main className="home">
        <p className="eyebrow">Universidad Mariano Galvez de Guatemala</p>
        <h1>Sistema de biblioteca</h1>
        <p>
          Plataforma para gestionar el inventario, el alquiler y la venta de
          libros.
        </p>
      </main>
    </>
  );
}
