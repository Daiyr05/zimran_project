package com.hangout.api.place;

import com.hangout.api.config.AppProperties;
import com.hangout.api.place.PlaceDtos.PlaceDto;
import com.hangout.api.place.PlaceDtos.PlaceSummary;
import org.springframework.stereotype.Component;

@Component
public class PlaceMapper {
    private final AppProperties props;

    public PlaceMapper(AppProperties props) {
        this.props = props;
    }

    /** Hidden gem = rating ≥ 4.5 and fewer than 200 reviews (SRS 1.4). */
    public boolean isHiddenGem(Place p) {
        return p.getRating() != null && p.getRating() >= props.engine().hiddenGemMinRating()
                && p.getReviewCount() < props.engine().hiddenGemMaxReviews();
    }

    public String mapsUrl(Place p) {
        return "https://www.google.com/maps/dir/?api=1&destination=" + p.getLat() + "," + p.getLng();
    }

    public PlaceDto toDto(Place p) {
        return new PlaceDto(p.getId(), p.getName(), p.getKind(), p.getLat(), p.getLng(), p.getRating(), p.getReviewCount(),
                p.getPriceLevel(), p.getPhotoUrl(), mapsUrl(p), p.getWebsite(), isHiddenGem(p), p.isReservable(), p.isOutdoor());
    }

    public PlaceSummary toSummary(Place p) {
        return new PlaceSummary(p.getId(), p.getName(), p.getKind(), p.getLat(), p.getLng(), p.getAddress());
    }
}
