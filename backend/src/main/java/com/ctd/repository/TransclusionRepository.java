package com.ctd.repository;

import com.ctd.model.Document;
import com.ctd.model.Transclusion;
import com.ctd.model.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TransclusionRepository extends JpaRepository<Transclusion, UUID> {

    @EntityGraph(attributePaths = {"sourceDocument", "targetDocument", "createdBy"})
    List<Transclusion> findBySourceDocument(Document sourceDocument);

    @EntityGraph(attributePaths = {"sourceDocument", "targetDocument", "createdBy"})
    List<Transclusion> findByTargetDocument(Document targetDocument);

    void deleteBySourceDocument(Document sourceDocument);

    void deleteByTargetDocument(Document targetDocument);

    long countByCreatedBy(User user);
}
