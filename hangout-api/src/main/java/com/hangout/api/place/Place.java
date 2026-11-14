package com.hangout.api.place;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

/** Cached place (FR-DATA-1, 2). Seeded from Liquibase in seed mode (FR-DATA-3). */
@Entity
@Table(name = "places")
public class Place {
    @Id
    private UUID id;

    @Column(name = "google_place_id", unique = true)
    private String googlePlaceId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private double lat;

    @Column(nullable = false)
    private double lng;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "text[]")
    private String[] types;

    @Column(name = "primary_type", nullable = false)
    private String primaryType;

    private Double rating;

    @Column(name = "review_count", nullable = false)
    private int reviewCount;

    @Column(name = "price_level")
    private Integer priceLevel;

    /** JSON array of 7 entries, Monday first: {"open":"17:00","close":"01:00"} or null when closed. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "opening_hours")
    private String openingHours;

    private String website;
    private String phone;

    @Column(name = "photo_url")
    private String photoUrl;

    @Column(name = "kid_friendly", nullable = false)
    private boolean kidFriendly;

    @Column(nullable = false)
    private boolean vegetarian;

    @Column(nullable = false)
    private boolean reservable;

    @Column(nullable = false)
    private boolean outdoor;

    @Column(name = "serves_alcohol", nullable = false)
    private boolean servesAlcohol;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlaceKind kind;

    @Column(name = "fetched_at", nullable = false)
    private OffsetDateTime fetchedAt = OffsetDateTime.now();

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getGooglePlaceId() { return googlePlaceId; }
    public void setGooglePlaceId(String googlePlaceId) { this.googlePlaceId = googlePlaceId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public double getLat() { return lat; }
    public void setLat(double lat) { this.lat = lat; }
    public double getLng() { return lng; }
    public void setLng(double lng) { this.lng = lng; }
    public String[] getTypes() { return types; }
    public void setTypes(String[] types) { this.types = types; }
    public String getPrimaryType() { return primaryType; }
    public void setPrimaryType(String primaryType) { this.primaryType = primaryType; }
    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }
    public int getReviewCount() { return reviewCount; }
    public void setReviewCount(int reviewCount) { this.reviewCount = reviewCount; }
    public Integer getPriceLevel() { return priceLevel; }
    public void setPriceLevel(Integer priceLevel) { this.priceLevel = priceLevel; }
    public String getOpeningHours() { return openingHours; }
    public void setOpeningHours(String openingHours) { this.openingHours = openingHours; }
    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    public boolean isKidFriendly() { return kidFriendly; }
    public void setKidFriendly(boolean kidFriendly) { this.kidFriendly = kidFriendly; }
    public boolean isVegetarian() { return vegetarian; }
    public void setVegetarian(boolean vegetarian) { this.vegetarian = vegetarian; }
    public boolean isReservable() { return reservable; }
    public void setReservable(boolean reservable) { this.reservable = reservable; }
    public boolean isOutdoor() { return outdoor; }
    public void setOutdoor(boolean outdoor) { this.outdoor = outdoor; }
    public boolean isServesAlcohol() { return servesAlcohol; }
    public void setServesAlcohol(boolean servesAlcohol) { this.servesAlcohol = servesAlcohol; }
    public PlaceKind getKind() { return kind; }
    public void setKind(PlaceKind kind) { this.kind = kind; }
    public OffsetDateTime getFetchedAt() { return fetchedAt; }
    public void setFetchedAt(OffsetDateTime fetchedAt) { this.fetchedAt = fetchedAt; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isStayIn() { return "stay_in".equals(primaryType); }
}
