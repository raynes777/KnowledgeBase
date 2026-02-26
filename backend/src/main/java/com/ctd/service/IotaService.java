package com.ctd.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;

@Service
@Slf4j
public class IotaService {

    @Value("${iota.enabled:false}")
    private boolean iotaEnabled;

    /**
     * Notarizza un hash su IOTA Tangle
     * MVP: ritorna mock transaction ID
     */
    public String notarize(String contentHash, String metadata) {
        if (!iotaEnabled) {
            String mockTxId = "MOCK_TX_" + UUID.randomUUID().toString();
            log.info("MOCK IOTA notarization - hash: {}, txId: {}", contentHash, mockTxId);
            return mockTxId;
        }

        // TODO Phase 2: integrazione reale IOTA Client
        // IotaClient client = ...
        // Block block = client.sendData(contentHash + metadata);
        // return block.id();

        throw new UnsupportedOperationException("Real IOTA integration not yet implemented");
    }

    /**
     * Verifica un hash contro IOTA transaction
     * MVP: validazione mock
     */
    public boolean verify(String txId, String expectedHash) {
        if (!iotaEnabled) {
            log.info("MOCK IOTA verification - txId: {}, hash: {}", txId, expectedHash);
            return txId != null && txId.startsWith("MOCK_TX_");
        }

        // TODO Phase 2: fetch da IOTA e confronta hash
        throw new UnsupportedOperationException("Real IOTA verification not yet implemented");
    }

    /**
     * Crea un DID IOTA per un utente
     * MVP: ritorna mock DID
     */
    public String createDID(String userEmail) {
        if (!iotaEnabled) {
            String mockDid = "did:iota:mock:" + UUID.randomUUID().toString();
            log.info("MOCK IOTA DID creation for email: {} -> {}", userEmail, mockDid);
            return mockDid;
        }

        // TODO Phase 3: integrazione IOTA Identity
        throw new UnsupportedOperationException("Real IOTA DID creation not yet implemented");
    }

    /**
     * Calcola SHA-256 hash di una stringa JSON
     */
    public String calculateHash(String content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }
}
