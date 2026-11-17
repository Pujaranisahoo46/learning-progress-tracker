package com.learningtracker.controller;

import com.learningtracker.repository.LearnerRepository;
import com.learningtracker.service.CandidateService;
import com.learningtracker.service.CandidateService.CandidateCreationResult;
import com.learningtracker.service.CandidateService.CandidateResetResult;

import jakarta.validation.Valid;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/learners")
public class LearnerController {

    private final LearnerRepository repository;
    private final CandidateService candidateService;

    public LearnerController(
            LearnerRepository repository,
            CandidateService candidateService) {
        this.repository = repository;
        this.candidateService = candidateService;
    }

    @GetMapping
    public List<LearnerResponse> getAllLearners() {
        return repository.findAll().stream()
                .map(learner -> new LearnerResponse(
                        learner.getId(),
                        learner.getName(),
                        learner.getEmail(),
                        learner.getCohort()
                ))
                .toList();
    }

    @PostMapping
    public ResponseEntity<?> createLearner(
            @Valid @RequestBody CreateLearnerRequest request) {

        try {
            CandidateCreationResult result =
                    candidateService.createCandidate(
                            request.name(),
                            request.email(),
                            request.cohort()
                    );

            return ResponseEntity.status(HttpStatus.CREATED)
                    .cacheControl(CacheControl.noStore())
                    .body(result);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<?> resetCandidatePassword(
            @PathVariable Long id) {

        try {
            CandidateResetResult result =
                    candidateService.resetCandidatePassword(id);

            return ResponseEntity.ok()
                    .cacheControl(CacheControl.noStore())
                    .body(result);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }

    public record CreateLearnerRequest(
            String name,
            String email,
            String cohort
    ) {
    }

    public record LearnerResponse(
            Long id,
            String name,
            String email,
            String cohort
    ) {
    }
}
