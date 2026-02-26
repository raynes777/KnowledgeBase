package com.ctd.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class VerificationResponse {
    private UUID versionId;
    private String iotaTxId;
    private String contentHash;
    private boolean verified;
    private String message;
}
