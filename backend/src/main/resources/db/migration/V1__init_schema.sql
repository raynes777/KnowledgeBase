-- Extension per UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabella utenti
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    organization VARCHAR(255),
    iota_did VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    enabled BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Tabella documenti
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    doc_type VARCHAR(50) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    current_version_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_created_by ON documents(created_by);
CREATE INDEX idx_documents_doc_type ON documents(doc_type);

-- Tabella versioni documenti
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    content_json JSONB NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id),
    parent_version_id UUID REFERENCES document_versions(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    iota_tx_id VARCHAR(255),
    UNIQUE(document_id, version_number)
);

CREATE INDEX idx_docversions_document ON document_versions(document_id);
CREATE INDEX idx_docversions_parent ON document_versions(parent_version_id);
CREATE INDEX idx_docversions_iota_tx ON document_versions(iota_tx_id);

-- Aggiunge FK per current_version_id
ALTER TABLE documents ADD CONSTRAINT fk_documents_current_version
    FOREIGN KEY (current_version_id) REFERENCES document_versions(id);

-- Tabella transclusions (audit trail)
CREATE TABLE transclusions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_document_id UUID NOT NULL REFERENCES documents(id),
    source_node_path VARCHAR(500) NOT NULL,
    target_document_id UUID NOT NULL REFERENCES documents(id),
    target_node_path VARCHAR(500) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    iota_tx_id VARCHAR(255)
);

CREATE INDEX idx_transclusions_source ON transclusions(source_document_id);
CREATE INDEX idx_transclusions_target ON transclusions(target_document_id);

-- Tabella audit log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    document_id UUID REFERENCES documents(id),
    version_id UUID REFERENCES document_versions(id),
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    iota_tx_id VARCHAR(255)
);

CREATE INDEX idx_auditlog_user ON audit_log(user_id);
CREATE INDEX idx_auditlog_document ON audit_log(document_id);
CREATE INDEX idx_auditlog_created_at ON audit_log(created_at);
