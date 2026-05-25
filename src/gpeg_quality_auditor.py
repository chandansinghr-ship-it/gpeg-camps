#!/usr/bin/env python3
"""
GPEG Automated Quality Auditor & Compliance Engine.
Scans transcripts, subject lines, and case timelines to prevent score penalties.
"""

import re
from datetime import datetime, timedelta
import json

class GPEGQualityAuditor:
    def __init__(self, case_record):
        self.case_id = case_record.get("case_id")
        self.agency_name = case_record.get("agency_name")
        self.camp_type = case_record.get("camp_type")
        self.region = case_record.get("region")
        self.agency_type = case_record.get("agency_type") # "LCS" or "GCS"
        self.poc_email = case_record.get("gpeg_poc_1")
        self.planned_date = case_record.get("planned_date") # datetime object
        
        # Extracted post-session artifacts
        self.subject_line = case_record.get("subject_line", "")
        self.shared_folder_name = case_record.get("shared_folder_name", "")
        self.transcript_text = case_record.get("session_transcripts", "")
        self.deck_shared_timestamp = case_record.get("deck_shared_timestamp") # datetime object
        self.follow_up_email_body = case_record.get("follow_up_email_body", "")

    def audit_naming_conventions(self):
        """
        Rule: Folder and Case Subject Line naming convention must strictly follow:
        Case ID | Agency Type | Region | Product Type | Agency Name
        Example: 12345 | GCS/LCS | AMER/EMEA/APAC | pMax, Demadgen etc | XYZ Media
        """
        pattern = rf"^{re.escape(self.case_id)}\s*\|\s*(GCS|LCS)\s*\|\s*(AMER|EMEA|APAC|MENA)\s*\|\s*[a-zA-Z0-9\s+&]+\s*\|\s*{re.escape(self.agency_name)}"
        
        subject_valid = bool(re.search(pattern, self.subject_line, re.IGNORECASE))
        folder_valid = bool(re.search(pattern, self.shared_folder_name, re.IGNORECASE))
        
        return {
            "subject_line_format_passed": subject_valid,
            "shared_folder_format_passed": folder_valid,
            "penalty_deducted": 0 if (subject_valid and folder_valid) else 5
        }

    def audit_presenter_identity(self):
        """
        Rule 1: Presenters must not introduce themselves as 'working at Google'.
        Rule 2: Avoid putting co-presenters on the spot without prior agreement.
        """
        forbidden_phrases = [
            r"i work at google",
            r"i am a googler",
            r"working at google",
            r"here at google we"
        ]
        
        violations = []
        for phrase in forbidden_phrases:
            if re.search(phrase, self.transcript_text, re.IGNORECASE):
                violations.append(phrase)
                
        passed = len(violations) == 0
        return {
            "presenter_identity_passed": passed,
            "violations_detected": violations,
            "penalty_deducted": 0 if passed else 10
        }

    def audit_deck_delivery_timeline(self):
        """
        Rule: The final version of the presentation deck must be shared 48 hours before camp delivery.
        """
        if not self.planned_date or not self.deck_shared_timestamp:
            return {"deck_timeline_passed": False, "penalty_deducted": 10, "comment": "Missing date timestamps"}
            
        time_diff = self.planned_date - self.deck_shared_timestamp
        passed = time_diff >= timedelta(hours=48)
        
        return {
            "deck_timeline_passed": passed,
            "hours_prior_shared": time_diff.total_seconds() / 3600,
            "penalty_deducted": 0 if passed else 10
        }

    def audit_in_camp_feedback_and_eta(self):
        """
        Rule 1: State explicitly a 24-48 hour timeline for answering queries during camp.
        Rule 2: Share the actual post-camp feedback form link during live camp delivery (not just a QR).
        Failing to state this ETA results in a critical 50% markdown on the audit matrix.
        """
        eta_patterns = [
            r"24\s*-\s*48\s*hours",
            r"24\s*to\s*48\s*hours",
            r"one\s*to\s*two\s*days",
            r"within\s*48\s*hours"
        ]
        
        eta_stated = any(re.search(pat, self.transcript_text, re.IGNORECASE) for pat in eta_patterns) or \
                     any(re.search(pat, self.follow_up_email_body, re.IGNORECASE) for pat in eta_patterns)
                     
        form_link_shared = "forms.gle" in self.transcript_text or "docs.google.com/forms" in self.transcript_text
        
        passed = eta_stated and form_link_shared
        return {
            "eta_communicated": eta_stated,
            "form_link_shared_in_chat": form_link_shared,
            "critical_50_percent_markdown": not passed,
            "penalty_deducted": 0 if passed else 50
        }

    def run_full_quality_audit(self):
        """
        Executes all GPEG Quality checks and calculates the final normalized score.
        """
        naming = self.audit_naming_conventions()
        identity = self.audit_presenter_identity()
        timeline = self.audit_deck_delivery_timeline()
        feedback = self.audit_in_camp_feedback_and_eta()
        
        total_deductions = naming["penalty_deducted"] + identity["penalty_deducted"] + \
                           timeline["penalty_deducted"] + feedback["penalty_deducted"]
                           
        final_score = 100 - total_deductions
        if feedback["critical_50_percent_markdown"]:
            final_score = min(final_score, 50) # Enforce the hard 50% critical markdown limit
            
        return {
            "case_id": self.case_id,
            "final_compliance_score": final_score,
            "passed_quality_standard": final_score >= 85,
            "breakdown": {
                "naming_conventions": naming,
                "presenter_identity": identity,
                "deck_timeline": timeline,
                "feedback_and_eta": feedback
            }
        }

if __name__ == "__main__":
    mock_case = {
        "case_id": "8-2283000041206",
        "agency_name": "Salestube",
        "camp_type": "Measurement",
        "region": "EMEA",
        "gpeg_poc_1": "sauravi@xwf.google.com",
        "planned_date": datetime(2026, 7, 16, 9, 0),
        "deck_shared_timestamp": datetime(2026, 7, 15, 9, 0), # Shared only 24 hours prior (Violation)
        "subject_line": "8-2283000041206 | GCS | EMEA | Measurement | Salestube", # Correct Naming
        "shared_folder_name": "8-2283000041206 | GCS | EMEA | Measurement | Salestube", # Correct Naming
        "session_transcripts": "Hi everyone, I am Sauravi delivering this session on behalf of Google. Please fill out the form here: https://forms.gle/hHP11MLpCmZtsyup6. All unanswered questions will be resolved within 24 to 48 hours.", # No "working at Google" violation, correctly states 24-48h ETA
        "follow_up_email_body": "Here are your post-camp resources. Unanswered questions will be answered in 24 to 48 hours."
    }
    
    auditor = GPEGQualityAuditor(mock_case)
    results = auditor.run_full_quality_audit()
    print(json.dumps(results, indent=2))
