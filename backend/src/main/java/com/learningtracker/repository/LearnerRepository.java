package com.learningtracker.repository;

import com.learningtracker.entity.Learner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LearnerRepository extends JpaRepository<Learner, Long> {

    boolean existsByEmailIgnoreCase(String email);

    Optional<Learner> findByEmailIgnoreCase(String email);
}


