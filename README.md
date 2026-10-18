# Biblioteca UMG 2026

Sistema de gestión de biblioteca de la Universidad Mariano Gálvez de Escuintla.

## Requisitos

- Node.js 20.19 o posterior (o 22.12 o posterior)
- npm
- MySQL 8, o Docker Compose

## Instalación y desarrollo

En Windows, los comandos de npm usan `npm.cmd` para evitar el bloqueo de `npm.ps1` que puede aplicar la política de ejecución de PowerShell. En macOS y Linux, reemplaza `npm.cmd` por `npm`.

1. Instala MySQL 8 o inicia la alternativa con Docker Compose:

	```bash
	docker compose up -d
	```

2. Configura el backend:

	```bash
	cd backend
	```

	Copia `.env.example` como `.env` y ajusta las credenciales de MySQL.

3. Instala las dependencias del backend:

	```bash
	npm.cmd install
	```

4. Crea la base de datos y sus tablas:

	```bash
	npm.cmd run db:init
	```

5. Carga los datos de prueba:

	```bash
	npm.cmd run seed
	```

6. Inicia el backend:

	```bash
	npm.cmd run dev
	```

	El backend queda disponible en `http://localhost:3001`; `GET /api/health` devuelve el estado de la API.

7. En otra terminal, inicia el frontend:

	```bash
	cd frontend
	npm.cmd install
	npm.cmd run dev
	```

	Vite muestra la URL local del frontend al iniciar.

## Usuarios de prueba

La contraseña de todas las cuentas es `Umg2026!`.

| Rol | Correo |
| --- | --- |
| Administrador | admin@umg.edu.gt |
| Encargado | encargado@umg.edu.gt |
| Socio estudiante | ana.lopez@umg.edu.gt |
| Socio estudiante | carlos.garcia@umg.edu.gt |
| Socio docente | maria.hernandez@umg.edu.gt |
| Socio estudiante | jose.morales@umg.edu.gt |
| Socio docente | lucia.perez@umg.edu.gt |
