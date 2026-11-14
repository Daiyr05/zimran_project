package com.hangout.api.moment;

import com.hangout.api.common.CurrentUser;
import com.hangout.api.moment.MomentDtos.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Moments")
public class MomentController {

    private final MomentService service;
    private final UploadService uploads;

    public MomentController(MomentService service, UploadService uploads) {
        this.service = service;
        this.uploads = uploads;
    }

    @PostMapping(value = "/uploads", consumes = "multipart/form-data")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) {
        CurrentUser.require();
        return uploads.response(uploads.store(file));
    }

    @GetMapping("/feed")
    public Page<MomentDto> feed(@RequestParam(value = "page", defaultValue = "0") int page) {
        return service.feed(CurrentUser.require(), page);
    }

    @GetMapping("/map/moments")
    public List<MapPin> mapPins(@RequestParam(value = "bbox", required = false) String bbox) {
        return service.mapPins(CurrentUser.require(), bbox);
    }

    @GetMapping("/moments/{id}")
    public MomentDto get(@PathVariable UUID id) {
        return service.get(CurrentUser.require(), id);
    }

    @PostMapping("/moments")
    @ResponseStatus(HttpStatus.CREATED)
    public MomentDto create(@Valid @RequestBody MomentInput body) {
        return service.create(CurrentUser.require(), body);
    }

    @PatchMapping("/moments/{id}")
    public MomentDto update(@PathVariable UUID id, @Valid @RequestBody MomentInput body) {
        return service.update(CurrentUser.require(), id, body);
    }

    @DeleteMapping("/moments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(CurrentUser.require(), id);
    }

    @PostMapping("/moments/{id}/report")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void report(@PathVariable UUID id, @Valid @RequestBody ReportRequest body) {
        service.report(CurrentUser.require(), id, body.reason());
    }

    @PostMapping("/moments/{id}/tag/approve")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void approveTag(@PathVariable UUID id) {
        service.answerTag(CurrentUser.require(), id, true);
    }

    @PostMapping("/moments/{id}/tag/decline")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void declineTag(@PathVariable UUID id) {
        service.answerTag(CurrentUser.require(), id, false);
    }
}
