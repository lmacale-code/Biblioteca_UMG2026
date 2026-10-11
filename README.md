# Biblioteca UMG 2026

Sistema de gestion de biblioteca para el alquiler, la venta y el inventariado de libros de la Universidad Mariano Galvez de Escuintla.

## Estructura

```text
backend/   API REST con Node.js y Express
frontend/  Aplicacion web con React y Vite
```

## Requisitos

- Node.js 20.19 o posterior (o 22.12 o posterior)
- npm

## Desarrollo

En una terminal, inicia el backend:

```bash
cd backend
npm install
npm run dev
```

En otra terminal, inicia el frontend:

```bash
cd frontend
npm install
npm run dev
```

El backend queda disponible en `http://localhost:3001`; la ruta `GET /api/health` devuelve el estado de la API. Vite muestra la URL local del frontend al iniciar.

La estructura incluye un modelo inicial de libro, pero todavia no configura persistencia ni una base de datos.
