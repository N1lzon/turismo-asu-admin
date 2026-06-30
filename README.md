# Jahapa — Admin Panel

Panel administrativo (React + Vite) para gestionar los datos de la plataforma de turismo de Asunción. Consume una API backend en FastAPI/PostgreSQL+PostGIS.

## Stack

- React 19 + Vite
- react-router-dom
- react-leaflet / Leaflet (mapas)
- CSS plano (sin framework), un archivo por página/componente
- Backend: FastAPI, PostgreSQL + PostGIS (proyecto separado)

## Funcionalidades

- **Login** — autenticación JWT (Bearer, expiración 8h)
- **Lugares** — listado, alta, edición y eliminación de lugares (gastronomía, hoteles, atractivos turísticos), incluyendo gestión de fotos y ubicación en mapa
- **Rutas** — gestión de rutas turísticas y los lugares que las componen
- **Reportes** — visualización de métricas de uso de la plataforma, con mapa de ubicaciones

## Requisitos

- Node.js 22+
- Backend de Turismo ASU corriendo (ver `VITE_API_URL`)

## Configuración

Copiar `.env.example` a `.env` y ajustar la URL del backend:

```
VITE_API_URL=http://localhost:8000
```

## Desarrollo

```bash
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

## Docker

El proyecto incluye un `Dockerfile` multi-stage que compila la app y la sirve con nginx:

```bash
docker build -t jahapa-admin .
docker run -p 80:80 jahapa-admin
```

`VITE_API_URL` debe configurarse en tiempo de build (la app es estática una vez compilada).

## Lint

```bash
npm run lint
```
