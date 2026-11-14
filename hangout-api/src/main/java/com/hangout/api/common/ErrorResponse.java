package com.hangout.api.common;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

/** Every error body (SRS 7.3): { code, message, fields }. */
public record ErrorResponse(String code, String message, @JsonInclude(JsonInclude.Include.NON_NULL) Map<String, String> fields) {}
