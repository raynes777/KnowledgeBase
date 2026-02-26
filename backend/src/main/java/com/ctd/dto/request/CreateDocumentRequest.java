package com.ctd.dto.request;

import com.ctd.model.Document.DocumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateDocumentRequest {
    @NotBlank
    private String title;

    @NotNull
    private DocumentType docType;

    @NotBlank
    private String initialContent;
}
