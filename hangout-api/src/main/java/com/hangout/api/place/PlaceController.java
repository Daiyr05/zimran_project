package com.hangout.api.place;

import com.hangout.api.common.CurrentUser;
import com.hangout.api.place.PlaceDtos.PlaceDetail;
import com.hangout.api.place.PlaceDtos.PlaceSummary;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/places")
@Tag(name = "Places")
public class PlaceController {

    private final PlaceService service;

    public PlaceController(PlaceService service) {
        this.service = service;
    }

    @GetMapping("/autocomplete")
    public List<PlaceSummary> autocomplete(@RequestParam(value = "q", defaultValue = "") String q,
                                           @RequestParam(value = "lat", required = false) Double lat,
                                           @RequestParam(value = "lng", required = false) Double lng) {
        CurrentUser.require();
        return service.autocomplete(q);
    }

    @GetMapping("/{id}")
    public PlaceDetail detail(@PathVariable UUID id) {
        return service.detail(CurrentUser.require(), id);
    }
}
