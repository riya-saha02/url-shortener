package com.riya.urlshortener.controller;

import com.riya.urlshortener.dto.AnalyticsResponse;
import com.riya.urlshortener.dto.ShortUrlResponse;
import com.riya.urlshortener.dto.ShortenRequest;
import com.riya.urlshortener.entity.ShortUrl;
import com.riya.urlshortener.entity.User;
import com.riya.urlshortener.repository.UserRepository;
import com.riya.urlshortener.service.RateLimiterService;
import com.riya.urlshortener.service.UrlService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class UrlController {

    private final UrlService urlService;
    private final UserRepository userRepository;
    private final RateLimiterService rateLimiterService;

    // ---- Authenticated API (under /api/urls) ----

    @PostMapping("/api/urls/shorten")
    public ResponseEntity<ShortUrlResponse> shorten(@Valid @RequestBody ShortenRequest request,
                                                      Authentication authentication) {
        User user = currentUser(authentication);

        if (!rateLimiterService.tryConsume(user.getEmail())) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }

        ShortUrlResponse response = urlService.shorten(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/api/urls")
    public ResponseEntity<List<ShortUrlResponse>> getMyUrls(Authentication authentication) {
        User user = currentUser(authentication);
        return ResponseEntity.ok(urlService.getUserUrls(user));
    }

    @DeleteMapping("/api/urls/{shortCode}")
    public ResponseEntity<Void> deactivate(@PathVariable String shortCode, Authentication authentication) {
        User user = currentUser(authentication);
        urlService.deactivate(shortCode, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/urls/{shortCode}/analytics")
    public ResponseEntity<AnalyticsResponse> getAnalytics(@PathVariable String shortCode,
                                                            Authentication authentication) {
        User user = currentUser(authentication);
        return ResponseEntity.ok(urlService.getAnalytics(shortCode, user));
    }

    // ---- Public redirect endpoint ----

    @GetMapping("/r/{shortCode}")
    public ResponseEntity<Void> redirect(@PathVariable String shortCode, HttpServletRequest request) {
        ShortUrl shortUrl = urlService.resolve(shortCode);
        urlService.recordClick(shortUrl, request);

        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(shortUrl.getOriginalUrl()));
        return new ResponseEntity<>(headers, HttpStatus.FOUND); // 302 redirect
    }

    private User currentUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }
}
