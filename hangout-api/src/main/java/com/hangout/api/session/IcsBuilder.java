package com.hangout.api.session;

import com.hangout.api.search.PlanDtos.PlanDto;
import com.hangout.api.search.PlanDtos.StopItem;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/** FR-INVITE-8: a minimal iCalendar file for the final plan. */
public final class IcsBuilder {
    private IcsBuilder() {}

    private static final DateTimeFormatter UTC = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'");

    public static String build(String code, PlanDto plan) {
        List<StopItem> stops = plan.timeline().stream().filter(StopItem.class::isInstance).map(StopItem.class::cast).toList();
        if (stops.isEmpty()) return "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n";
        StopItem first = stops.get(0);
        StopItem last = stops.get(stops.size() - 1);
        String summary = "Hangout: " + stops.stream().map(s -> s.place().name()).collect(Collectors.joining(" + "));
        return String.join("\r\n",
                "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hangout//MVP//EN", "BEGIN:VEVENT",
                "UID:" + code + "@hangout.app",
                "DTSTAMP:" + fmt(OffsetDateTime.now()),
                "DTSTART:" + fmt(first.arriveAt()),
                "DTEND:" + fmt(last.departAt()),
                "SUMMARY:" + escape(summary),
                "LOCATION:" + escape(first.place().name()),
                "DESCRIPTION:" + escape(String.join(" · ", plan.reasons())),
                "END:VEVENT", "END:VCALENDAR") + "\r\n";
    }

    private static String fmt(OffsetDateTime t) {
        return t.withOffsetSameInstant(ZoneOffset.UTC).format(UTC);
    }

    private static String escape(String s) {
        return s.replace("\\", "\\\\").replace(",", "\\,").replace(";", "\\;").replace("\n", "\\n");
    }
}
