package com.hangout.api.user;

import jakarta.persistence.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {
    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(name = "photo_url")
    private String photoUrl;

    @Column(name = "home_city", nullable = false)
    private String homeCity;

    @Column(name = "home_lat")
    private Double homeLat;

    @Column(name = "home_lng")
    private Double homeLng;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Tier tier = Tier.FREE;

    @Enumerated(EnumType.STRING)
    @Column(name = "profile_visibility", nullable = false)
    private Visibility profileVisibility = Visibility.FRIENDS;

    @Column(name = "is_admin", nullable = false)
    private boolean admin;

    @Column(name = "google_sub")
    private String googleSub;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    public String getHomeCity() { return homeCity; }
    public void setHomeCity(String homeCity) { this.homeCity = homeCity; }
    public Double getHomeLat() { return homeLat; }
    public void setHomeLat(Double homeLat) { this.homeLat = homeLat; }
    public Double getHomeLng() { return homeLng; }
    public void setHomeLng(Double homeLng) { this.homeLng = homeLng; }
    public Tier getTier() { return tier; }
    public void setTier(Tier tier) { this.tier = tier; }
    public Visibility getProfileVisibility() { return profileVisibility; }
    public void setProfileVisibility(Visibility profileVisibility) { this.profileVisibility = profileVisibility; }
    public boolean isAdmin() { return admin; }
    public void setAdmin(boolean admin) { this.admin = admin; }
    public String getGoogleSub() { return googleSub; }
    public void setGoogleSub(String googleSub) { this.googleSub = googleSub; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
