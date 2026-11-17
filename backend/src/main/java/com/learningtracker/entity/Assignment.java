package com.learningtracker.entity;

import jakarta.persistence.*;

@Entity
@Table(
        name = "assignments",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {"learner_id", "activity_id"}
                )
        }
)
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "learner_id", nullable = false)
    private Learner learner;

    @ManyToOne
    @JoinColumn(name = "activity_id", nullable = false)
    private Activity activity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.NOT_STARTED;

    public enum Status {
        NOT_STARTED,
        IN_PROGRESS,
        COMPLETED
    }

    public Assignment() {
    }

    public Long getId() {
        return id;
    }

    public Learner getLearner() {
        return learner;
    }

    public void setLearner(Learner learner) {
        this.learner = learner;
    }

    public Activity getActivity() {
        return activity;
    }

    public void setActivity(Activity activity) {
        this.activity = activity;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }
}

