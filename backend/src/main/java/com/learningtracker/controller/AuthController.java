
package com.learningtracker.controller;

import com.learningtracker.entity.Account;
import com.learningtracker.repository.AccountRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthenticationProvider authenticationProvider;
    private final AccountRepository accountRepository;
    private final SecurityContextRepository securityContextRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(
            AuthenticationProvider authenticationProvider,
            AccountRepository accountRepository,
            SecurityContextRepository securityContextRepository,
            PasswordEncoder passwordEncoder) {

        this.authenticationProvider = authenticationProvider;
        this.accountRepository = accountRepository;
        this.securityContextRepository = securityContextRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        if (request.email() == null || request.password() == null
                || request.email().isBlank() || request.password().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Email and password are required"));
        }

        Account account = accountRepository
                .findByEmailIgnoreCase(request.email().trim())
                .orElse(null);

        if (account == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password"));
        }

        if (account.isMustChangePassword()
                && account.getTemporaryPasswordExpiry() != null
                && LocalDateTime.now().isAfter(
                account.getTemporaryPasswordExpiry())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Temporary password expired. Contact Admin."));
        }

        try {
            Authentication authentication =
                    authenticationProvider.authenticate(
                            new UsernamePasswordAuthenticationToken(
                                    account.getEmail(),
                                    request.password()
                            )
                    );

            SecurityContext context =
                    SecurityContextHolder.createEmptyContext();

            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);

            securityContextRepository.saveContext(
                    context, httpRequest, httpResponse
            );

            httpRequest.changeSessionId();

            return ResponseEntity.ok()
                    .header("Cache-Control", "no-store")
                    .body(Map.of(
                            "message", "Login successful",
                            "email", account.getEmail(),
                            "role", account.getRole().name(),
                            "mustChangePassword", account.isMustChangePassword()
                    ));

        } catch (Exception exception) {
            SecurityContextHolder.clearContext();

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password"));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody ChangePasswordRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (request.currentPassword() == null
                || request.newPassword() == null
                || request.newPassword().length() < 8) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message",
                            "Enter your current password and a new password of at least 8 characters."));
        }

        Account account = accountRepository
                .findByEmailIgnoreCase(authentication.getName())
                .orElse(null);

        if (account == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (!passwordEncoder.matches(
                request.currentPassword(), account.getPasswordHash())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Current password is incorrect."));
        }

        account.setPasswordHash(
                passwordEncoder.encode(request.newPassword())
        );

        account.setMustChangePassword(false);
        account.setTemporaryPasswordExpiry(null);

        accountRepository.save(account);

        httpRequest.changeSessionId();

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {

        SecurityContextHolder.clearContext();

        HttpSession session = request.getSession(false);

        if (session != null) {
            session.invalidate();
        }

        return ResponseEntity.noContent().build();
    }

    public record LoginRequest(String email, String password) {
    }

    public record ChangePasswordRequest(
            String currentPassword,
            String newPassword) {
    }
}
