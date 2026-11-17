
package com.learningtracker.controller;

import com.learningtracker.entity.Assignment;
import com.learningtracker.repository.AssignmentRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/me")
public class MyTrainingController {

    private final AssignmentRepository assignmentRepository;

    public MyTrainingController(
            AssignmentRepository assignmentRepository) {
        this.assignmentRepository = assignmentRepository;
    }

    @GetMapping("/assignments")
    public ResponseEntity<List<Map<String, Object>>> getMyAssignments(
            Authentication authentication) {

        List<Map<String, Object>> result =
                assignmentRepository
                        .findByLearnerAccountEmailIgnoreCase(
                                authentication.getName()
                        )
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(result);
    }

    private Map<String, Object> toResponse(Assignment assignment) {

        return Map.of(
                "id", assignment.getId(),
                "activity", Map.of(
                        "id", assignment.getActivity().getId(),
                        "title", assignment.getActivity().getTitle(),
                        "topic", assignment.getActivity().getTopic(),
                        "plannedHours",
                        assignment.getActivity().getPlannedHours()
                ),
                "status", assignment.getStatus().name()
        );
    }
}

