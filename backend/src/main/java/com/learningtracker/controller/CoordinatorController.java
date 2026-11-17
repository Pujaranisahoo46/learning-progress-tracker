package com.learningtracker.controller;

import com.learningtracker.service.CandidateService;
import com.learningtracker.service.CandidateService.CandidateCreationResult;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;


import org.springframework.http.HttpStatus;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/coordinator")
public class CoordinatorController {

    private final CandidateService candidateService;

    public CoordinatorController(CandidateService candidateService) {
        this.candidateService = candidateService;
    }

    @PostMapping("/candidates")
    public ResponseEntity<?> createCandidate(
            @Valid @RequestBody CandidateRequest request) {

        try {
            CandidateCreationResult result =
                    candidateService.createCandidate(
                            request.name(),
                            request.email(),
                            request.cohort()
                    );

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(result);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(e.getMessage());
        }
    }

    public record CandidateRequest(
            @NotBlank String name,
            @NotBlank @Email String email,
            @NotBlank String cohort
    ) {
    }
    @PostMapping("/candidates/{id}/create-account")
    public ResponseEntity<?> createAccountForExistingCandidate(
            @PathVariable Long id) {

        try {
            CandidateCreationResult result =
                    candidateService.createAccountForExistingLearner(id);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .cacheControl(CacheControl.noStore())
                    .body(result);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(e.getMessage());
        }
    }
}

