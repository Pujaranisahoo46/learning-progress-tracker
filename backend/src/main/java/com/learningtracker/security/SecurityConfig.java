
package com.learningtracker.security;

import com.learningtracker.repository.AccountRepository;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;

import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider(
            CustomUserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(userDetailsService);

        provider.setPasswordEncoder(passwordEncoder);

        return provider;
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public FirstLoginFilter firstLoginFilter(
            AccountRepository accountRepository) {

        return new FirstLoginFilter(accountRepository);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            AuthenticationProvider authenticationProvider,
            SecurityContextRepository securityContextRepository,
            FirstLoginFilter firstLoginFilter) {

        http
                .cors(cors ->
                        cors.configurationSource(corsConfigurationSource())
                )

                .securityContext(context ->
                        context.securityContextRepository(
                                securityContextRepository
                        )
                )

                .csrf(AbstractHttpConfigurer::disable)

                .httpBasic(AbstractHttpConfigurer::disable)

                .formLogin(AbstractHttpConfigurer::disable)

                .authenticationProvider(authenticationProvider)

                .exceptionHandling(exception ->
                        exception.authenticationEntryPoint(
                                (request, response, authException) -> {
                                    response.setStatus(
                                            HttpServletResponse.SC_UNAUTHORIZED
                                    );
                                    response.setContentType("application/json");
                                    response.setCharacterEncoding("UTF-8");
                                    response.getWriter().write(
                                            "{\"message\":\"Authentication required. Please sign in.\"}"
                                    );
                                }
                        )
                )

                // Authorization rules
                .authorizeHttpRequests(auth -> auth

                        // Authentication endpoints
                        .requestMatchers("/api/v1/auth/**").permitAll()

                        // Only coordinators can reset candidate passwords
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/learners/*/reset-password"
                        ).hasRole("COORDINATOR")

                        // Only coordinators can view or create learners
                        .requestMatchers("/api/v1/learners/**")
                        .hasRole("COORDINATOR")

                        // Only coordinators can manage activities
                        .requestMatchers("/api/v1/activities/**")
                        .hasRole("COORDINATOR")

                        // Only coordinators can view all or create assignments
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/v1/assignments"
                        ).hasRole("COORDINATOR")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/assignments"
                        ).hasRole("COORDINATOR")

                        // Only coordinators can access coordinator APIs
                        .requestMatchers("/api/v1/coordinator/**")
                        .hasRole("COORDINATOR")

                        // All remaining endpoints require authentication
                        .anyRequest().authenticated()
                );

        // Enforce temporary-password and session-version checks
        http.addFilterAfter(
                firstLoginFilter,
                AnonymousAuthenticationFilter.class
        );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(
        List.of(
                "http://localhost:3000",
                "https://learning-progress-tracker-one.vercel.app"
        )
);

        config.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
        );

        config.setAllowedHeaders(
                List.of("*")
        );

        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                config
        );

        return source;
    }
}
