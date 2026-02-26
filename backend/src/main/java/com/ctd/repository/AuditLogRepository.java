package com.ctd.repository;

import com.ctd.model.AuditLog;
import com.ctd.model.Document;
import com.ctd.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    Page<AuditLog> findByDocument(Document document, Pageable pageable);

    Page<AuditLog> findByUser(User user, Pageable pageable);

    void deleteByDocument(Document document);
}
