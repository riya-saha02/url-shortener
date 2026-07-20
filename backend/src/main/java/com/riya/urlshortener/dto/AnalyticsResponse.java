package com.riya.urlshortener.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsResponse {
    private String shortCode;
    private String originalUrl;
    private Long totalClicks;
    private Map<String, Long> clicksByDay;
    private List<RecentClick> recentClicks;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentClick {
        private String clickedAt;
        private String referer;
        private String userAgent;
    }
}
