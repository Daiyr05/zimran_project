package com.hangout.api.search;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SearchRepository extends JpaRepository<Search, UUID> {
    long countByUserIdAndMonthKey(UUID userId, String monthKey);
}
