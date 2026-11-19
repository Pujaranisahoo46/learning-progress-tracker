
package com.learningtracker.controller;

import com.learningtracker.entity.Assignment;
import com.learningtracker.entity.Learner;
import com.learningtracker.repository.AssignmentRepository;
import com.learningtracker.repository.LearnerRepository;
import com.learningtracker.repository.ActivityRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/assignments")
public class AssignmentController {

    private final AssignmentRepository assignmentRepository;
    private final LearnerRepository learnerRepository;
    private final ActivityRepository activityRepository;

    public AssignmentController(
            AssignmentRepository assignmentRepository,
            LearnerRepository learnerRepository,
            ActivityRepository activityRepository) {

        this.assignmentRepository = assignmentRepository;
        this.learnerRepository = learnerRepository;
        this.activityRepository = activityRepository;
    }

    private boolean isCoordinator(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_COORDINATOR"));
    }

    private boolean ownsAssignment(
            Assignment assignment,
            Authentication authentication) {

        return assignment.getLearner().getEmail()
                .equalsIgnoreCase(authentication.getName());
    }

    private Map<String, Object> toResponse(Assignment assignment) {

        return Map.of(
                "id", assignment.getId(),
                "learner", Map.of(
                        "id", assignment.getLearner().getId(),
                        "name", assignment.getLearner().getName(),
                        "email", assignment.getLearner().getEmail(),
                        "cohort", assignment.getLearner().getCohort()
                ),
                "activity", Map.of(
                        "id", assignment.getActivity().getId(),
                        "title", assignment.getActivity().getTitle(),
                        "topic", assignment.getActivity().getTopic(),
                        "plannedHours", assignment.getActivity().getPlannedHours()
                ),
                "status", assignment.getStatus().name()
        );
    }

    // Admin: View all assignments
    @GetMapping
    public ResponseEntity<?> getAllAssignments(
            Authentication authentication) {

        if (!isCoordinator(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Only Admin can view all assignments"));
        }

        List<Map<String, Object>> result =
                assignmentRepository.findAll()
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(result);
    }

    // Admin: Create an assignment
    @PostMapping
    public ResponseEntity<?> createAssignment(
            @RequestBody Map<String, Long> request,
            Authentication authentication) {

        if (!isCoordinator(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Only Admin can create assignments"));
        }

        Long learnerId = request.get("learnerId");
        Long activityId = request.get("activityId");

        if (learnerId == null || activityId == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Learner ID and Activity ID are required"));
        }

        if (assignmentRepository.existsByLearnerIdAndActivityId(
                learnerId, activityId)) {

            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "This activity is already assigned"));
        }

        var learner = learnerRepository.findById(learnerId);
        var activity = activityRepository.findById(activityId);

        if (learner.isEmpty() || activity.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Learner or activity not found"));
        }

        Assignment assignment = new Assignment();
        assignment.setLearner(learner.get());
        assignment.setActivity(activity.get());

        Assignment saved = assignmentRepository.save(assignment);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(toResponse(saved));
    }

    // Admin: View assignments for any learner.
    // Student: View only their own assignments.
    @GetMapping("/learner/{learnerId}")
    public ResponseEntity<?> getLearnerAssignments(
            @PathVariable Long learnerId,
            Authentication authentication) {

        var learnerOptional = learnerRepository.findById(learnerId);

        if (learnerOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Learner not found"));
        }

        Learner learner = learnerOptional.get();

        if (!isCoordinator(authentication)
                && !learner.getEmail().equalsIgnoreCase(authentication.getName())) {

            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You cannot view another student's assignments"));
        }

        List<Map<String, Object>> result =
                assignmentRepository.findByLearnerId(learnerId)
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(result);
    }

   
    // Only the owner Student can update assignment status
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            Authentication authentication) {

        // Coordinator/Admin can view progress but cannot update it
        if (isCoordinator(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message",
                            "Coordinator can view progress but cannot update student status"
                    ));
        }

        var assignmentOptional = assignmentRepository.findById(id);

        if (assignmentOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Assignment not found"));
        }

        Assignment assignment = assignmentOptional.get();

        if (!ownsAssignment(assignment, authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message",
                            "You cannot update another student's assignment"
                    ));
        }

        String status = request.get("status");

        try {
            if (status == null) {
                throw new IllegalArgumentException();
            }

            Assignment.Status newStatus =
                    Assignment.Status.valueOf(status);

            assignment.setStatus(newStatus);

            Assignment saved = assignmentRepository.save(assignment);

            return ResponseEntity.ok(toResponse(saved));

        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            "Invalid status. Use NOT_STARTED, IN_PROGRESS or COMPLETED"
                    ));
        }
    }

}
