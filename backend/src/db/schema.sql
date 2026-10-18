CREATE DATABASE IF NOT EXISTS biblioteca_umg
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE biblioteca_umg;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'encargado', 'socio') NOT NULL,
  tipo_socio ENUM('estudiante', 'docente') NULL,
  carnet VARCHAR(40) NULL,
  telefono VARCHAR(30) NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email),
  UNIQUE KEY uq_usuarios_carnet (carnet)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categorias (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categorias_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS libros (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  titulo VARCHAR(255) NOT NULL,
  autor VARCHAR(180) NOT NULL,
  isbn VARCHAR(20) NOT NULL,
  categoria_id INT UNSIGNED NOT NULL,
  anio SMALLINT UNSIGNED NULL,
  total_ejemplares INT UNSIGNED NOT NULL DEFAULT 1,
  ejemplares_disponibles INT UNSIGNED NOT NULL DEFAULT 1,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_libros_isbn (isbn),
  KEY idx_libros_titulo (titulo),
  KEY idx_libros_autor (autor),
  CONSTRAINT fk_libros_categoria FOREIGN KEY (categoria_id)
    REFERENCES categorias (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_libros_ejemplares CHECK (ejemplares_disponibles <= total_ejemplares)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS prestamos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  libro_id INT UNSIGNED NOT NULL,
  socio_id INT UNSIGNED NOT NULL,
  fecha_salida DATE NOT NULL,
  fecha_limite DATE NOT NULL,
  fecha_devolucion DATE NULL,
  estado ENUM('activo', 'devuelto') NOT NULL DEFAULT 'activo',
  dias_retraso INT UNSIGNED NOT NULL DEFAULT 0,
  multa_monto DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  multa_pagada BOOLEAN NOT NULL DEFAULT FALSE,
  registrado_por INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY idx_prestamos_socio_id (socio_id),
  KEY idx_prestamos_estado (estado),
  KEY idx_prestamos_fecha_limite (fecha_limite),
  CONSTRAINT fk_prestamos_libro FOREIGN KEY (libro_id)
    REFERENCES libros (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_prestamos_socio FOREIGN KEY (socio_id)
    REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_prestamos_registrado_por FOREIGN KEY (registrado_por)
    REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS configuracion (
  clave VARCHAR(100) NOT NULL,
  valor VARCHAR(255) NOT NULL,
  PRIMARY KEY (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;