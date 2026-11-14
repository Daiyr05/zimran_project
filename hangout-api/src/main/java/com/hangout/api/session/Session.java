package com.hangout.api.session;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "sessions")
public class Session {
    public enum Status { OPEN, GENERATED, CLOSED }

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 8)
    private String code;

    @Column(name = "organizer_id", nullable = false)
    private UUID organizerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.OPEN;

    /** The organizer's full search inputs (party, advanced filters, start time) used when generating. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "organizer_inputs", nullable = false)
    private String organizerInputs;

    @Column(name = "search_id")
    private UUID searchId;

    @Column(name = "winning_plan_id")
    private UUID winningPlanId;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "generated_at")
    private OffsetDateTime generatedAt;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "session_id", nullable = false)
    @OrderBy("createdAt asc")
    private List<SessionMember> members = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public UUID getOrganizerId() { return organizerId; }
    public void setOrganizerId(UUID organizerId) { this.organizerId = organizerId; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public String getOrganizerInputs() { return organizerInputs; }
    public void setOrganizerInputs(String organizerInputs) { this.organizerInputs = organizerInputs; }
    public UUID getSearchId() { return searchId; }
    public void setSearchId(UUID searchId) { this.searchId = searchId; }
    public UUID getWinningPlanId() { return winningPlanId; }
    public void setWinningPlanId(UUID winningPlanId) { this.winningPlanId = winningPlanId; }
    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }
    public OffsetDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(OffsetDateTime generatedAt) { this.generatedAt = generatedAt; }
    public List<SessionMember> getMembers() { return members; }
    public void setMembers(List<SessionMember> members) { this.members = members; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
