package com.ctd.controller;

import com.ctd.dto.request.AddSectionRequest;
import com.ctd.dto.request.CreateDocumentRequest;
import com.ctd.dto.request.TranscludeRequest;
import com.ctd.dto.request.UpdateDocumentRequest;
import com.ctd.dto.response.DocumentResponse;
import com.ctd.model.Document;
import com.ctd.model.DocumentVersion;
import com.ctd.model.Transclusion;
import com.ctd.model.User;
import com.ctd.repository.DocumentRepository;
import com.ctd.repository.DocumentVersionRepository;
import com.ctd.repository.UserRepository;
import com.ctd.service.IotaService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ctd.security.UserPrincipal;
import com.ctd.service.DocumentService;
import com.ctd.service.XanaduService;
import com.ctd.xanadu.content.Author;
import com.ctd.xanadu.node.Node;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final UserRepository userRepository;
    private final XanaduService xanaduService;
    private final IotaService iotaService;
    private final DocumentVersionRepository versionRepository;
    private final DocumentRepository documentRepository;
    private final ObjectMapper objectMapper;

    @PostMapping
    @PreAuthorize("hasAnyRole('SPONSOR', 'RESEARCHER', 'HOSPITAL')")
    public ResponseEntity<DocumentResponse> createDocument(
            @Valid @RequestBody CreateDocumentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        User user = userRepository.findById(currentUser.getId())
            .orElseThrow(() -> new RuntimeException("User not found"));

        Document document = documentService.createDocument(
            request.getTitle(),
            request.getDocType(),
            request.getInitialContent(),
            user
        );

        return ResponseEntity.ok(toResponse(document));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentResponse> getDocument(@PathVariable UUID id) {
        Document document = documentService.getDocumentById(id);
        return ResponseEntity.ok(toResponse(document));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SPONSOR', 'RESEARCHER', 'HOSPITAL')")
    public ResponseEntity<DocumentResponse> updateDocument(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDocumentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        User user = userRepository.findById(currentUser.getId())
            .orElseThrow(() -> new RuntimeException("User not found"));

        Document document = documentService.updateDocument(
            id,
            request.getTitle(),
            request.getContent(),
            request.getChangeDescription(),
            user
        );

        return ResponseEntity.ok(toResponse(document));
    }

    @GetMapping
    public ResponseEntity<List<DocumentResponse>> getMyDocuments(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        User user = userRepository.findById(currentUser.getId())
            .orElseThrow(() -> new RuntimeException("User not found"));

        List<Document> documents = documentService.getDocumentsAccessibleByUser(user);

        return ResponseEntity.ok(
            documents.stream()
                .map(this::toResponse)
                .collect(Collectors.toList())
        );
    }

    @GetMapping("/{id}/versions")
    public ResponseEntity<List<DocumentVersion>> getVersionHistory(@PathVariable UUID id) {
        List<DocumentVersion> versions = documentService.getVersionHistory(id);
        return ResponseEntity.ok(versions);
    }

    @GetMapping("/{id}/versions/{versionId}/structure")
    public ResponseEntity<Map<String, Object>> getNodeStructure(
            @PathVariable UUID id,
            @PathVariable UUID versionId) {

        DocumentVersion version = documentService.getVersion(versionId);

        // Verifica che la versione appartenga al documento
        if (!version.getDocument().getId().equals(id)) {
            throw new IllegalArgumentException("Version does not belong to document");
        }

        // Deserializza il Node tree dal JSON
        Author defaultAuthor = xanaduService.createAuthor(version.getAuthor().getName());
        Node rootNode = xanaduService.deserializeNodeTree(version.getContentJson(), defaultAuthor);

        // Serializza con ricorsione completa
        Map<String, Object> structure = xanaduService.serializeNodeTree(rootNode);

        return ResponseEntity.ok(structure);
    }

    @GetMapping("/{id}/version-tree")
    public ResponseEntity<Map<String, Object>> getVersionTree(@PathVariable UUID id) {
        Map<String, Object> tree = documentService.getVersionTree(id);
        return ResponseEntity.ok(tree);
    }

    @PostMapping("/{id}/transclude")
    @PreAuthorize("hasAnyRole('SPONSOR', 'RESEARCHER', 'HOSPITAL')")
    public ResponseEntity<Transclusion> transcludeContent(
            @PathVariable UUID id,
            @Valid @RequestBody TranscludeRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        User user = userRepository.findById(currentUser.getId())
            .orElseThrow(() -> new RuntimeException("User not found"));

        Transclusion transclusion = documentService.transcludeContent(
            id,  // target document
            request.getSourceDocumentId(),
            request.getSourceNodePath(),
            request.getTargetNodePath(),
            user
        );

        return ResponseEntity.ok(transclusion);
    }

    @GetMapping("/{id}/transclusions/incoming")
    public ResponseEntity<List<Transclusion>> getIncomingTransclusions(@PathVariable UUID id) {
        List<Transclusion> transclusions = documentService.getTransclusionsByTarget(id);
        return ResponseEntity.ok(transclusions);
    }

    @GetMapping("/{id}/transclusions/outgoing")
    public ResponseEntity<List<Transclusion>> getOutgoingTransclusions(@PathVariable UUID id) {
        List<Transclusion> transclusions = documentService.getTransclusionsBySource(id);
        return ResponseEntity.ok(transclusions);
    }

    @GetMapping("/{id}/links")
    public ResponseEntity<Map<String, Object>> getDocumentLinks(@PathVariable UUID id) {
        Document document = documentService.getDocumentById(id);
        DocumentVersion currentVersion = document.getCurrentVersion();

        if (currentVersion == null) {
            return ResponseEntity.ok(Map.of("documentId", id, "links", List.of()));
        }

        // Estrai tutti i link dal contentJson ricorsivamente
        List<Map<String, Object>> allLinks = extractLinksRecursive(currentVersion.getContentJson());

        return ResponseEntity.ok(Map.of(
            "documentId", id,
            "versionId", currentVersion.getId(),
            "links", allLinks
        ));
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractLinksRecursive(Map<String, Object> nodeJson) {
        List<Map<String, Object>> links = new ArrayList<>();

        // Estrai links dal nodo corrente
        Map<String, Object> content = (Map<String, Object>) nodeJson.get("content");
        if (content != null && content.containsKey("links")) {
            Object linksObj = content.get("links");
            if (linksObj instanceof List) {
                links.addAll((List<Map<String, Object>>) linksObj);
            }
        }

        // Ricorri nei children
        Object childrenObj = nodeJson.get("children");
        if (childrenObj instanceof List) {
            List<Map<String, Object>> children = (List<Map<String, Object>>) childrenObj;
            for (Map<String, Object> child : children) {
                links.addAll(extractLinksRecursive(child));
            }
        }

        return links;
    }

    @PostMapping("/{id}/sections")
    @PreAuthorize("hasAnyRole('SPONSOR', 'RESEARCHER', 'HOSPITAL')")
    public ResponseEntity<DocumentResponse> addSection(
            @PathVariable UUID id,
            @Valid @RequestBody AddSectionRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        User user = userRepository.findById(currentUser.getId())
            .orElseThrow(() -> new RuntimeException("User not found"));

        Document document = documentService.getDocumentById(id);
        DocumentVersion currentVersion = document.getCurrentVersion();

        if (currentVersion == null) {
            throw new IllegalStateException("Document has no current version");
        }

        // Deserializza il Node tree corrente
        Author xanaduAuthor = xanaduService.createAuthor(user.getName());
        Node rootNode = xanaduService.deserializeNodeTree(currentVersion.getContentJson(), xanaduAuthor);

        // Aggiungi nuova sezione con tipo specificato
        xanaduService.addTypedSection(rootNode, request.getContentType(), request.getValue(), xanaduAuthor);

        // Re-serializza
        Map<String, Object> newContentJson = xanaduService.serializeNodeTree(rootNode);

        // Calcola hash e notarizza
        String jsonString = serializeToString(newContentJson);
        String contentHash = iotaService.calculateHash(jsonString);
        String iotaTxId = iotaService.notarize(contentHash, "Added section: " + request.getContentType());

        // Crea nuova versione
        int newVersionNumber = currentVersion.getVersionNumber() + 1;
        DocumentVersion newVersion = DocumentVersion.builder()
            .document(document)
            .versionNumber(newVersionNumber)
            .contentJson(newContentJson)
            .contentHash(contentHash)
            .author(user)
            .parentVersion(currentVersion)
            .iotaTxId(iotaTxId)
            .build();

        newVersion = versionRepository.save(newVersion);

        // Aggiorna current version del documento
        document.setCurrentVersion(newVersion);
        documentRepository.save(document);

        return ResponseEntity.ok(toResponse(document));
    }

    private String serializeToString(Map<String, Object> json) {
        try {
            return objectMapper.writeValueAsString(json);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize JSON", e);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SPONSOR', 'RESEARCHER', 'HOSPITAL')")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        User user = userRepository.findById(currentUser.getId())
            .orElseThrow(() -> new RuntimeException("User not found"));

        documentService.deleteDocument(id, user);
        return ResponseEntity.noContent().build();
    }

    private DocumentResponse toResponse(Document doc) {
        DocumentVersion currentVersion = doc.getCurrentVersion();

        return DocumentResponse.builder()
            .id(doc.getId())
            .title(doc.getTitle())
            .docType(doc.getDocType())
            .createdBy(doc.getCreatedBy().getId())
            .createdByName(doc.getCreatedBy().getName())
            .currentVersionId(currentVersion != null ? currentVersion.getId() : null)
            .currentVersionNumber(currentVersion != null ? currentVersion.getVersionNumber() : null)
            .contentJson(currentVersion != null ? currentVersion.getContentJson() : null)
            .contentHash(currentVersion != null ? currentVersion.getContentHash() : null)
            .iotaTxId(currentVersion != null ? currentVersion.getIotaTxId() : null)
            .createdAt(doc.getCreatedAt())
            .updatedAt(doc.getUpdatedAt())
            .build();
    }
}
