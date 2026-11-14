package com.hangout.api.session;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

/** A person in a session. inputs is private: never returned to other members (FR-INVITE-3). */
@Entity
@Table(name = "session_members")
public class SessionMember {
    @Id
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "is_organizer", nullable = false)
    private boolean organizer;

    @JdbcTypeCode(SqlTypes.JSON)
    private String inputs;

    @Column(name = "has_answered", nullable = false)
    private boolean hasAnswered;

    @Column(name = "member_token", nullable = false, unique = true)
    private String memberToken;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public boolean isOrganizer() { return organizer; }
    public void setOrganizer(boolean organizer) { this.organizer = organizer; }
    public String getInputs() { return inputs; }
    public void setInputs(String inputs) { this.inputs = inputs; }
    public boolean isHasAnswered() { return hasAnswered; }
    public void setHasAnswered(boolean hasAnswered) { this.hasAnswered = hasAnswered; }
    public String getMemberToken() { return memberToken; }
    public void setMemberToken(String memberToken) { this.memberToken = memberToken; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
