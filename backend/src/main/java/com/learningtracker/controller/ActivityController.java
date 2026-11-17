
package com.learningtracker.controller;

import com.learningtracker.entity.Activity;
import com.learningtracker.repository.ActivityRepository;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/activities")
public class ActivityController {

    private final ActivityRepository repository;

    public ActivityController(ActivityRepository repository) {
        this.repository = repository;
    }

    // Get all activities
    @GetMapping
    public List<Activity> getAllActivities() {
        return repository.findAll();
    }

    // Add a new activity
    @PostMapping
    public ResponseEntity<Activity> createActivity(
            @Valid @RequestBody Activity activity) {

        Activity savedActivity = repository.save(activity);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savedActivity);
    }

    // Update an existing activity
    @PutMapping("/{id}")
    public ResponseEntity<Activity> updateActivity(
            @PathVariable Long id,
            @Valid @RequestBody Activity updatedActivity) {

        return repository.findById(id)
                .map(activity -> {
                    activity.setTitle(updatedActivity.getTitle());
                    activity.setTopic(updatedActivity.getTopic());
                    activity.setPlannedHours(
                            updatedActivity.getPlannedHours());

                    return ResponseEntity.ok(repository.save(activity));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Delete an activity
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteActivity(@PathVariable Long id) {

        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        repository.deleteById(id);

        return ResponseEntity.noContent().build();
    }
}
