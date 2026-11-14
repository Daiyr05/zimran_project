package com.hangout.api.place;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/** Opening hours stored as JSON: 7 entries, Monday first, {"open":"HH:mm","close":"HH:mm"} or null (FR-RESULT-6). */
public final class OpeningHours {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final DateTimeFormatter HUMAN = DateTimeFormatter.ofPattern("h:mm a");

    public record Entry(String open, String close) {}

    private final List<Entry> days;

    private OpeningHours(List<Entry> days) {
        this.days = days;
    }

    public static OpeningHours parse(String json) {
        if (json == null || json.isBlank()) return new OpeningHours(null);
        try {
            List<Entry> list = MAPPER.readValue(json, new TypeReference<List<Entry>>() {});
            return new OpeningHours(list != null && list.size() == 7 ? list : null);
        } catch (Exception e) {
            return new OpeningHours(null);
        }
    }

    /** Unknown hours count as open (seed places always have hours). */
    public boolean isOpenFor(ZonedDateTime from, ZonedDateTime to) {
        if (days == null) return true;
        // A visit may start on one day and run past midnight into the next; check against the day it starts,
        // and also the previous day's window when it spills past midnight.
        return within(from, to, from.getDayOfWeek(), 0) || within(from, to, from.getDayOfWeek().minus(1), -1);
    }

    private boolean within(ZonedDateTime from, ZonedDateTime to, DayOfWeek day, int dayOffset) {
        Entry e = days.get(day.getValue() - 1);
        if (e == null || e.open() == null || e.close() == null) return false;
        LocalTime open = LocalTime.parse(e.open());
        LocalTime close = LocalTime.parse(e.close());
        ZonedDateTime base = from.toLocalDate().plusDays(dayOffset).atStartOfDay(from.getZone());
        ZonedDateTime opensAt = base.with(open);
        ZonedDateTime closesAt = base.with(close);
        if (!close.isAfter(open)) closesAt = closesAt.plusDays(1); // past midnight
        return !from.isBefore(opensAt) && !to.isAfter(closesAt);
    }

    /** Seven lines, Monday first, e.g. "5:00 PM – 1:00 AM" or "Closed" (for the place page). */
    public List<String> humanLines() {
        List<String> out = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            Entry e = days == null ? null : days.get(i);
            if (e == null || e.open() == null) {
                out.add(days == null ? "Hours unknown" : "Closed");
            } else {
                out.add(LocalTime.parse(e.open()).format(HUMAN) + " – " + LocalTime.parse(e.close()).format(HUMAN));
            }
        }
        return out;
    }

    public static ZonedDateTime at(java.time.OffsetDateTime t, ZoneId zone) {
        return t.atZoneSameInstant(zone);
    }
}
