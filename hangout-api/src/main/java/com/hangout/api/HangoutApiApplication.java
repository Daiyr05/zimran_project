package com.hangout.api;

import com.hangout.api.config.AppProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
public class HangoutApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(HangoutApiApplication.class, args);
    }
}
