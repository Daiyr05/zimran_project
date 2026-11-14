package com.hangout.api.search;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PlanRepository extends JpaRepository<Plan, UUID> {
    List<Plan> findBySearchIdOrderByRankAsc(UUID searchId);

    @Query("select p from Plan p, Search s where p.searchId = s.id and s.userId = :u and p.saved = true order by p.savedAt desc")
    List<Plan> findSavedByUser(@Param("u") UUID userId);
}
