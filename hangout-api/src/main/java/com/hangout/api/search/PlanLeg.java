package com.hangout.api.search;

import com.hangout.api.engine.TravelMode;
import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "plan_legs")
public class PlanLeg {
    @Id
    private UUID id;

    @Column(nullable = false)
    private int position;

    @Column(name = "from_label", nullable = false)
    private String fromLabel;

    @Column(name = "to_label", nullable = false)
    private String toLabel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TravelMode mode;

    @Column(nullable = false)
    private int minutes;

    @Column(name = "est_cost_cents", nullable = false)
    private int estCostCents;

    @Column(name = "member_id")
    private UUID memberId;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }
    public String getFromLabel() { return fromLabel; }
    public void setFromLabel(String fromLabel) { this.fromLabel = fromLabel; }
    public String getToLabel() { return toLabel; }
    public void setToLabel(String toLabel) { this.toLabel = toLabel; }
    public TravelMode getMode() { return mode; }
    public void setMode(TravelMode mode) { this.mode = mode; }
    public int getMinutes() { return minutes; }
    public void setMinutes(int minutes) { this.minutes = minutes; }
    public int getEstCostCents() { return estCostCents; }
    public void setEstCostCents(int estCostCents) { this.estCostCents = estCostCents; }
    public UUID getMemberId() { return memberId; }
    public void setMemberId(UUID memberId) { this.memberId = memberId; }
}
