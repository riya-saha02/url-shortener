package com.riya.urlshortener.service;

import org.springframework.stereotype.Component;

/**
 * Encodes numeric IDs into short, URL-safe Base62 strings.
 * Base62 uses [0-9a-zA-Z] (62 characters) so a 7-character code
 * can represent 62^7 (~3.5 trillion) unique combinations - more
 * than enough for a growing URL shortener while keeping links short.
 */
@Component
public class Base62Encoder {

    private static final String ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    private static final int BASE = ALPHABET.length();

    public String encode(long id) {
        if (id == 0) return String.valueOf(ALPHABET.charAt(0));

        StringBuilder sb = new StringBuilder();
        long value = id;
        while (value > 0) {
            int remainder = (int) (value % BASE);
            sb.append(ALPHABET.charAt(remainder));
            value /= BASE;
        }
        return sb.reverse().toString();
    }

    public long decode(String code) {
        long result = 0;
        for (char c : code.toCharArray()) {
            result = result * BASE + ALPHABET.indexOf(c);
        }
        return result;
    }
}
