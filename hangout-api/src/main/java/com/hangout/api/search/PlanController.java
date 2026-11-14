package com.hangout.api.search;

import com.hangout.api.common.CurrentUser;
import com.hangout.api.search.PlanDtos.PlanDto;
import com.hangout.api.search.PlanDtos.SavedPlan;
import com.hangout.api.search.PlanDtos.SwapRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/plans")
@Tag(name = "Plans")
public class PlanController {

    private final SearchService service;

    public PlanController(SearchService service) {
        this.service = service;
    }

    @PostMapping("/{id}/swap")
    public PlanDto swap(@PathVariable UUID id, @Valid @RequestBody SwapRequest body) {
        return service.swap(CurrentUser.require(), id, body.position());
    }

    @PostMapping("/{id}/save")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void save(@PathVariable UUID id) {
        service.save(CurrentUser.require(), id);
    }

    @GetMapping("/saved")
    public List<SavedPlan> saved() {
        return service.saved(CurrentUser.require());
    }
}
