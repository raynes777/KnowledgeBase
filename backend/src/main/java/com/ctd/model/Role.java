package com.ctd.model;

public enum Role {
    SPONSOR,
    RESEARCHER,
    HOSPITAL,
    ETHICS_COMMITTEE,
    AUDITOR;

    public boolean canEdit() {
        return this == SPONSOR || this == RESEARCHER || this == HOSPITAL;
    }

    public boolean canApprove() {
        return this == ETHICS_COMMITTEE;
    }

    public boolean canAudit() {
        return this == AUDITOR || this == ETHICS_COMMITTEE;
    }
}
