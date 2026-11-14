package com.hangout.api.search;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "searches")
public class Search {
    @Id
    private UUID id;

    /** Null for session searches (they don't count toward the free quota). */
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "session_id")
    private UUID sessionId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    private String inputs;

    @Column(nullable = false)
    private long seed;

    @Column(name = "month_key", nullable = false)
    private String monthKey;

    @Column(name = "start_lat", nullable = false)
    private double startLat;

    @Column(name = "start_lng", nullable = false)
    private double startLng;

    @Column(name = "start_label", nullable = false)
    private String startLabel;

    @Column(name = "party_size", nullable = false)
    private int partySize;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }
    public String getInputs() { return inputs; }
    public void setInputs(String inputs) { this.inputs = inputs; }
    public long getSeed() { return seed; }
    public void setSeed(long seed) { this.seed = seed; }
    public String getMonthKey() { return monthKey; }
    public void setMonthKey(String monthKey) { this.monthKey = monthKey; }
    public double getStartLat() { return startLat; }
    public void setStartLat(double startLat) { this.startLat = startLat; }
    public double getStartLng() { return startLng; }
    public void setStartLng(double startLng) { this.startLng = startLng; }
    public String getStartLabel() { return startLabel; }
    public void setStartLabel(String startLabel) { this.startLabel = startLabel; }
    public int getPartySize() { return partySize; }
    public void setPartySize(int partySize) { this.partySize = partySize; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
