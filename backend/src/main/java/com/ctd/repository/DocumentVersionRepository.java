package com.ctd.repository;

import com.ctd.model.Document;
import com.ctd.model.DocumentVersion;
import com.ctd.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentVersionRepository extends JpaRepository<DocumentVersion, UUID> {

    List<DocumentVersion> findByDocumentOrderByVersionNumberDesc(Document document);

    Optional<DocumentVersion> findByDocumentAndVersionNumber(Document document, Integer versionNumber);

    Optional<DocumentVersion> findByIotaTxId(String iotaTxId);

    long countByAuthor(User author);
}
