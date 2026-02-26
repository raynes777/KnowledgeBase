# Clinical Trial Documentation - Backend

Backend Spring Boot per la piattaforma di gestione documentale Clinical Trials con integrazione Xanadu e IOTA.

## 🚀 Quick Start

### 1. Avvia PostgreSQL

```bash
# Con Docker (dalla directory root del progetto)
cd ..
docker-compose up -d

# Verifica
docker-compose ps
```

### 2. Compila e Avvia Backend

```bash
# Torna nella directory backend
cd backend

# Compila
mvn clean install

# Avvia applicazione
mvn spring-boot:run
```

L'applicazione sarà disponibile su: `http://localhost:8080`

### 3. Verifica Funzionamento

```bash
# Health check (dopo aver aggiunto endpoint)
curl http://localhost:8080/actuator/health

# Oppure testa subito con registrazione
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User","role":"SPONSOR"}'
```

## 📁 Struttura Progetto

```
backend/
├── src/main/java/com/ctd/
│   ├── ClinicalTrialDocApplication.java  # Main class
│   ├── config/                           # Security, IOTA config
│   ├── model/                            # JPA entities
│   ├── repository/                       # JPA repositories
│   ├── service/                          # Business logic
│   ├── security/                         # JWT authentication
│   ├── controller/                       # REST controllers
│   ├── dto/                              # Request/Response DTOs
│   ├── exception/                        # Exception handling
│   └── xanadu/                           # Xanadu core (Sprint 3)
├── src/main/resources/
│   ├── application.yml                   # Main config
│   ├── application-dev.yml               # Dev config
│   └── db/migration/                     # Flyway migrations
└── pom.xml                               # Maven dependencies
```

## 🔐 API Endpoints

### Authentication

#### POST /api/auth/register
Registra nuovo utente.

**Request:**
```json
{
  "email": "sponsor@test.com",
  "password": "password123",
  "name": "Test Sponsor",
  "role": "SPONSOR",
  "organization": "Pharma Inc"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "userId": "uuid-here",
  "iotaDid": "did:iota:mock:uuid-here"
}
```

#### POST /api/auth/login
Login utente.

**Request:**
```json
{
  "email": "sponsor@test.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer"
}
```

### Documents (dopo Sprint 3)
- `POST /api/documents` - Crea documento
- `GET /api/documents` - Lista documenti
- `GET /api/documents/{id}` - Dettaglio documento

### Verification
- `GET /api/verification/version/{versionId}` - Verifica hash IOTA

## 🗄️ Database

### Schema
- **users**: Utenti con ruoli (SPONSOR, RESEARCHER, HOSPITAL, ETHICS_COMMITTEE, AUDITOR)
- **documents**: Documenti (PROTOCOL, ICF, AMENDMENT, ecc.)
- **document_versions**: Versioni documenti con content JSON e hash
- **transclusions**: Audit trail transclusion
- **audit_log**: Log azioni utenti

### Accesso Database
```bash
# Con Docker
docker exec -it ctd_postgres psql -U ctd_user -d ctd_db

# Query esempio
SELECT * FROM users;
SELECT * FROM documents;
```

## 🧪 Testing

### Curl
Usa lo script nella directory root:
```bash
cd ..
./test-api.sh
```

### Postman
Importa la collection: `postman-collection.json`

## ⚙️ Configurazione

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
# JWT Secret (opzionale, ha default)
export JWT_SECRET=your-super-secret-key-min-64-chars

# IOTA (Phase 2)
export IOTA_ENABLED=true
export IOTA_NODE_URL=https://api.testnet.shimmer.network
```

## 🔧 Troubleshooting

### Errore: "Port 8080 already in use"
```bash
# Trova processo
netstat -ano | findstr :8080

# Oppure cambia porta in application.yml
server:
  port: 8081
```

### Errore: "Connection refused to PostgreSQL"
```bash
# Verifica Docker
docker-compose ps

# Riavvia se necessario
docker-compose restart postgres

# Controlla logs
docker-compose logs postgres
```

### Errore Flyway Migration
```bash
# Resetta database (ATTENZIONE: cancella dati!)
docker-compose down -v
docker-compose up -d
```

## 📊 Logs

```bash
# Logs applicazione
tail -f logs/spring.log

# Logs PostgreSQL
docker-compose logs -f postgres
```

## 🏗️ Build

### Development
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Production Build
```bash
mvn clean package
java -jar target/clinical-trial-documentation-0.1.0-SNAPSHOT.jar
```

## 📝 TODO

- [ ] Sprint 3: Integrazione Xanadu core
- [ ] Sprint 4: DocumentController completo
- [ ] Sprint 5: Testing end-to-end
- [ ] Phase 2: Integrazione IOTA reale
- [ ] Phase 3: IOTA Identity (DID)

## 🐛 Known Issues

- IOTA service è mock (ritorna `MOCK_TX_*`)
- Document endpoints richiedono Sprint 3 (Xanadu integration)
- CORS configuration da aggiungere per frontend React
