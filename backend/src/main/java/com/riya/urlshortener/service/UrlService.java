package com.riya.urlshortener.service;

import com.riya.urlshortener.dto.AnalyticsResponse;
import com.riya.urlshortener.dto.ShortUrlResponse;
import com.riya.urlshortener.dto.ShortenRequest;
import com.riya.urlshortener.entity.ClickEvent;
import com.riya.urlshortener.entity.ShortUrl;
import com.riya.urlshortener.entity.User;
import com.riya.urlshortener.exception.DuplicateResourceException;
import com.riya.urlshortener.exception.ResourceNotFoundException;
import com.riya.urlshortener.repository.ClickEventRepository;
import com.riya.urlshortener.repository.ShortUrlRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UrlService {

    private final ShortUrlRepository shortUrlRepository;
    private final ClickEventRepository clickEventRepository;
    private final Base62Encoder base62Encoder;

    @Value("${app.base-url}")
    private String baseUrl;

    // Offset so short codes don't start trivially at "1", "2"... (harder to enumerate/guess)
    private static final long ID_OFFSET = 100_000L;

    @Transactional
    public ShortUrlResponse shorten(ShortenRequest request, User owner) {
        String shortCode;

        if (request.getCustomAlias() != null && !request.getCustomAlias().isBlank()) {
            shortCode = request.getCustomAlias().trim();
            if (shortUrlRepository.existsByShortCode(shortCode)) {
                throw new DuplicateResourceException("Custom alias '" + shortCode + "' is already taken");
            }
        } else {
            shortCode = null; // generated after we know the entity's id
        }

        LocalDateTime expiresAt = request.getExpiryDays() != null
                ? LocalDateTime.now().plusDays(request.getExpiryDays())
                : null;

        ShortUrl shortUrl = ShortUrl.builder()
                .shortCode(shortCode != null ? shortCode : "TEMP") // placeholder, replaced below if generated
                .originalUrl(request.getOriginalUrl())
                .owner(owner)
                .expiresAt(expiresAt)
                .clickCount(0L)
                .active(true)
                .build();

        shortUrlRepository.save(shortUrl);

        if (shortCode == null) {
            shortUrl.setShortCode(base62Encoder.encode(shortUrl.getId() + ID_OFFSET));
            shortUrlRepository.save(shortUrl);
        }

        return toResponse(shortUrl);
    }

    @Cacheable(value = "shortUrls", key = "#shortCode")
    public ShortUrl resolve(String shortCode) {
        ShortUrl shortUrl = shortUrlRepository.findByShortCode(shortCode)
                .orElseThrow(() -> new ResourceNotFoundException("Short URL not found: " + shortCode));

        if (!shortUrl.isActive() || shortUrl.isExpired()) {
            throw new ResourceNotFoundException("This short URL is no longer active");
        }
        return shortUrl;
    }

    @Transactional
    public void recordClick(ShortUrl shortUrl, HttpServletRequest request) {
        shortUrlRepository.incrementClickCount(shortUrl.getId());

        ClickEvent event = ClickEvent.builder()
                .shortUrl(shortUrl)
                .ipAddress(extractIp(request))
                .userAgent(request.getHeader("User-Agent"))
                .referer(request.getHeader("Referer"))
                .build();

        clickEventRepository.save(event);
    }

    public List<ShortUrlResponse> getUserUrls(User owner) {
        return shortUrlRepository.findByOwnerOrderByCreatedAtDesc(owner)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "shortUrls", key = "#shortCode")
    public void deactivate(String shortCode, User owner) {
        ShortUrl shortUrl = shortUrlRepository.findByShortCode(shortCode)
                .orElseThrow(() -> new ResourceNotFoundException("Short URL not found: " + shortCode));

        if (!shortUrl.getOwner().getId().equals(owner.getId())) {
            throw new ResourceNotFoundException("Short URL not found: " + shortCode);
        }

        shortUrl.setActive(false);
        shortUrlRepository.save(shortUrl);
    }

    public AnalyticsResponse getAnalytics(String shortCode, User owner) {
        ShortUrl shortUrl = shortUrlRepository.findByShortCode(shortCode)
                .orElseThrow(() -> new ResourceNotFoundException("Short URL not found: " + shortCode));

        if (!shortUrl.getOwner().getId().equals(owner.getId())) {
            throw new ResourceNotFoundException("Short URL not found: " + shortCode);
        }

        List<Object[]> dailyCounts = clickEventRepository.countClicksByDay(
                shortUrl, LocalDateTime.now().minusDays(30));

        Map<String, Long> clicksByDay = new LinkedHashMap<>();
        for (Object[] row : dailyCounts) {
            clicksByDay.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
        }

        List<AnalyticsResponse.RecentClick> recent = clickEventRepository
                .findByShortUrlOrderByClickedAtDesc(shortUrl)
                .stream()
                .limit(20)
                .map(c -> AnalyticsResponse.RecentClick.builder()
                        .clickedAt(c.getClickedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                        .referer(c.getReferer() != null ? c.getReferer() : "direct")
                        .userAgent(c.getUserAgent())
                        .build())
                .collect(Collectors.toList());

        return AnalyticsResponse.builder()
                .shortCode(shortUrl.getShortCode())
                .originalUrl(shortUrl.getOriginalUrl())
                .totalClicks(shortUrl.getClickCount())
                .clicksByDay(clicksByDay)
                .recentClicks(recent)
                .build();
    }

    private ShortUrlResponse toResponse(ShortUrl shortUrl) {
        return ShortUrlResponse.builder()
                .id(shortUrl.getId())
                .shortCode(shortUrl.getShortCode())
                .shortUrl(baseUrl + "/r/" + shortUrl.getShortCode())
                .originalUrl(shortUrl.getOriginalUrl())
                .clickCount(shortUrl.getClickCount())
                .createdAt(shortUrl.getCreatedAt())
                .expiresAt(shortUrl.getExpiresAt())
                .active(shortUrl.isActive())
                .build();
    }

    private String extractIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
