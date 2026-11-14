package com.hangout.api.moment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ReportRepository extends JpaRepository<Report, UUID> {
    boolean existsByMomentIdAndReporterId(UUID momentId, UUID reporterId);
    long countByMomentId(UUID momentId);
}
