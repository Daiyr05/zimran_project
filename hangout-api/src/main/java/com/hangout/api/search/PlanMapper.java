package com.hangout.api.search;

import com.hangout.api.engine.EngineRequest.FriendSignal;
import com.hangout.api.engine.PlanDraft;
import com.hangout.api.place.Place;
import com.hangout.api.place.PlaceMapper;
import com.hangout.api.place.PlaceRepository;
import com.hangout.api.search.PlanDtos.*;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class PlanMapper {

    private final PlaceRepository places;
    private final PlaceMapper placeMapper;

    public PlanMapper(PlaceRepository places, PlaceMapper placeMapper) {
        this.places = places;
        this.placeMapper = placeMapper;
    }

    public Plan toEntity(UUID searchId, int rank, PlanDraft d) {
        Plan p = new Plan();
        p.setId(UUID.randomUUID());
        p.setSearchId(searchId);
        p.setRank(rank);
        fill(p, d);
        return p;
    }

    /** Replace a plan's content with a new draft (swap). */
    public void fill(Plan p, PlanDraft d) {
        p.setShape(d.shape());
        p.setTotalMinutes(d.totalMinutes());
        p.setTotalCents(d.cost().totalCents());
        p.setPerPersonCents(d.cost().perPersonCents());
        p.setPlacesCents(d.cost().placesCents());
        p.setTaxCents(d.cost().taxCents());
        p.setTipCents(d.cost().tipCents());
        p.setTravelCents(d.cost().travelCents());
        p.setReasons(d.reasons().toArray(String[]::new));
        p.getStops().clear();
        for (PlanDraft.Stop s : d.stops()) {
            PlanStop ps = new PlanStop();
            ps.setId(UUID.randomUUID());
            ps.setPosition(s.position());
            ps.setPlaceId(s.place().getId());
            ps.setArriveAt(s.arriveAt());
            ps.setDepartAt(s.departAt());
            ps.setEstCostCents(s.estCostCents());
            p.getStops().add(ps);
        }
        p.getLegs().clear();
        for (PlanDraft.Leg l : d.legs()) {
            PlanLeg pl = new PlanLeg();
            pl.setId(UUID.randomUUID());
            pl.setPosition(l.position());
            pl.setFromLabel(l.fromLabel());
            pl.setToLabel(l.toLabel());
            pl.setMode(l.mode());
            pl.setMinutes(l.minutes());
            pl.setEstCostCents(l.costCents());
            p.getLegs().add(pl);
        }
    }

    public List<PlanDto> toDtos(List<Plan> plans, Map<UUID, FriendSignal> signals) {
        Set<UUID> ids = plans.stream().flatMap(p -> p.getStops().stream()).map(PlanStop::getPlaceId).collect(Collectors.toSet());
        Map<UUID, Place> placeMap = places.findAllById(ids).stream().collect(Collectors.toMap(Place::getId, p -> p));
        return plans.stream().map(p -> toDto(p, placeMap, signals)).toList();
    }

    public PlanDto toDto(Plan p, Map<UUID, FriendSignal> signals) {
        return toDtos(List.of(p), signals).get(0);
    }

    private PlanDto toDto(Plan p, Map<UUID, Place> placeMap, Map<UUID, FriendSignal> signals) {
        List<TimelineItem> timeline = new ArrayList<>();
        Map<Integer, PlanLeg> legsByPos = new HashMap<>();
        p.getLegs().forEach(l -> legsByPos.put(l.getPosition(), l));
        int n = p.getStops().size();
        for (int i = 1; i <= n + 1; i++) {
            PlanLeg leg = legsByPos.get(i);
            if (leg != null) timeline.add(LegItem.of(leg));
            if (i <= n) {
                PlanStop s = p.getStops().get(i - 1);
                Place place = placeMap.get(s.getPlaceId());
                FriendSignal fs = signals.get(s.getPlaceId());
                timeline.add(new StopItem("STOP", s.getPosition(), s.getArriveAt(), s.getDepartAt(), s.getEstCostCents(),
                        place == null ? null : placeMapper.toDto(place),
                        fs == null ? null : new FriendSignalDto(fs.name(), fs.rating(), fs.spentCents(), fs.momentId()),
                        null));
            }
        }
        return new PlanDto(p.getId(), p.getRank(), p.getShape(), p.getTotalMinutes(), p.getTotalCents(), p.getPerPersonCents(),
                new CostBreakdown(p.getPlacesCents(), p.getTaxCents(), p.getTipCents(), p.getTravelCents()),
                Arrays.asList(p.getReasons()), timeline);
    }
}
