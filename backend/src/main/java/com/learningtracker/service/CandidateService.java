
package com.learningtracker.service;

import com.learningtracker.entity.Account;
import com.learningtracker.entity.Learner;
import com.learningtracker.repository.AccountRepository;
import com.learningtracker.repository.LearnerRepository;

import org.springframework.http.CacheControl;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class CandidateService {

    private final AccountRepository accountRepository;
    private final LearnerRepository learnerRepository;
    private final PasswordEncoder passwordEncoder;

    private final SecureRandom random = new SecureRandom();

    private static final String CHARACTERS =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$";

    public CandidateService(
            AccountRepository accountRepository,
            LearnerRepository learnerRepository,
            PasswordEncoder passwordEncoder) {

        this.accountRepository = accountRepository;
        this.learnerRepository = learnerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Create a new candidate
    @Transactional
    public CandidateCreationResult createCandidate(
            String name, String email, String cohort) {

        email = email.trim().toLowerCase();

        if (accountRepository.existsByEmailIgnoreCase(email)
                || learnerRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        String temporaryPassword = generateTemporaryPassword();

        Account account = new Account();
        account.setEmail(email);
        account.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        account.setRole(Account.Role.CANDIDATE);
        account.setMustChangePassword(true);
        account.setTemporaryPasswordExpiry(
                LocalDateTime.now().plusHours(24));

        accountRepository.save(account);

        Learner learner = new Learner();
        learner.setName(name);
        learner.setEmail(email);
        learner.setCohort(cohort);
        learner.setAccount(account);

        Learner savedLearner = learnerRepository.save(learner);

        return new CandidateCreationResult(
                savedLearner.getId(),
                email,
                temporaryPassword,
                account.getTemporaryPasswordExpiry()
        );
    }

    // Reset an existing candidate's password

    @Transactional
    public CandidateCreationResult createAccountForExistingLearner(Long learnerId) {

        Learner learner = learnerRepository.findById(learnerId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Candidate not found"));

        if (learner.getAccount() != null) {
            throw new IllegalArgumentException(
                    "Candidate already has an account");
        }

        String email = learner.getEmail().trim().toLowerCase();

        if (accountRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException(
                    "An account with this email already exists");
        }

        String temporaryPassword = generateTemporaryPassword();

        Account account = new Account();
        account.setEmail(email);
        account.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        account.setRole(Account.Role.CANDIDATE);
        account.setMustChangePassword(true);
        account.setTemporaryPasswordExpiry(
                LocalDateTime.now().plusHours(24));

        accountRepository.save(account);

        learner.setAccount(account);
        learnerRepository.save(learner);

        return new CandidateCreationResult(
                learner.getId(),
                email,
                temporaryPassword,
                account.getTemporaryPasswordExpiry()
        );
    }

    @Transactional
    public CandidateResetResult resetCandidatePassword(Long learnerId) {

        Learner learner = learnerRepository.findById(learnerId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Candidate not found"));

        Account account = learner.getAccount();

        if (account == null || account.getRole() != Account.Role.CANDIDATE) {
            throw new IllegalArgumentException(
                    "Candidate account not found");
        }

        String temporaryPassword = generateTemporaryPassword();

        LocalDateTime expiry = LocalDateTime.now().plusHours(24);

        account.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        account.setMustChangePassword(true);
        account.setTemporaryPasswordExpiry(expiry);

        // Invalidate existing candidate sessions
        account.setSessionVersion(account.getSessionVersion() + 1);

        accountRepository.save(account);

        return new CandidateResetResult(
                learner.getId(),
                learner.getEmail(),
                temporaryPassword,
                expiry
        );
    }

    // Generate a secure 12-character temporary password
    private String generateTemporaryPassword() {

        StringBuilder password = new StringBuilder();

        for (int i = 0; i < 12; i++) {
            password.append(
                    CHARACTERS.charAt(
                            random.nextInt(CHARACTERS.length())));
        }

        return password.toString();
    }

    // Result returned when creating a candidate
    public record CandidateCreationResult(
            Long learnerId,
            String email,
            String temporaryPassword,
            LocalDateTime expiresAt) {
    }

    // Result returned when resetting a candidate's password
    public record CandidateResetResult(
            Long learnerId,
            String email,
            String temporaryPassword,
            LocalDateTime expiresAt) {
    }
}
