package com.hangout.api.search;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "plans")
public class Plan {
    @Id
    private UUID id;

    @Column(name = "search_id", nullable = false)
    private UUID searchId;

    @Column(nullable = false)
    private int rank;

    @Column(nullable = false)
    private String shape;

    @Column(name = "total_minutes", nullable = false)
    private int totalMinutes;

    @Column(name = "total_cents", nullable = false)
    private int totalCents;

    @Column(name = "per_person_cents", nullable = false)
    private int perPersonCents;

    @Column(name = "places_cents", nullable = false)
    private int placesCents;

    @Column(name = "tax_cents", nullable = false)
    private int taxCents;

    @Column(name = "tip_cents", nullable = false)
    private int tipCents;

    @Column(name = "travel_cents", nullable = false)
    private int travelCents;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "text[]", nullable = false)
    private String[] reasons = new String[0];

    @Column(nullable = false)
    private boolean saved;

    @Column(name = "saved_at")
    private OffsetDateTime savedAt;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "plan_id", nullable = false)
    @OrderBy("position asc")
    private List<PlanStop> stops = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "plan_id", nullable = false)
    @OrderBy("position asc")
    private List<PlanLeg> legs = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getSearchId() { return searchId; }
    public void setSearchId(UUID searchId) { this.searchId = searchId; }
    public int getRank() { return rank; }
    public void setRank(int rank) { this.rank = rank; }
    public String getShape() { return shape; }
    public void setShape(String shape) { this.shape = shape; }
    public int getTotalMinutes() { return totalMinutes; }
    public void setTotalMinutes(int totalMinutes) { this.totalMinutes = totalMinutes; }
    public int getTotalCents() { return totalCents; }
    public void setTotalCents(int totalCents) { this.totalCents = totalCents; }
    public int getPerPersonCents() { return perPersonCents; }
    public void setPerPersonCents(int perPersonCents) { this.perPersonCents = perPersonCents; }
    public int getPlacesCents() { return placesCents; }
    public void setPlacesCents(int placesCents) { this.placesCents = placesCents; }
    public int getTaxCents() { return taxCents; }
    public void setTaxCents(int taxCents) { this.taxCents = taxCents; }
    public int getTipCents() { return tipCents; }
    public void setTipCents(int tipCents) { this.tipCents = tipCents; }
    public int getTravelCents() { return travelCents; }
    public void setTravelCents(int travelCents) { this.travelCents = travelCents; }
    public String[] getReasons() { return reasons; }
    public void setReasons(String[] reasons) { this.reasons = reasons; }
    public boolean isSaved() { return saved; }
    public void setSaved(boolean saved) { this.saved = saved; }
    public OffsetDateTime getSavedAt() { return savedAt; }
    public void setSavedAt(OffsetDateTime savedAt) { this.savedAt = savedAt; }
    public List<PlanStop> getStops() { return stops; }
    public void setStops(List<PlanStop> stops) { this.stops = stops; }
    public List<PlanLeg> getLegs() { return legs; }
    public void setLegs(List<PlanLeg> legs) { this.legs = legs; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
