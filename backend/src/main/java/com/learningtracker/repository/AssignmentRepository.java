
package com.learningtracker.repository;

import com.learningtracker.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssignmentRepository
        extends JpaRepository<Assignment, Long> {

    // Get assignments using learner ID
    List<Assignment> findByLearnerId(Long learnerId);

    // Prevent duplicate assignments
    boolean existsByLearnerIdAndActivityId(
            Long learnerId,
            Long activityId
    );

    // Get assignments belonging to the logged-in candidate
    List<Assignment> findByLearnerAccountEmailIgnoreCase(String email);
}
