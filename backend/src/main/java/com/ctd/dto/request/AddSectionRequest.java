package com.ctd.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddSectionRequest {

    @NotBlank(message = "Content type is required")
    private String contentType; // "STRING", "INTEGER", "TRANSCLUSION"

    @NotNull(message = "Value is required")
    private Object value; // String, Integer, or Node reference

    private String parentNodePath; // Optional, default to root
}
