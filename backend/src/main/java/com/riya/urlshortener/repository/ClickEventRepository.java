package com.riya.urlshortener.repository;

import com.riya.urlshortener.entity.ClickEvent;
import com.riya.urlshortener.entity.ShortUrl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ClickEventRepository extends JpaRepository<ClickEvent, Long> {

    List<ClickEvent> findByShortUrlOrderByClickedAtDesc(ShortUrl shortUrl);

    @Query("SELECT FUNCTION('DATE', c.clickedAt) as day, COUNT(c) as count " +
           "FROM ClickEvent c WHERE c.shortUrl = :shortUrl AND c.clickedAt >= :since " +
           "GROUP BY FUNCTION('DATE', c.clickedAt) ORDER BY day")
    List<Object[]> countClicksByDay(@Param("shortUrl") ShortUrl shortUrl, @Param("since") LocalDateTime since);
}
