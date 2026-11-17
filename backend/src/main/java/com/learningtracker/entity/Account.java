package com.learningtracker.entity;

import jakarta.persistence.*;
        import java.time.LocalDateTime;

@Entity
@Table(name = "accounts")
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    private boolean mustChangePassword = true;

    private LocalDateTime temporaryPasswordExpiry;
    @Column(nullable = false)
    private int sessionVersion = 0;

    public enum Role {
        COORDINATOR,
        CANDIDATE
    }

    public Account() {
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public boolean isMustChangePassword() {
        return mustChangePassword;
    }

    public void setMustChangePassword(boolean mustChangePassword) {
        this.mustChangePassword = mustChangePassword;
    }

    public LocalDateTime getTemporaryPasswordExpiry() {
        return temporaryPasswordExpiry;
    }

    public void setTemporaryPasswordExpiry(
            LocalDateTime temporaryPasswordExpiry) {
        this.temporaryPasswordExpiry = temporaryPasswordExpiry;
    }
    public int getSessionVersion() {
        return sessionVersion;
    }

    public void setSessionVersion(int sessionVersion) {
        this.sessionVersion = sessionVersion;
    }
}
