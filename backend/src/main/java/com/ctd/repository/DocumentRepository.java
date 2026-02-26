package com.ctd.repository;

import com.ctd.model.Document;
import com.ctd.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {

    List<Document> findByCreatedBy(User user);

    // Clinical trials require transparency - all authenticated users can view all documents
    @Query("SELECT d FROM Document d ORDER BY d.createdAt DESC")
    List<Document> findAccessibleByUser(@Param("user") User user);
}
