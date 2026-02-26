package com.ctd.dto.response;

import com.ctd.model.Document.DocumentType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class DocumentResponse {
    private UUID id;
    private String title;
    private DocumentType docType;
    private UUID createdBy;
    private String createdByName;
    private UUID currentVersionId;
    private Integer currentVersionNumber;
    private Map<String, Object> contentJson;
    private String contentHash;
    private String iotaTxId;
    private Instant createdAt;
    private Instant updatedAt;
}
