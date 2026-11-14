package com.hangout.api.moment;

import jakarta.persistence.*;

import java.time.OffsetDateTime;
import java.util.UUID;

/** FR-MOMENT-10: 3 reports hide a Moment until an admin reviews. */
@Entity
@Table(name = "reports")
public class Report {
    @Id
    private UUID id;

    @Column(name = "moment_id", nullable = false)
    private UUID momentId;

    @Column(name = "reporter_id", nullable = false)
    private UUID reporterId;

    @Column(nullable = false)
    private String reason;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getMomentId() { return momentId; }
    public void setMomentId(UUID momentId) { this.momentId = momentId; }
    public UUID getReporterId() { return reporterId; }
    public void setReporterId(UUID reporterId) { this.reporterId = reporterId; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
