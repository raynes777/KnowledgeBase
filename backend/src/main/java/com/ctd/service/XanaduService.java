package com.ctd.service;

import com.ctd.xanadu.content.*;
import com.ctd.xanadu.node.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class XanaduService {

    private final ObjectMapper objectMapper;

    /**
     * Crea un nuovo documento Xanadu con contenuto iniziale
     */
    public Node createDocument(String title, String initialContent, Author author) {
        // Crea StringContent
        Content<String> content = StringContent.builder.get()
            .withContent(initialContent)
            .withAuthor(author)
            .build();

        // Crea DocumentNode root
        Node rootNode = DocumentNode.builder.get()
            .withContent(content)
            .build();

        log.debug("Created Xanadu document with root node for title: {}", title);
        return rootNode;
    }

    /**
     * Aggiunge una nuova sezione (child node) al documento
     */
    public Node addSection(Node parentNode, String sectionContent, Author author) {
        Content<String> sectionContentObj = StringContent.builder.get()
            .withContent(sectionContent)
            .withAuthor(author)
            .build();

        Node newNode = DocumentNode.builder.get()
            .withContent(sectionContentObj)
            .withParent(parentNode)
            .build();

        log.debug("Added section to parent node");
        return newNode;
    }

    /**
     * Aggiunge una sezione con tipo specificato (type-aware)
     */
    public Node addTypedSection(Node parentNode, String contentType, Object value, Author author) {
        Content<?> sectionContent;

        switch (contentType.toUpperCase()) {
            case "STRING":
                sectionContent = StringContent.builder.get()
                    .withContent((String) value)
                    .withAuthor(author)
                    .build();
                break;

            case "INTEGER":
                sectionContent = IntegerContent.builder.get()
                    .withContent(value instanceof Integer ? (Integer) value : Integer.parseInt(String.valueOf(value)))
                    .withAuthor(author)
                    .build();
                break;

            case "IMAGE":
                sectionContent = ImageContent.builder.get()
                    .withContent((String) value)
                    .withAuthor(author)
                    .build();
                break;

            case "TRANSCLUSION":
                // value dovrebbe essere un Node
                sectionContent = TranscludedContent.from((Node) value);
                break;

            default:
                throw new IllegalArgumentException("Unknown content type: " + contentType);
        }

        Node newNode = DocumentNode.builder.get()
            .withContent(sectionContent)
            .withParent(parentNode)
            .build();

        // Crea link bidirezionale tra il contenuto della nuova sezione e il contenuto del padre
        sectionContent.link(parentNode.content());

        log.debug("Added typed section: {} to parent node", contentType);
        return newNode;
    }

    /**
     * Crea una nuova versione di un Content
     */
    public Content<String> createVersion(Content<String> originalContent, String newContentText) {
        Content<String> newVersion = StringContent.builder.get()
            .buildFrom(originalContent);

        log.debug("Created new version, parent version exists: {}", originalContent.version() != null);
        return newVersion;
    }

    /**
     * Transclude un Node in un altro documento
     */
    public Node transclude(Node sourceNode, Node targetParentNode) {
        Content<Node> transcludedContent = TranscludedContent.from(sourceNode);

        Node transcludedNode = DocumentNode.builder.get()
            .withContent(transcludedContent)
            .withParent(targetParentNode)
            .build();

        log.debug("Transcluded node from source to target");
        return transcludedNode;
    }

    /**
     * Serializza un Node tree in JSON per persistenza con ricorsione completa
     */
    public Map<String, Object> serializeNodeTree(Node rootNode) {
        return serializeNodeRecursive(rootNode, 50, 0);
    }

    /**
     * Serializza ricorsivamente un Node tree con depth limit
     */
    private Map<String, Object> serializeNodeRecursive(Node node, int maxDepth, int currentDepth) {
        Map<String, Object> json = new HashMap<>();

        if (currentDepth >= maxDepth) {
            json.put("maxDepthReached", true);
            log.warn("Max depth {} reached during serialization", maxDepth);
            return json;
        }

        // Serializza content
        Content<?> content = node.content();
        json.put("content", serializeContent(content));

        // Serializza children ricorsivamente
        java.util.List<Map<String, Object>> childrenData = node.children().stream()
            .filter(n -> !(n instanceof RootNode))
            .map(child -> serializeNodeRecursive(child, maxDepth, currentDepth + 1))
            .collect(java.util.stream.Collectors.toList());

        json.put("children", childrenData);
        json.put("childrenCount", childrenData.size());

        log.debug("Serialized node at depth {}: type={}, childrenCount={}",
            currentDepth, content.getClass().getSimpleName(), childrenData.size());

        return json;
    }

    /**
     * Serializza un Content in JSON (helper)
     */
    private Map<String, Object> serializeContent(Content<?> content) {
        Map<String, Object> data = new HashMap<>();
        data.put("type", content.getClass().getSimpleName());
        data.put("value", content.show());

        if (content.author() != null) {
            data.put("authorName", content.author().getName());
        }

        // Serializza version info
        if (content.version() != null) {
            Map<String, Object> versionData = new HashMap<>();
            versionData.put("hasParent", content.version().parent() != content.version());
            data.put("version", versionData);
        }

        // Serializza links bidirectional
        List<Map<String, Object>> linksData = new ArrayList<>();
        if (content.links() != null && !content.links().isEmpty()) {
            for (Link<?, ?> link : content.links()) {
                Map<String, Object> linkJson = new HashMap<>();
                linkJson.put("firstType", link.first().getClass().getSimpleName());
                linkJson.put("secondType", link.second().getClass().getSimpleName());
                linkJson.put("firstValue", String.valueOf(link.first().show()));
                linkJson.put("secondValue", String.valueOf(link.second().show()));
                linksData.add(linkJson);
            }
        }
        data.put("links", linksData);

        return data;
    }

    /**
     * Deserializza JSON in Node tree (type-aware e ricorsivo)
     */
    @SuppressWarnings("unchecked")
    public Node deserializeNodeTree(Map<String, Object> json, Author defaultAuthor) {
        Map<String, Object> contentData = (Map<String, Object>) json.get("content");
        String contentType = (String) contentData.get("type");
        String authorName = (String) contentData.get("authorName");

        Author author = authorName != null ?
            Author.getNewAuthor(authorName) : defaultAuthor;

        Content<?> content;

        // Deserializzazione type-aware
        switch (contentType) {
            case "StringContent":
                String stringValue = (String) contentData.get("value");
                content = StringContent.builder.get()
                    .withContent(stringValue)
                    .withAuthor(author)
                    .build();
                break;

            case "IntegerContent":
                Object intValueObj = contentData.get("value");
                Integer intValue = intValueObj instanceof Integer ?
                    (Integer) intValueObj :
                    Integer.parseInt(String.valueOf(intValueObj));
                content = IntegerContent.builder.get()
                    .withContent(intValue)
                    .withAuthor(author)
                    .build();
                break;

            case "ImageContent":
                String imageUrl = (String) contentData.get("value");
                content = ImageContent.builder.get()
                    .withContent(imageUrl)
                    .withAuthor(author)
                    .build();
                break;

            case "TranscludedContent":
                // Simplified: store as string reference for MVP
                String transcludedValue = String.valueOf(contentData.get("value"));
                content = StringContent.builder.get()
                    .withContent("TRANSCLUDED: " + transcludedValue)
                    .withAuthor(author)
                    .build();
                break;

            default:
                log.warn("Unknown content type: {}, defaulting to StringContent", contentType);
                content = StringContent.builder.get()
                    .withContent(String.valueOf(contentData.get("value")))
                    .withAuthor(author)
                    .build();
        }

        Node node = DocumentNode.builder.get()
            .withContent(content)
            .build();

        // Ricorri nei children se presenti
        Object childrenObj = json.get("children");
        if (childrenObj instanceof List) {
            List<Map<String, Object>> children = (List<Map<String, Object>>) childrenObj;
            for (Map<String, Object> childJson : children) {
                Node childNode = deserializeNodeTree(childJson, defaultAuthor);
                // Ricostruisci link bidirezionale parent ↔ child
                childNode.content().link(node.content());
            }
        }

        log.debug("Deserialized node tree from JSON: type={}", contentType);
        return node;
    }

    /**
     * Crea un Author Xanadu
     */
    public Author createAuthor(String name) {
        return Author.getNewAuthor(name);
    }
}
