package com.hangout.api.common;

import org.springframework.http.HttpStatus;

import java.util.Map;

/** Thrown anywhere in the service layer; turned into the SRS 7.3 error body by GlobalExceptionHandler. */
public class ApiException extends RuntimeException {
    private final HttpStatus status;
    private final String code;
    private final Map<String, String> fields;

    public ApiException(HttpStatus status, String code, String message) {
        this(status, code, message, null);
    }

    public ApiException(HttpStatus status, String code, String message, Map<String, String> fields) {
        super(message);
        this.status = status;
        this.code = code;
        this.fields = fields;
    }

    public HttpStatus status() { return status; }
    public String code() { return code; }
    public Map<String, String> fields() { return fields; }

    public static ApiException validation(String message, Map<String, String> fields) {
        return new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", message, fields);
    }
    public static ApiException validation(String field, String problem) {
        return validation("Check the highlighted fields.", Map.of(field, problem));
    }
    public static ApiException unauthorized(String message) {
        return new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", message);
    }
    public static ApiException quota(String message) {
        return new ApiException(HttpStatus.PAYMENT_REQUIRED, "QUOTA_EXCEEDED", message);
    }
    public static ApiException plusRequired(String message) {
        return new ApiException(HttpStatus.PAYMENT_REQUIRED, "PLUS_REQUIRED", message);
    }
    public static ApiException forbidden(String message) {
        return new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", message);
    }
    public static ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", message);
    }
    public static ApiException conflict(String message) {
        return new ApiException(HttpStatus.CONFLICT, "CONFLICT", message);
    }
    public static ApiException conflict(String message, Map<String, String> fields) {
        return new ApiException(HttpStatus.CONFLICT, "CONFLICT", message, fields);
    }
    public static ApiException sessionExpired() {
        return new ApiException(HttpStatus.GONE, "SESSION_EXPIRED", "This invite has expired.");
    }
    public static ApiException nothingFits(String message) {
        return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "NOTHING_FITS", message);
    }
    public static ApiException upstream(String message) {
        return new ApiException(HttpStatus.BAD_GATEWAY, "UPSTREAM_FAILED", message);
    }
}
