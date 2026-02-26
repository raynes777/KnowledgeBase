package com.ctd.controller;

import com.ctd.model.Document;
import com.ctd.model.User;
import com.ctd.repository.DocumentRepository;
import com.ctd.repository.DocumentVersionRepository;
import com.ctd.repository.TransclusionRepository;
import com.ctd.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository versionRepository;
    private final TransclusionRepository transclusionRepository;

    @GetMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> getUserProfile(@PathVariable UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("name", user.getName());
        profile.put("email", user.getEmail());
        profile.put("role", user.getRole());
        profile.put("organization", user.getOrganization());
        profile.put("iotaDid", user.getIotaDid());
        profile.put("createdAt", user.getCreatedAt().getEpochSecond());

        return ResponseEntity.ok(profile);
    }

    @GetMapping("/{userId}/documents")
    public ResponseEntity<List<Document>> getUserDocuments(@PathVariable UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        List<Document> documents = documentRepository.findByCreatedBy(user);
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/{userId}/stats")
    public ResponseEntity<Map<String, Object>> getUserStats(@PathVariable UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Conta documenti creati
        long documentCount = documentRepository.findByCreatedBy(user).size();

        // Conta versioni authored
        long versionCount = versionRepository.countByAuthor(user);

        // Conta transclusions created
        long transclusionCount = transclusionRepository.countByCreatedBy(user);

        Map<String, Object> stats = new HashMap<>();
        stats.put("documentsCreated", documentCount);
        stats.put("versionsAuthored", versionCount);
        stats.put("transclusionsCreated", transclusionCount);

        return ResponseEntity.ok(stats);
    }
}
