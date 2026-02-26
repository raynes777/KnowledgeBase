<<<<<<< HEAD
# Clinical Trial Documentation Platform

Piattaforma web collaborativa per la gestione documentale dei Clinical Trials che combina **Xanadu** (versioning granulare, link bidirezionali, transclusion) con **IOTA** (blockchain, notarizzazione, identità digitale).

**Progetto per:** MasterZ × IOTA Hackathon
**Stack:** Spring Boot 3.2 + PostgreSQL + React 18 + TypeScript + IOTA Testnet (mock MVP)

## 🏗️ Architettura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND ✅                             │
│         React 18 + TypeScript + Vite + TailwindCSS              │
└─────────────────────┬───────────────────────────────────────────┘
                      │ REST API
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     JAVA BACKEND ✅                             │
│                     Spring Boot 3.2                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Auth/Users  │  │ Xanadu Core │  │ IOTA Service (mock)     │  │
│  │ (JWT+Roles) │  │   ✅        │  │         ✅             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└───────────┬─────────────────────────────────┬───────────────────┘
            │                                 │
            ▼                                 ▼
┌───────────────────────┐         ┌───────────────────────┐
│      PostgreSQL       │         │     IOTA Testnet      │
│   ✅ Implementato     │        │   🔧 Mock (MVP)       │
└───────────────────────┘         └───────────────────────┘
```

## ✅ Stato Implementazione

### Sprint 1-2: Base + Security ✅
- ✅ Struttura progetto Maven
- ✅ JPA Entities (User, Document, DocumentVersion, AuditLog, Transclusion)
- ✅ Repositories (5 interfaces)
- ✅ JWT Authentication (stateless)
- ✅ Role-based authorization (SPONSOR, RESEARCHER, HOSPITAL, ETHICS_COMMITTEE, AUDITOR)
- ✅ Flyway migration schema PostgreSQL

### Sprint 3: Integrazione Xanadu ✅
- ✅ Copia core Xanadu da KnowledgeBase-master
- ✅ Package refactoring (`com.ctd.xanadu.*`)
- ✅ XanaduService (wrapper Spring per Xanadu)
- ✅ Serializzazione JSON documenti Xanadu
- ✅ IotaService (mock con UUID transaction IDs)
- ✅ AuditService
- ✅ DocumentService (business logic completa)

### Sprint 4: API REST ✅
- ✅ AuthController (`/api/auth/register`, `/api/auth/login`)
- ✅ DocumentController (`/api/documents`)
- ✅ VerificationController (`/api/verification/version/{id}`)
- ✅ DTOs Request/Response
- ✅ GlobalExceptionHandler

### Sprint 5: Frontend React ✅
- ✅ Vite + React 18 + TypeScript setup
- ✅ TailwindCSS configuration
- ✅ React Router routing
- ✅ Axios client with JWT interceptor
- ✅ Zustand auth store
- ✅ Login/Register pages
- ✅ Dashboard with document list
- ✅ Document creation form
- ✅ Document detail viewer
- ✅ Version history display
- ✅ IOTA verification UI

### Sprint 6: Docker Complete Stack ✅
- ✅ Frontend Dockerfile (multi-stage Node → Nginx)
- ✅ Backend Dockerfile (multi-stage Maven → JRE)
- ✅ Docker Compose orchestration
- ✅ Nginx reverse proxy configuration
- ✅ Health checks per tutti i servizi
- ✅ Dependency management (frontend waits for backend)
- ✅ Makefile con comandi rapidi
- ✅ Documentazione completa

### Sprint 7: Testing & Deployment 🔧
- ⏳ Test end-to-end con UI
- ⏳ Deploy su cloud (opzionale)

## 🚀 Quick Start

### Setup Completo con Docker (Solo Docker Desktop Necessario!)

**Prerequisito:** Solo [Docker Desktop](https://www.docker.com/products/docker-desktop/) installato

**NON serve:** Java, Maven, PostgreSQL locale

### Avvia Tutto (1 Comando!)
```bash
# Dalla directory root
cd clinicalTriaDocumentation

# Avvia PostgreSQL + Backend + Frontend (prima volta: ~5-8 min per build)
docker-compose up -d --build

# Verifica che sia tutto attivo
docker-compose ps
```

**Applicazione completa disponibile su: `http://localhost:3000`**

- Frontend (React + Nginx): `http://localhost:3000`
- Backend API: `http://localhost:8080`
- Database: `localhost:5432`

**Vedi istruzioni complete:** [SETUP.md](./SETUP.md)

---

<details>
<summary><b>Setup Alternativo: Installazione Locale (senza Docker per backend)</b></summary>

### 1. Prerequisiti
- Java 17+
- Maven 3.8+
- Docker (per PostgreSQL)
- Git

### 2. Avvia Database
```bash
docker-compose up -d postgres
```

### 3. Compila e Avvia Backend
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

</details>

### 4. Test API

**Registra un utente SPONSOR:**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sponsor@test.com",
    "password": "password123",
    "name": "Test Sponsor",
    "role": "SPONSOR",
    "organization": "Pharma Inc"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sponsor@test.com",
    "password": "password123"
  }'
```

Salva il `accessToken` ricevuto.

**Crea un documento:**
```bash
curl -X POST http://localhost:8080/api/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_QUI>" \
  -d '{
    "title": "Protocol XYZ-2026",
    "docType": "PROTOCOL",
    "initialContent": "Study objectives: Evaluate efficacy and safety..."
  }'
```

**Verifica documento su IOTA (mock):**
```bash
curl http://localhost:8080/api/verification/version/<VERSION_ID>
```

## 📁 Struttura Progetto

```
clinicalTrialDocumentation/
├── backend/                           # Spring Boot backend ✅
│   ├── src/main/java/com/ctd/
│   │   ├── ClinicalTrialDocApplication.java
│   │   ├── config/                   # Security, IOTA config
│   │   ├── model/                    # JPA entities
│   │   ├── repository/               # JPA repositories
│   │   ├── service/                  # Business logic
│   │   │   ├── XanaduService.java   # Wrapper Xanadu
│   │   │   ├── IotaService.java     # Mock IOTA
│   │   │   ├── DocumentService.java
│   │   │   ├── AuditService.java
│   │   │   └── AuthService.java
│   │   ├── security/                 # JWT authentication
│   │   ├── controller/               # REST endpoints
│   │   ├── dto/                      # Request/Response DTOs
│   │   ├── exception/                # Exception handling
│   │   └── xanadu/                   # Xanadu core ✅
│   │       ├── content/              # Content, Author, Link, Version
│   │       ├── node/                 # Node, DocumentNode, RootNode
│   │       └── visitor/              # Visitor patterns
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/             # Flyway migrations
│   └── pom.xml
├── frontend/                          # React (TODO)
├── KnowledgeBase-master/             # Xanadu core originale
├── docker-compose.yml                # PostgreSQL setup
├── test-api.sh                       # Script test bash
├── postman-collection.json           # Postman collection
└── README.md                         # Questo file
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Registra utente
- `POST /api/auth/login` - Login (ritorna JWT)

### Documents (protetti)
- `POST /api/documents` - Crea documento
- `GET /api/documents` - Lista documenti accessibili
- `GET /api/documents/{id}` - Dettaglio documento
- `GET /api/documents/{id}/versions` - History versioni

### Verification (pubblici)
- `GET /api/verification/version/{versionId}` - Verifica hash IOTA

## 🗄️ Database Schema

- **users**: Utenti con ruoli
- **documents**: Documenti (PROTOCOL, ICF, AMENDMENT, ecc.)
- **document_versions**: Versioni con content JSON + hash SHA-256
- **transclusions**: Audit trail transclusion
- **audit_log**: Log azioni utenti

## 🧪 Testing

### Postman
Importa: [`postman-collection.json`](./postman-collection.json)

### Bash Script
```bash
./test-api.sh
```

### Manual curl
Vedi [backend/README.md](./backend/README.md)

## 🔧 Configurazione

### application.yml
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/ctd_db
    username: ctd_user
    password: ctd_password

iota:
  enabled: false  # MVP: mock IOTA
```

### Variabili Ambiente
```bash
export JWT_SECRET=your-super-secret-key-64chars-minimum
```

## 📊 Ruoli e Permessi

| Ruolo | Crea doc | Modifica | Transclude | Approva | Audit |
|-------|----------|----------|------------|---------|-------|
| SPONSOR | ✅ | ✅ proprio | ✅ | ❌ | ✅ |
| RESEARCHER | ❌ | ✅ assegnato | ✅ | ❌ | ✅ |
| HOSPITAL | ✅ locale | ✅ proprio | ✅ | ❌ | ✅ |
| ETHICS_COMMITTEE | ❌ | ❌ | ❌ | ✅ | ✅ |
| AUDITOR | ❌ | ❌ | ❌ | ❌ | ✅ |

## 📝 TODO / Roadmap

### MVP Completato ✅
- [x] Backend Spring Boot completo
- [x] Frontend React completo
- [x] Docker setup completo
- [x] JWT Authentication
- [x] Document CRUD
- [x] IOTA verification (mock)
- [x] Version history
- [x] Audit trail

### Phase 2: IOTA Integration 🔜
- [ ] IOTA real client integration
- [ ] IOTA Identity DID
- [ ] Verifiable Credentials
- [ ] Link a IOTA Tangle Explorer

### Phase 3: Advanced Features 🚀
- [ ] Transclusion UI completa
- [ ] Document editing (non solo creation)
- [ ] Real-time collaboration (WebSocket)
- [ ] PDF export con IOTA proof
- [ ] Diff viewer tra versioni
- [ ] Advanced search/filters

## 🐛 Known Issues

- IOTA service è mock (ritorna `MOCK_TX_*`)
- Transclusion non ancora implementata nei controller
- CORS configuration da aggiungere per frontend React

## 📚 Documentazione

### Setup e Testing
- **[QUICKSTART.md](./QUICKSTART.md)** - ⚡ Start in 2 comandi
- **[SETUP.md](./SETUP.md)** - Setup completo Docker
- **[TESTING.md](./TESTING.md)** - Guida testing end-to-end
- **[DOCKER.md](./DOCKER.md)** - Architettura Docker completa

### Documentazione Tecnica
- [Backend README](./backend/README.md) - Dettagli implementazione backend
- [Frontend README](./frontend/README.md) - Dettagli implementazione frontend
- [Piano di Implementazione](./.claude/plans/hidden-snacking-spindle.md) - Architettura completa
- [CLAUDE_CODE_PROMPT.md](./CLAUDE_CODE_PROMPT.md) - Requirements originali

## 🤝 Contributing

Progetto hackathon - contributi benvenuti!

## KnowledgeBase

A simple Java framework to organize data in a Xanadu-like way. Originally developed as a standalone library, now integrated as the core content engine of this platform.

## License

MIT
