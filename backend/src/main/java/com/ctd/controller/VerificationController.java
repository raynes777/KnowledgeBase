package com.ctd.controller;

import com.ctd.dto.response.VerificationResponse;
import com.ctd.model.DocumentVersion;
import com.ctd.service.DocumentService;
import com.ctd.service.IotaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/verification")
@RequiredArgsConstructor
public class VerificationController {

    private final DocumentService documentService;
    private final IotaService iotaService;

    @GetMapping("/version/{versionId}")
    public ResponseEntity<VerificationResponse> verifyVersion(@PathVariable UUID versionId) {
        DocumentVersion version = documentService.getVersion(versionId);

        String iotaTxId = version.getIotaTxId();
        String storedHash = version.getContentHash();

        boolean verified = iotaService.verify(iotaTxId, storedHash);

        return ResponseEntity.ok(VerificationResponse.builder()
            .versionId(versionId)
            .iotaTxId(iotaTxId)
            .contentHash(storedHash)
            .verified(verified)
            .message(verified ? "Content verified on IOTA" : "Verification failed")
            .build());
    }
}
