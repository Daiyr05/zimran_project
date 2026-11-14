package com.hangout.api.place;

import jakarta.persistence.*;

import java.util.UUID;

/** One row per place × mood; final = 0.7 type + 0.3 moment (SRS 5.2). */
@Entity
@Table(name = "place_moods")
public class PlaceMood {
    @Id
    private UUID id;

    @Column(name = "place_id", nullable = false)
    private UUID placeId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Mood mood;

    @Column(name = "type_score", nullable = false)
    private double typeScore;

    @Column(name = "moment_score", nullable = false)
    private double momentScore;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getPlaceId() { return placeId; }
    public void setPlaceId(UUID placeId) { this.placeId = placeId; }
    public Mood getMood() { return mood; }
    public void setMood(Mood mood) { this.mood = mood; }
    public double getTypeScore() { return typeScore; }
    public void setTypeScore(double typeScore) { this.typeScore = typeScore; }
    public double getMomentScore() { return momentScore; }
    public void setMomentScore(double momentScore) { this.momentScore = momentScore; }

    public double finalScore() { return 0.7 * typeScore + 0.3 * momentScore; }
}
