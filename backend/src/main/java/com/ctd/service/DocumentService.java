package com.ctd.service;

import com.ctd.exception.ResourceNotFoundException;
import com.ctd.model.*;
import com.ctd.repository.*;
import com.ctd.xanadu.content.Author;
import com.ctd.xanadu.node.Node;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository versionRepository;
    private final TransclusionRepository transclusionRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final XanaduService xanaduService;
    private final IotaService iotaService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    @Transactional
    public Document createDocument(String title, Document.DocumentType docType,
                                    String initialContent, User creator) {
        // 1. Crea Xanadu Author
        Author xanaduAuthor = xanaduService.createAuthor(creator.getName());

        // 2. Crea documento Xanadu
        Node rootNode = xanaduService.createDocument(title, initialContent, xanaduAuthor);

        // 3. Serializza in JSON
        Map<String, Object> contentJson = xanaduService.serializeNodeTree(rootNode);
        String jsonString = serializeToString(contentJson);
        String contentHash = iotaService.calculateHash(jsonString);

        // 4. Notarizza su IOTA (mock in MVP)
        String iotaTxId = iotaService.notarize(contentHash, "Document creation: " + title);

        // 5. Crea entity DB
        Document document = Document.builder()
            .title(title)
            .docType(docType)
            .createdBy(creator)
            .build();

        document = documentRepository.save(document);

        // 6. Crea prima versione
        DocumentVersion version = DocumentVersion.builder()
            .document(document)
            .versionNumber(1)
            .contentJson(contentJson)
            .contentHash(contentHash)
            .author(creator)
            .parentVersion(null)
            .iotaTxId(iotaTxId)
            .build();

        version = versionRepository.save(version);

        // 7. Aggiorna current version
        document.setCurrentVersion(version);
        documentRepository.save(document);

        // 8. Audit log
        auditService.logAction(creator, "CREATE", document, version, null, iotaTxId);

        log.info("Created document {} with version 1, IOTA tx: {}", document.getId(), iotaTxId);
        return document;
    }

    @Transactional(readOnly = true)
    public Document getDocumentById(UUID documentId) {
        return documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + documentId));
    }

    @Transactional(readOnly = true)
    public List<Document> getDocumentsAccessibleByUser(User user) {
        // TODO: implement proper permission check based on role
        return documentRepository.findAccessibleByUser(user);
    }

    @Transactional(readOnly = true)
    public List<Document> getDocumentsByCreator(User user) {
        return documentRepository.findByCreatedBy(user);
    }

    @Transactional(readOnly = true)
    public DocumentVersion getVersion(UUID versionId) {
        return versionRepository.findById(versionId)
            .orElseThrow(() -> new ResourceNotFoundException("Version not found: " + versionId));
    }

    @Transactional(readOnly = true)
    public List<DocumentVersion> getVersionHistory(UUID documentId) {
        Document document = getDocumentById(documentId);
        return versionRepository.findByDocumentOrderByVersionNumberDesc(document);
    }

    @Transactional
    public Document updateDocument(UUID documentId, String newTitle, String newContent,
                                    String changeDescription, User updater) {
        // 1. Get existing document and current version
        Document document = getDocumentById(documentId);
        DocumentVersion currentVersion = document.getCurrentVersion();

        if (currentVersion == null) {
            throw new IllegalStateException("Document has no current version");
        }

        // 2. Create Xanadu Author for this update
        Author xanaduAuthor = xanaduService.createAuthor(updater.getName());

        // 3. Create new Xanadu document node with updated content
        Node rootNode = xanaduService.createDocument(newTitle, newContent, xanaduAuthor);

        // 4. Serialize to JSON
        Map<String, Object> contentJson = xanaduService.serializeNodeTree(rootNode);
        String jsonString = serializeToString(contentJson);
        String contentHash = iotaService.calculateHash(jsonString);

        // 5. Notarize on IOTA (mock in MVP)
        String iotaTxId = iotaService.notarize(contentHash, "Document update: " + newTitle);

        // 6. Create new version (increment version number, link to parent)
        int newVersionNumber = currentVersion.getVersionNumber() + 1;

        DocumentVersion newVersion = DocumentVersion.builder()
            .document(document)
            .versionNumber(newVersionNumber)
            .contentJson(contentJson)
            .contentHash(contentHash)
            .author(updater)
            .parentVersion(currentVersion)  // Link to previous version
            .iotaTxId(iotaTxId)
            .build();

        newVersion = versionRepository.save(newVersion);

        // 7. Update document's current version and title
        document.setCurrentVersion(newVersion);
        document.setTitle(newTitle);
        documentRepository.save(document);

        // 8. Audit log with change description
        Map<String, Object> auditDetails = Map.of(
            "previousVersion", currentVersion.getVersionNumber(),
            "newVersion", newVersionNumber,
            "changeDescription", changeDescription != null ? changeDescription : "No description"
        );

        auditService.logAction(updater, "UPDATE", document, newVersion, auditDetails, iotaTxId);

        log.info("Updated document {} to version {}, IOTA tx: {}",
            document.getId(), newVersionNumber, iotaTxId);

        return document;
    }

    @Transactional
    public Transclusion transcludeContent(UUID targetDocumentId, UUID sourceDocumentId,
                                          String sourceNodePath, String targetNodePath,
                                          User creator) {
        // 1. Get source and target documents
        Document sourceDocument = getDocumentById(sourceDocumentId);
        Document targetDocument = getDocumentById(targetDocumentId);

        // 2. Create transclusion metadata
        String transclusionData = String.format(
            "Transclusion: %s[%s] -> %s[%s]",
            sourceDocument.getTitle(),
            sourceNodePath != null ? sourceNodePath : "root",
            targetDocument.getTitle(),
            targetNodePath != null ? targetNodePath : "root"
        );

        // 3. Notarize on IOTA (mock in MVP)
        String contentHash = iotaService.calculateHash(transclusionData);
        String iotaTxId = iotaService.notarize(contentHash, "Transclusion creation");

        // 4. Create transclusion record
        Transclusion transclusion = Transclusion.builder()
            .sourceDocument(sourceDocument)
            .sourceNodePath(sourceNodePath)
            .targetDocument(targetDocument)
            .targetNodePath(targetNodePath)
            .createdBy(creator)
            .iotaTxId(iotaTxId)
            .build();

        transclusion = transclusionRepository.save(transclusion);

        // 5. Audit log
        Map<String, Object> auditDetails = Map.of(
            "sourceDocumentId", sourceDocumentId,
            "sourceNodePath", sourceNodePath != null ? sourceNodePath : "root",
            "targetNodePath", targetNodePath != null ? targetNodePath : "root"
        );

        auditService.logAction(
            creator,
            "TRANSCLUDE",
            targetDocument,
            targetDocument.getCurrentVersion(),
            auditDetails,
            iotaTxId
        );

        log.info("Created transclusion {} from doc {} to doc {}, IOTA tx: {}",
            transclusion.getId(), sourceDocumentId, targetDocumentId, iotaTxId);

        return transclusion;
    }

    @Transactional(readOnly = true)
    public List<Transclusion> getTransclusionsByTarget(UUID targetDocumentId) {
        Document targetDocument = getDocumentById(targetDocumentId);
        return transclusionRepository.findByTargetDocument(targetDocument);
    }

    @Transactional(readOnly = true)
    public List<Transclusion> getTransclusionsBySource(UUID sourceDocumentId) {
        Document sourceDocument = getDocumentById(sourceDocumentId);
        return transclusionRepository.findBySourceDocument(sourceDocument);
    }

    @Transactional
    public void deleteDocument(UUID documentId, User user) {
        // 1. Get document
        Document document = getDocumentById(documentId);

        // 2. Check if user has permission to delete (must be creator)
        if (!document.getCreatedBy().getId().equals(user.getId())) {
            throw new SecurityException("Only the document creator can delete it");
        }

        // 3. Delete audit logs first (to avoid foreign key constraint violation)
        auditLogRepository.deleteByDocument(document);

        // 4. Delete transclusions
        transclusionRepository.deleteBySourceDocument(document);
        transclusionRepository.deleteByTargetDocument(document);

        // 5. Delete document (cascade will delete versions)
        documentRepository.delete(document);

        log.info("Deleted document {} by user {}", documentId, user.getId());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getVersionTree(UUID documentId) {
        Document document = getDocumentById(documentId);
        List<DocumentVersion> allVersions = versionRepository.findByDocumentOrderByVersionNumberDesc(document);

        // Trova le versioni root (senza parent)
        List<DocumentVersion> roots = allVersions.stream()
            .filter(v -> v.getParentVersion() == null)
            .collect(java.util.stream.Collectors.toList());

        // Costruisci albero per ogni root
        List<Map<String, Object>> trees = roots.stream()
            .map(root -> buildVersionTreeNode(root, allVersions, document.getCurrentVersion()))
            .collect(java.util.stream.Collectors.toList());

        return Map.of(
            "documentId", documentId,
            "trees", trees
        );
    }

    private Map<String, Object> buildVersionTreeNode(
            DocumentVersion version,
            List<DocumentVersion> allVersions,
            DocumentVersion currentVersion) {

        Map<String, Object> node = new HashMap<>();
        node.put("id", version.getId());
        node.put("versionNumber", version.getVersionNumber());
        node.put("authorId", version.getAuthor().getId());
        node.put("authorName", version.getAuthor().getName());
        node.put("createdAt", version.getCreatedAt().getEpochSecond());
        node.put("contentHash", version.getContentHash());
        node.put("iotaTxId", version.getIotaTxId());
        node.put("isCurrent", version.getId().equals(currentVersion.getId()));

        if (version.getParentVersion() != null) {
            node.put("parentVersionId", version.getParentVersion().getId());
        }

        // Trova i children (versioni che hanno questa come parent)
        List<DocumentVersion> children = allVersions.stream()
            .filter(v -> v.getParentVersion() != null &&
                         v.getParentVersion().getId().equals(version.getId()))
            .collect(java.util.stream.Collectors.toList());

        if (!children.isEmpty()) {
            List<Map<String, Object>> childNodes = children.stream()
                .map(child -> buildVersionTreeNode(child, allVersions, currentVersion))
                .collect(java.util.stream.Collectors.toList());
            node.put("children", childNodes);
        } else {
            node.put("children", List.of());
        }

        return node;
    }

    private String serializeToString(Map<String, Object> obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new RuntimeException("JSON serialization failed", e);
        }
    }
}
