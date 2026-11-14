package com.hangout.api.search;

import jakarta.persistence.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "plan_stops")
public class PlanStop {
    @Id
    private UUID id;

    @Column(nullable = false)
    private int position;

    @Column(name = "place_id", nullable = false)
    private UUID placeId;

    @Column(name = "arrive_at", nullable = false)
    private OffsetDateTime arriveAt;

    @Column(name = "depart_at", nullable = false)
    private OffsetDateTime departAt;

    @Column(name = "est_cost_cents", nullable = false)
    private int estCostCents;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }
    public UUID getPlaceId() { return placeId; }
    public void setPlaceId(UUID placeId) { this.placeId = placeId; }
    public OffsetDateTime getArriveAt() { return arriveAt; }
    public void setArriveAt(OffsetDateTime arriveAt) { this.arriveAt = arriveAt; }
    public OffsetDateTime getDepartAt() { return departAt; }
    public void setDepartAt(OffsetDateTime departAt) { this.departAt = departAt; }
    public int getEstCostCents() { return estCostCents; }
    public void setEstCostCents(int estCostCents) { this.estCostCents = estCostCents; }
}
