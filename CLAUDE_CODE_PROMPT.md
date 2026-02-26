# Clinical Trial Documentation - Prompt per Claude Code

## Contesto del Progetto

Stiamo partecipando al **MasterZ × IOTA Hackathon**, un hackathon europeo Web3 focalizzato su soluzioni reali utilizzando la tecnologia IOTA.

### Il Problema

La documentazione dei Clinical Trials (sperimentazioni cliniche) oggi soffre di:

1. **Mancanza di tracciabilità granulare**: Non è chiaro chi ha scritto cosa e quando
2. **Versioni frammentate**: Ogni ospedale/ricercatore ha copie locali che si desincronizzano
3. **Audit trail manipolabile**: I log sono nei database aziendali, modificabili
4. **Mancanza di prove legali**: In caso di contenzioso con FDA/EMA, difficile dimostrare l'integrità dei documenti
5. **Nessuna interoperabilità**: Sponsor, ospedali, ricercatori, comitati etici usano sistemi diversi

### La Soluzione

Una **piattaforma web collaborativa** per la gestione documentale dei Clinical Trials che combina:

- **Xanadu** (struttura documentale): versioning granulare, link bidirezionali, transclusion
- **IOTA** (blockchain): notarizzazione immutabile, identità digitale verificabile, audit trail

### Verticale Hackathon

**Digital Identity** + elementi di **Supply Chain** (tracciabilità documentale)

---

## Architettura Tecnica

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│                    React + TypeScript                           │
│         (UI per Sponsor, Ricercatore, Ospedale, Auditor)        │
└─────────────────────────┬───────────────────────────────────────┘
                          │ REST API
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     JAVA BACKEND                                │
│                     Spring Boot                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Auth/Users  │  │ Xanadu Core │  │ IOTA Service            │  │
│  │ (JWT+Roles) │  │ (esistente) │  │ - Notarizzazione        │  │
│  │             │  │             │  │ - Identity              │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└───────────┬─────────────────────────────────┬───────────────────┘
            │                                 │
            ▼                                 ▼
┌───────────────────────┐         ┌───────────────────────┐
│      PostgreSQL       │         │     IOTA Testnet      │
│   - Utenti/Ruoli      │         │   - Hash documenti    │
│   - Documenti         │         │   - Identità          │
│   - Riferimenti IOTA  │         │   - Audit log         │
└───────────────────────┘         └───────────────────────┘
```

---

## Codice Xanadu Esistente

Nella cartella `KnowledgeBase-master` esiste già un'implementazione Java del core Xanalogico con:

### Strutture principali:

1. **Content<T>** - Classe astratta generica per contenuti
   - Gestisce: contenuto, autore, versioni, link bidirezionali
   - Metodi: `show()`, `link()`, `version()`, `author()`, `links()`
   - Builder pattern per creazione

2. **Version** - Sistema di versioning
   - Albero navigabile di versioni
   - `getChildVersion()` per creare nuove versioni
   - Riferimenti parent/children

3. **Link<T,R>** - Link bidirezionali tra contenuti
   - Leggero, type-safe con generics
   - Creato automaticamente quando si linka contenuto

4. **Node** - Organizzazione logica del contenuto
   - `DocumentNode` per contenuto reale
   - `RootNode` singleton per radice
   - Struttura ad albero navigabile

5. **Document** - Facade per l'utente
   - `write(String)` - scrive contenuto
   - `draw()` - visualizza documento
   - `transclude(Node)` - transclusion da altro nodo

6. **Transclusion** - Riuso contenuto con contesto originale
   - `TranscludedContent` wrappa un Node
   - Mantiene riferimento alla fonte originale

### Pattern utilizzati:
- Visitor (ContentVisitor, NodeVisitor)
- Builder (Content.builder, Node.builder)
- Singleton (RootNode)
- Facade (Document)

---

## Cosa Costruire

### Fase 1: Setup Progetto Spring Boot

```
clinicalTrialDocumentation/
├── backend/
│   ├── src/main/java/com/ctd/
│   │   ├── ClinicalTrialDocApplication.java
│   │   ├── config/
│   │   │   ├── SecurityConfig.java
│   │   │   └── IotaConfig.java
│   │   ├── model/
│   │   │   ├── User.java
│   │   │   ├── Role.java (enum: SPONSOR, RESEARCHER, HOSPITAL, ETHICS_COMMITTEE, AUDITOR)
│   │   │   ├── Document.java (entity DB, non Xanadu)
│   │   │   ├── DocumentVersion.java
│   │   │   └── AuditLog.java
│   │   ├── repository/
│   │   ├── service/
│   │   │   ├── XanaduService.java (wrapper del core Xanadu)
│   │   │   ├── IotaService.java (notarizzazione + identity)
│   │   │   ├── DocumentService.java
│   │   │   └── AuditService.java
│   │   ├── controller/
│   │   │   ├── AuthController.java
│   │   │   ├── DocumentController.java
│   │   │   └── VerificationController.java
│   │   └── xanadu/ (copia del core esistente)
│   ├── src/main/resources/
│   │   └── application.yml
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   └── package.json
└── KnowledgeBase-master/ (codice Xanadu esistente)
```

### Fase 2: Integrazione Xanadu ↔ Database

Il `XanaduService` deve:
1. Wrappare le classi Xanadu esistenti
2. Serializzare/deserializzare documenti Xanadu in JSON per PostgreSQL
3. Triggerare notarizzazione IOTA ad ogni nuova Version

### Fase 3: Integrazione IOTA

Il `IotaService` deve:
1. Calcolare hash SHA-256 del contenuto
2. Scrivere hash + metadata su IOTA testnet
3. Gestire IOTA Identity per gli utenti (credenziali verificabili)
4. Salvare transaction ID nel database

### Fase 4: API REST

```
AUTH
POST   /api/auth/register
POST   /api/auth/login

DOCUMENTS
GET    /api/documents                    
POST   /api/documents                    
GET    /api/documents/{id}               
GET    /api/documents/{id}/versions      
POST   /api/documents/{id}/edit          
POST   /api/documents/{id}/transclude    

VERIFICATION
GET    /api/documents/{id}/verify        
GET    /api/documents/{id}/audit-trail   
GET    /api/iota/transaction/{txId}      
```

### Fase 5: Frontend React

Pagine principali:
1. **Login/Register** con selezione ruolo
2. **Dashboard** documenti accessibili
3. **Editor** documento con versioning visibile
4. **Audit Trail** timeline modifiche con link IOTA
5. **Verifica** confronto hash locale vs IOTA

---

## Ruoli e Permessi

| Ruolo | Può creare doc | Può modificare | Può transcludere | Può approvare | Vede audit |
|-------|----------------|----------------|------------------|---------------|------------|
| SPONSOR | ✅ | ✅ proprio | ✅ | ❌ | ✅ |
| RESEARCHER | ❌ | ✅ sezioni assegnate | ✅ | ❌ | ✅ |
| HOSPITAL | ✅ locale | ✅ proprio | ✅ | ❌ | ✅ |
| ETHICS_COMMITTEE | ❌ | ❌ | ❌ | ✅ | ✅ |
| AUDITOR | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Database Schema

```sql
CREATE TYPE user_role AS ENUM ('SPONSOR', 'RESEARCHER', 'HOSPITAL', 'ETHICS_COMMITTEE', 'AUDITOR');

CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    organization VARCHAR(255),
    iota_did VARCHAR(255),  -- IOTA Decentralized Identifier
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE documents (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    doc_type VARCHAR(50),  -- PROTOCOL, CONSENT_FORM, CASE_REPORT, etc.
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    current_version_id UUID
);

CREATE TABLE document_versions (
    id UUID PRIMARY KEY,
    document_id UUID REFERENCES documents(id),
    version_number INT NOT NULL,
    content_json JSONB NOT NULL,  -- Struttura Xanadu serializzata
    content_hash VARCHAR(64) NOT NULL,  -- SHA-256
    author_id UUID REFERENCES users(id),
    parent_version_id UUID REFERENCES document_versions(id),
    iota_tx_id VARCHAR(255),  -- Transaction ID su IOTA
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transclusions (
    id UUID PRIMARY KEY,
    source_document_id UUID REFERENCES documents(id),
    source_node_path VARCHAR(255),
    target_document_id UUID REFERENCES documents(id),
    target_node_path VARCHAR(255),
    created_by UUID REFERENCES users(id),
    iota_tx_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audit_log (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,  -- CREATE, EDIT, VIEW, TRANSCLUDE, APPROVE
    document_id UUID REFERENCES documents(id),
    version_id UUID REFERENCES document_versions(id),
    details JSONB,
    iota_tx_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## IOTA Integration

### Dipendenze Maven
```xml
<dependency>
    <groupId>org.iota</groupId>
    <artifactId>iota-client-java</artifactId>
    <version><!-- latest --></version>
</dependency>
<dependency>
    <groupId>org.iota</groupId>
    <artifactId>identity-iota</artifactId>
    <version><!-- latest --></version>
</dependency>
```

### Notarizzazione (esempio concettuale)
```java
@Service
public class IotaService {
    
    public String notarize(String contentHash, String documentId, String authorDid) {
        // 1. Crea payload
        Map<String, Object> payload = Map.of(
            "type", "DOCUMENT_VERSION",
            "documentId", documentId,
            "contentHash", contentHash,
            "authorDid", authorDid,
            "timestamp", Instant.now().toString()
        );
        
        // 2. Scrivi su IOTA
        // ... usa IOTA SDK
        
        // 3. Ritorna transaction ID
        return transactionId;
    }
    
    public boolean verify(String contentHash, String iotaTxId) {
        // 1. Leggi transazione da IOTA
        // 2. Confronta hash
        // 3. Ritorna risultato
    }
}
```

---

## MVP per Demo Hackathon

Per la demo, simuliamo questo flusso:

1. **Sponsor** fa login e crea "Protocollo Studio XYZ-2026"
2. **Sponsor** aggiunge sezioni (Obiettivi, Criteri Inclusione, Procedure)
3. Sistema notarizza ogni versione su IOTA
4. **Ospedale Milano** fa login, vede il protocollo
5. **Ospedale** crea documento locale e fa transclusion della sezione "Criteri Inclusione"
6. **Ricercatore** modifica una sezione → nuova versione → notarizzazione
7. **Auditor** apre audit trail, vede timeline completa
8. **Auditor** clicca "Verifica" → sistema confronta hash con IOTA → "✅ INTEGRO"

---

## Istruzioni per Claude Code

### Step 1: Inizializza progetto Spring Boot

Crea la struttura del progetto backend con:
- Spring Boot 3.x
- Spring Security + JWT
- Spring Data JPA
- PostgreSQL driver
- Dipendenze IOTA (se disponibili, altrimenti mock)

### Step 2: Integra codice Xanadu esistente

Copia le classi dalla cartella `KnowledgeBase-master` nel package `com.ctd.xanadu` e adattale se necessario.

### Step 3: Crea i servizi

1. `XanaduService` - wrapper per operazioni Xanadu
2. `IotaService` - mock iniziale, poi integrazione reale
3. `DocumentService` - logica business
4. `AuditService` - logging su DB e IOTA

### Step 4: Crea le API REST

Implementa i controller con gli endpoint definiti sopra.

### Step 5: Crea frontend React base

- Login page
- Dashboard documenti
- Editor semplice
- Audit trail view

### Priorità

1. Backend funzionante con mock IOTA ✅
2. CRUD documenti con versioning ✅
3. Audit trail funzionante ✅
4. Frontend base ✅
5. Integrazione IOTA reale (se tempo)
6. Transclusion completa (se tempo)

---

## Note Importanti

- Il codice Xanadu esistente è in Java puro, va integrato in Spring Boot
- IOTA testnet per sviluppo, non mainnet
- Focus su demo funzionante, non produzione
- Semplicità vince: meglio meno feature che funzionano

---

## Risorse

- IOTA Identity: https://docs.iota.org/developer/iota-identity/
- IOTA Notarization: https://docs.iota.org/developer/workshops/iota-notarization-truedoc
- Spring Boot: https://spring.io/projects/spring-boot
- React: https://react.dev/
