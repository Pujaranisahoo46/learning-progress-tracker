
package com.learningtracker.security;

import com.learningtracker.entity.Account;
import com.learningtracker.repository.AccountRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;

public class FirstLoginFilter extends OncePerRequestFilter {

    private final AccountRepository accountRepository;

    public FirstLoginFilter(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())
                || path.equals("/api/v1/auth/login")
                || path.equals("/api/v1/auth/logout")) {
            filterChain.doFilter(request, response);
            return;
        }

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken)) {

            Account account = accountRepository
                    .findByEmailIgnoreCase(authentication.getName())
                    .orElse(null);

            if (account != null) {

                // Check whether this session is still valid.
                Integer sessionVersion = null;

                for (GrantedAuthority authority : authentication.getAuthorities()) {
                    String value = authority.getAuthority();

                    if (value.startsWith("SESSION_VERSION_")) {
                        sessionVersion = Integer.parseInt(
                                value.substring("SESSION_VERSION_".length())
                        );
                        break;
                    }
                }

                if (sessionVersion == null
                        || sessionVersion != account.getSessionVersion()) {

                    HttpSession session = request.getSession(false);

                    if (session != null) {
                        session.invalidate();
                    }

                    SecurityContextHolder.clearContext();

                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");
                    response.getWriter().write(
                            "{\"message\":\"Session expired. Please sign in again.\"}"
                    );
                    return;
                }

                // Allow password changes, but only from a valid session.
                if (path.equals("/api/v1/auth/change-password")) {
                    filterChain.doFilter(request, response);
                    return;
                }

                if (account.isMustChangePassword()) {

                    if (account.getTemporaryPasswordExpiry() != null
                            && LocalDateTime.now().isAfter(
                            account.getTemporaryPasswordExpiry())) {

                        HttpSession session = request.getSession(false);

                        if (session != null) {
                            session.invalidate();
                        }

                        SecurityContextHolder.clearContext();

                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json");
                        response.setCharacterEncoding("UTF-8");
                        response.getWriter().write(
                                "{\"message\":\"Temporary password expired. Contact Admin.\"}"
                        );
                        return;
                    }

                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");
                    response.getWriter().write(
                            "{\"message\":\"Change your temporary password before accessing training.\"}"
                    );
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
