package com.learningtracker.repository;

import com.learningtracker.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AccountRepository
        extends JpaRepository<Account, Long> {

    // Find an account using its email address
    Optional<Account> findByEmailIgnoreCase(String email);

    // Check whether an email address already exists
    boolean existsByEmailIgnoreCase(String email);

    // Check whether an account with a particular role exists
    boolean existsByRole(Account.Role role);
}
