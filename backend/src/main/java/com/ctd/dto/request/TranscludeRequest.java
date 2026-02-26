package com.ctd.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TranscludeRequest {

    @NotNull(message = "Source document ID is required")
    private UUID sourceDocumentId;

    private String sourceNodePath;  // Optional: path to specific node (e.g., "section-2.paragraph-1")

    private String targetNodePath;  // Optional: where to insert in target document
}
