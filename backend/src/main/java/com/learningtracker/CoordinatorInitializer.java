package com.learningtracker;

import com.learningtracker.entity.Account;
import com.learningtracker.repository.AccountRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class CoordinatorInitializer implements CommandLineRunner {

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.initial-coordinator.email:}")
    private String coordinatorEmail;

    @Value("${app.initial-coordinator.password:}")
    private String coordinatorPassword;

    public CoordinatorInitializer(
            AccountRepository accountRepository,
            PasswordEncoder passwordEncoder) {

        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {

        // Do not create another Coordinator if one already exists.
        if (accountRepository.existsByRole(Account.Role.COORDINATOR)) {
            System.out.println("Coordinator account already exists.");
            return;
        }

        // Read credentials from application configuration.
        if (coordinatorEmail == null || coordinatorEmail.isBlank()
                || coordinatorPassword == null
                || coordinatorPassword.isBlank()) {

            System.out.println(
                    "Initial Coordinator not created. Configure the "
                            + "Coordinator email and password first."
            );
            return;
        }

        if (coordinatorPassword.length() < 12) {
            throw new IllegalStateException(
                    "Initial Coordinator password must contain at least 12 characters."
            );
        }

        String normalizedEmail =
                coordinatorEmail.trim().toLowerCase(Locale.ROOT);

        if (accountRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new IllegalStateException(
                    "The configured Coordinator email already belongs "
                            + "to another account."
            );
        }

        Account coordinator = new Account();

        coordinator.setEmail(normalizedEmail);
        coordinator.setPasswordHash(
                passwordEncoder.encode(coordinatorPassword)
        );
        coordinator.setRole(Account.Role.COORDINATOR);
        coordinator.setMustChangePassword(false);
        coordinator.setTemporaryPasswordExpiry(null);

        accountRepository.save(coordinator);

        System.out.println("Initial Coordinator account created successfully.");
    }
}

