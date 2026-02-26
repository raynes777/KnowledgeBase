# Setup Completo con Docker - Solo Docker Desktop Necessario!

## 🎯 Prerequisito: SOLO Docker Desktop

**Installa solo questo:**
- [Docker Desktop per Windows](https://www.docker.com/products/docker-desktop/)

**NON serve installare:**
- ❌ Java
- ❌ Maven
- ❌ Node.js / npm
- ❌ PostgreSQL
- ❌ Nient'altro!

---

## 🚀 Setup in 3 Comandi

### 1. Verifica Docker
```bash
docker --version
docker-compose --version
```

**Output atteso:**
```
Docker version 24.x.x
Docker Compose version v2.x.x
```

### 2. Avvia Tutto
```bash
# Nella directory del progetto
cd c:\Users\flavi\Hackaton\clinicalTriaDocumentation

# Avvia database + backend + frontend (prima volta: 5-10 min per build)
docker-compose up -d --build
```

**Cosa succede:**
1. 🐘 Scarica immagine PostgreSQL
2. ☕ Scarica immagine Maven + Java 17
3. 📦 Compila il backend Spring Boot
4. ⚛️ Scarica immagine Node.js
5. 🎨 Compila il frontend React
6. 🌐 Configura Nginx per servire il frontend
7. 🚀 Avvia PostgreSQL + Backend + Frontend
8. ✅ Tutti i servizi aspettano le dipendenze (healthcheck)

### 3. Verifica che Funzioni
```bash
# Controlla i container
docker-compose ps

# Output atteso:
# NAME           IMAGE                     STATUS
# ctd_backend    ...                       Up (healthy)
# ctd_frontend   ...                       Up (healthy)
# ctd_postgres   postgres:15-alpine        Up (healthy)
```

**Applicazione completa disponibile su:** http://localhost:3000

- 🎨 **Frontend (React + Nginx):** http://localhost:3000
- 🔧 **Backend API:** http://localhost:8080
- 🗄️ **Database:** localhost:5432

---

## 📝 Comandi Utili

### Avvio/Stop
```bash
# Avvia
docker-compose up -d

# Stop (conserva i dati)
docker-compose stop

# Stop + rimuovi container (conserva i dati nel volume)
docker-compose down

# Stop + rimuovi TUTTO (anche dati DB!)
docker-compose down -v
```

### Logs
```bash
# Tutti i logs
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo database
docker-compose logs -f postgres

# Ultimi 100 righe
docker-compose logs --tail=100 backend
```

### Rebuild dopo modifiche al codice
```bash
# Rebuild + restart backend
docker-compose up -d --build backend

# Rebuild tutto
docker-compose up -d --build
```

### Accesso al Database
```bash
# Apri psql nel container
docker exec -it ctd_postgres psql -U ctd_user -d ctd_db

# Query esempio
\dt                              # Lista tabelle
SELECT * FROM users;             # Query users
\q                               # Esci
```

### Shell nel Backend Container
```bash
docker exec -it ctd_backend sh
```

---

## 🧪 Test API

### Con curl (PowerShell)
```powershell
# 1. Registra utente
curl -X POST http://localhost:8080/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"sponsor@test.com\",\"password\":\"password123\",\"name\":\"Test Sponsor\",\"role\":\"SPONSOR\",\"organization\":\"Pharma Inc\"}'

# 2. Login
curl -X POST http://localhost:8080/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"sponsor@test.com\",\"password\":\"password123\"}'

# Salva il token dalla risposta
$token = "eyJhbGc..."  # Incolla il token qui

# 3. Crea documento
curl -X POST http://localhost:8080/api/documents `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $token" `
  -d '{\"title\":\"Protocol XYZ-2026\",\"docType\":\"PROTOCOL\",\"initialContent\":\"Study objectives...\"}'

# 4. Lista documenti
curl -H "Authorization: Bearer $token" http://localhost:8080/api/documents
```

### Con Git Bash
```bash
# Esegui lo script di test
chmod +x test-api.sh
./test-api.sh
```

### Con Postman
1. Importa [postman-collection.json](./postman-collection.json)
2. Esegui le richieste nella collection

---

## 🔧 Troubleshooting

### Problema: "port is already allocated"
**Causa:** Porta 8080 o 5432 già in uso

**Soluzione:**
```bash
# Trova cosa usa la porta
netstat -ano | findstr :8080
netstat -ano | findstr :5432

# Termina processo
taskkill /PID <PID> /F

# Oppure cambia porta in docker-compose.yml
ports:
  - "8081:8080"  # Backend su 8081
```

### Problema: "backend exit code 1"
**Causa:** Backend non riesce a connettersi al DB

**Soluzione:**
```bash
# Verifica logs
docker-compose logs backend

# Riavvia assicurandoti che PostgreSQL sia sano
docker-compose restart postgres
docker-compose restart backend
```

### Problema: Build lento la prima volta
**È normale!** La prima build scarica:
- Maven dependencies (~200MB)
- Java base images (~150MB)
- Compila il codice

**Successive build sono veloci** grazie al layer caching.

### Problema: "Connection refused" al database
**Soluzione:**
```bash
# Aspetta che PostgreSQL sia pronto
docker-compose logs postgres

# Cerca questa riga:
# "database system is ready to accept connections"

# Riavvia backend
docker-compose restart backend
```

---

## 📊 Cosa Succede Dietro le Quinte

### Docker Compose
```
┌─────────────────────────────────────────────┐
│         docker-compose.yml                  │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌──────────────┐    │
│  │  PostgreSQL  │ ←──→ │   Backend    │    │
│  │   :5432      │      │   :8080      │    │
│  └──────────────┘      └──────────────┘    │
│        ↑                      ↑             │
│        │                      │             │
│   [Volume]              [Dockerfile]        │
│  postgres_data          Multi-stage build   │
│                                             │
└─────────────────────────────────────────────┘
```

### Dockerfile Multi-stage
```
Stage 1: Build                Stage 2: Runtime
┌─────────────────┐          ┌─────────────────┐
│ maven:3.9-jdk17 │          │  jre-17-alpine  │
│                 │          │                 │
│ Download deps   │          │  Copy JAR       │
│ Compile code    │  ─────>  │  Run app        │
│ Create JAR      │          │  (lightweight)  │
│ (1.2GB)         │          │  (200MB)        │
└─────────────────┘          └─────────────────┘
```

---

## 🎯 Workflow Sviluppo

### Modifichi il Codice?
```bash
# 1. Modifica file in backend/src/...
# 2. Rebuild + restart
docker-compose up -d --build backend

# Il backend si ricompila e riavvia automaticamente
```

### Cambio configurazione?
```bash
# Modifica backend/src/main/resources/application.yml
# Restart (no rebuild necessario)
docker-compose restart backend
```

### Reset completo?
```bash
# Cancella tutto e ricomincia
docker-compose down -v
docker-compose up -d --build
```

---

## ✅ Vantaggi di Questo Setup

✅ **Zero installazioni locali** (solo Docker)
✅ **Ambiente identico per tutti** (riproducibile)
✅ **Isolamento completo** (no conflitti versioni)
✅ **Simile a production** (container-based)
✅ **Facile cleanup** (`docker-compose down -v`)
✅ **Multi-stage build** (immagine finale leggera)
✅ **Health checks** (riavvio automatico se fail)
✅ **Logs centralizzati** (`docker-compose logs`)

---

## 📝 Next Steps

1. ✅ Avvia con `docker-compose up -d --build`
2. ✅ Testa API con curl/Postman
3. 🔧 Sviluppa frontend React (prossimo step)
4. 🚀 Deploy su cloud (AWS/Azure/GCP) - già containerizzato!

---

## 🆘 Hai Problemi?

```bash
# Health check manuale
docker-compose ps
docker-compose logs --tail=50 backend
docker-compose logs --tail=50 postgres

# Restart tutto
docker-compose restart

# Reset completo
docker-compose down -v && docker-compose up -d --build
```

**Il backend è sano quando vedi:**
```
ctd_backend | Started ClinicalTrialDocApplication in X.XXX seconds
```
