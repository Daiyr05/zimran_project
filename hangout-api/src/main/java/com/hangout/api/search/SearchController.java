package com.hangout.api.search;

import com.hangout.api.common.CurrentUser;
import com.hangout.api.search.PlanDtos.SearchResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/searches")
@Tag(name = "Search")
public class SearchController {

    private final SearchService service;

    public SearchController(SearchService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SearchResponse run(@Valid @RequestBody SearchRequest req) {
        return service.run(CurrentUser.require(), req);
    }

    @PostMapping("/{id}/shuffle")
    public SearchResponse shuffle(@PathVariable UUID id) {
        return service.shuffle(CurrentUser.require(), id);
    }
}
