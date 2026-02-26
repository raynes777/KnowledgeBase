package com.ctd.service;

import com.ctd.model.*;
import com.ctd.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void logAction(User user, String action, Document document,
                         DocumentVersion version, Map<String, Object> details,
                         String iotaTxId) {
        AuditLog auditLog = AuditLog.builder()
            .user(user)
            .action(action)
            .document(document)
            .version(version)
            .details(details)
            .iotaTxId(iotaTxId)
            .build();

        auditLogRepository.save(auditLog);
        log.info("Audit log created: user={}, action={}, document={}, iotaTxId={}",
            user.getEmail(), action, document != null ? document.getId() : null, iotaTxId);
    }
}
