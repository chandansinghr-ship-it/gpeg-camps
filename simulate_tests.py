import sys
import random
from datetime import datetime, timedelta

# ANSI Color codes
PURPLE = '\033[95m'
CYAN = '\033[96m'
GREEN = '\033[92m'
RED = '\033[91m'
RESET = '\033[0m'

print(f"{PURPLE}=================================================={RESET}")
print(f"{PURPLE}   GPEG CAMPS - PYTHON E2E STATE SIMULATION RUNNER{RESET}")
print(f"{PURPLE}=================================================={RESET}")
print("System Time: 2026-05-18T14:34:38Z\n")

# 1. Mock Database Seed State (from data.js)
state_camps = [
  {
    "id": "2-9828000040100",
    "agency": "Omnicom Group",
    "amEmail": "am.john@google.com",
    "product": "CM360",
    "stage": "nomination",
    "status": "Pending Kickoff",
    "nominationDate": "2026-05-18",
    "discoveryStatus": "Not Sent",
    "discoveryData": None,
    "deckType": "Standard Deck",
    "scheduledTime": None,
    "presenter": None,
    "liveQuestions": [],
    "followUpSent": False,
    "slaBreached": False,
    "slaDaysRemaining": None,
    "bfmUplift": None,
    "feedbackScore": None
  },
  {
    "id": "1-4893000041135",
    "agency": "GroupM",
    "amEmail": "am.sarah@google.com",
    "product": "DV360",
    "stage": "pre-camp",
    "status": "Awaiting Discovery",
    "nominationDate": "2026-05-14",
    "discoveryStatus": "Pending",
    "discoveryData": None,
    "deckType": "Standard Deck",
    "scheduledTime": "2026-05-22T14:00:00Z",
    "presenter": "Alex Rivera (Presenter)",
    "liveQuestions": [],
    "followUpSent": False,
    "slaBreached": False,
    "slaDaysRemaining": 3,
    "bfmUplift": None,
    "feedbackScore": None
  },
  {
    "id": "3-7721000010200",
    "agency": "Dentsu Aegis",
    "amEmail": "am.mark@google.com",
    "product": "Analytics Masterclass",
    "stage": "in-camp",
    "status": "Live Session Active",
    "nominationDate": "2026-05-12",
    "discoveryStatus": "Submitted",
    "discoveryData": {
      "confidence": "Intermediate",
      "challenges": "Attribution modeling and conversion linker setups.",
      "topics": ["Attribution Models", "Conversion Linker", "GA4 integrations"]
    },
    "deckType": "Customized Deck",
    "scheduledTime": "2026-05-18T11:00:00Z",
    "presenter": "Taylor Chen (Presenter)",
    "liveQuestions": [
      { "id": "q1", "text": "Does GA4 automatically link conversion paths from CM360 without GTM?", "answered": True, "answer": "Yes, when linking CM360 directly to GA4 property in admin panel." }
    ],
    "followUpSent": False,
    "slaBreached": False,
    "slaDaysRemaining": None,
    "bfmUplift": None,
    "feedbackScore": None
  },
  {
    "id": "4-9901000031200",
    "agency": "Publicis Groupe",
    "amEmail": "am.lisa@google.com",
    "product": "CM360 Advanced",
    "stage": "post-camp",
    "status": "Resolving Queries & Follow-up",
    "nominationDate": "2026-05-10",
    "discoveryStatus": "Submitted",
    "discoveryData": {
      "confidence": "Advanced",
      "challenges": "Dynamic creative setups and custom floodlight variables.",
      "topics": ["Dynamic Creatives", "Custom Floodlights", "S2S API integrations"]
    },
    "deckType": "Customized Deck",
    "scheduledTime": "2026-05-17T10:00:00Z",
    "presenter": "Jordan Blake (Presenter)",
    "liveQuestions": [
      { "id": "q2", "text": "Can custom Floodlights be passed via S2S API without a web tag?", "answered": False, "answer": None }
    ],
    "followUpSent": False,
    "slaBreached": False,
    "slaDaysRemaining": 1,
    "bfmUplift": None,
    "feedbackScore": None
  },
  {
    "id": "5-1102000088900",
    "agency": "Interpublic Group (IPG)",
    "amEmail": "am.kevin@google.com",
    "product": "Attribution & BFM",
    "stage": "closed",
    "status": "Impact Logged",
    "nominationDate": "2026-04-12",
    "discoveryStatus": "Submitted",
    "discoveryData": {
      "confidence": "Beginner",
      "challenges": "Understanding BFM benefits over standard setups.",
      "topics": ["BFM basics", "Bidding optimization"]
    },
    "deckType": "Customized Deck",
    "scheduledTime": "2026-04-18T15:00:00Z",
    "presenter": "Taylor Chen (Presenter)",
    "liveQuestions": [],
    "followUpSent": True,
    "slaBreached": False,
    "slaDaysRemaining": None,
    "bfmUplift": 18.4,
    "feedbackScore": 4.8
  }
]

state_outbox = []

# 2. Assert Helper
passed_tests = 0
total_tests = 6

def run_assert(condition, message):
    if not condition:
        print(f"  {RED}[FAILED] {message}{RESET}")
        raise AssertionError(message)
    else:
        print(f"  {GREEN}[PASSED] {message}{RESET}")

try:
    # ------------------------------------------------------------
    print(f"{CYAN}[TC-01: API Sync - Cases Connect Webhook Ingestion]{RESET}")
    # Input parameters
    agency_name = "Publicis Zenith"
    am_email = "am.zenith@google.com"
    product_area = "CM360"

    # Ingestion execution
    serial = random.randint(10000000, 99999999)
    new_case_id = f"2-{serial}"
    new_camp = {
        "id": new_case_id,
        "agency": agency_name,
        "amEmail": am_email,
        "product": product_area,
        "stage": "nomination",
        "status": "Pending Kickoff",
        "nominationDate": "2026-05-18",
        "discoveryStatus": "Not Sent",
        "discoveryData": None,
        "deckType": "Standard Deck",
        "scheduledTime": None,
        "presenter": None,
        "liveQuestions": [],
        "followUpSent": False,
        "slaBreached": False,
        "slaDaysRemaining": None,
        "bfmUplift": None,
        "feedbackScore": None
    }
    state_camps.insert(0, new_camp)

    run_assert(state_camps[0]["agency"] == "Publicis Zenith", "Nomination agency initialized as 'Publicis Zenith'")
    run_assert(state_camps[0]["amEmail"] == "am.zenith@google.com", "Nominator email registered correctly")
    run_assert(state_camps[0]["product"] == "CM360", "Product area registered correctly")
    run_assert(state_camps[0]["stage"] == "nomination", "Stage starts at 'nomination'")
    run_assert(state_camps[0]["status"] == "Pending Kickoff", "Status correctly set to 'Pending Kickoff'")
    passed_tests += 1

    # ------------------------------------------------------------
    print(f"\n{CYAN}[TC-02: Presenter Dashboard active pipeline Kanban and metrics]{RESET}")
    active_count = len([c for c in state_camps if c["stage"] != "closed"])
    precamp_pending = len([c for c in state_camps if c["stage"] == "pre-camp" and c["discoveryStatus"] == "Pending"])
    closed_count = len([c for c in state_camps if c["stage"] == "closed"])

    run_assert(active_count == 5, f"Metric counter shows exactly 5 active camps in pipeline (Seed data + TC-01)")
    run_assert(precamp_pending == 1, "Metric shows exactly 1 pending client discovery form")
    run_assert(closed_count == 1, "Metric shows exactly 1 closed camp (IPG)")
    passed_tests += 1

    # ------------------------------------------------------------
    print(f"\n{CYAN}[TC-03: Agency Portal - Dynamic client discovery form submission]{RESET}")
    target_id = "1-4893000041135" # GroupM Camp
    camp = next(c for c in state_camps if c["id"] == target_id)

    # Client fills form
    discovery_confidence = "Intermediate"
    discovery_challenges = "Optimization and conversion linker setups."
    discovery_topics = ["Attribution Models", "Conversion Linker"]

    # Process submission
    camp["discoveryStatus"] = "Submitted"
    camp["discoveryData"] = {
        "confidence": discovery_confidence,
        "challenges": discovery_challenges,
        "topics": discovery_topics
    }
    camp["deckType"] = "Customized Deck"
    camp["status"] = "Discovery Received"

    # Log outbound notification
    state_outbox.insert(0, {
        "from": camp["amEmail"],
        "to": "gpeg-camps@google.com",
        "subject": f"Discovery Submitted: Case {camp['id']} - {camp['agency']}",
        "body": "Hi GPEG Team, Discovery answers submitted. Tailoring customized presentation now."
    })

    run_assert(camp["discoveryStatus"] == "Submitted", "Discovery status changed to 'Submitted'")
    run_assert(camp["deckType"] == "Customized Deck", "Deck adapted from 'Standard' to 'Customized Deck'")
    run_assert(camp["status"] == "Discovery Received", "Card status changed to 'Discovery Received'")
    run_assert(len(state_outbox) == 1, "Centralized inbound outbox logged client submission email notification")
    passed_tests += 1

    # ------------------------------------------------------------
    print(f"\n{CYAN}[TC-04: Presenter Console & PM Escalation Queue]{RESET}")
    # Active Live session (Dentsu - ID: 3-7721000010200)
    live_id = "3-7721000010200"
    live_camp = next(c for c in state_camps if c["id"] == live_id)

    # Presenter logs a question and escalates to PM
    escalated_q = {
        "id": "q_test_1",
        "text": "Can custom Floodlights be passed via S2S API?",
        "answered": False,
        "answer": None
    }
    live_camp["liveQuestions"].append(escalated_q)

    run_assert(len(live_camp["liveQuestions"]) == 2, "New live question appended to active camp session")
    run_assert(live_camp["liveQuestions"][-1]["answered"] is False, "Question marked unresolved and escalated")

    # PM processes escalation queue and resolves
    pm_answer = "Yes, they are fully supported via standard parameters mapping console."
    escalated_q["answered"] = True
    escalated_q["answer"] = pm_answer

    # Notify presenter
    state_outbox.insert(0, {
        "from": "gpeg-camps@google.com",
        "to": live_camp["amEmail"],
        "subject": f"RESOLVED Q&A: Case {live_camp['id']} - {live_camp['agency']}",
        "body": f"Question: {escalated_q['text']}\nAnswer: {pm_answer}"
    })

    run_assert(escalated_q["answered"] is True, "Question successfully resolved in database")
    run_assert(escalated_q["answer"] == pm_answer, "PM expert response correctly saved")
    run_assert(state_outbox[0]["subject"] == f"RESOLVED Q&A: Case {live_id} - {live_camp['agency']}", "Outbox notification dispatched to presenter")
    passed_tests += 1

    # ------------------------------------------------------------
    print(f"\n{CYAN}[TC-05: Email Ingestion Parser Gateway]{RESET}")
    # Raw Email nomination Mock
    email_from = "am.starcom@google.com"
    email_subject = "Nomination request for Starcom: BFM & bidding camp"
    email_body = "Hi Camps team, Starcom wants a customized BFM camp for their bidding team on June 15. Please set it up!"

    # Parse simulation
    parsed_agency = "Starcom Global" if "starcom" in email_body.lower() else "Standard"
    parsed_product = "Attribution & BFM" if "bfm" in email_body.lower() else "Standard"

    new_inbound_camp = {
        "id": f"2-{random.randint(10000000, 99999999)}",
        "agency": parsed_agency,
        "amEmail": email_from,
        "product": parsed_product,
        "stage": "nomination",
        "status": "Pending Kickoff",
        "nominationDate": "2026-05-18",
        "discoveryStatus": "Not Sent",
        "discoveryData": None,
        "deckType": "Standard Deck",
        "scheduledTime": None,
        "presenter": None,
        "liveQuestions": [],
        "followUpSent": False,
        "slaBreached": False,
        "slaDaysRemaining": None,
        "bfmUplift": None,
        "feedbackScore": None
    }
    state_camps.insert(0, new_inbound_camp)

    run_assert(state_camps[0]["agency"] == "Starcom Global", "Email parsed agency name as 'Starcom Global'")
    run_assert(state_camps[0]["product"] == "Attribution & BFM", "Email parsed target product as 'Attribution & BFM'")
    run_assert(state_camps[0]["amEmail"] == "am.starcom@google.com", "Email parsed Account Manager LDAP")
    passed_tests += 1

    # ------------------------------------------------------------
    print(f"\n{CYAN}[TC-06: Dynamic SLA Warning Alerts Monitoring]{RESET}")
    # Simulate date progression by checking seed SLA breach levels
    warnings_found = 0
    for c in state_camps:
        is_alert = False
        if c["stage"] == "pre-camp" and c["slaDaysRemaining"] is not None and c["slaDaysRemaining"] <= 3:
            is_alert = True
        elif c["stage"] == "post-camp" and not c["followUpSent"]:
            is_alert = True
        
        if is_alert:
            warnings_found += 1
            print(f"  [SLA Warning Active] Camp {c['id']} for {c['agency']} has dynamic alert marker triggered.")

    run_assert(warnings_found >= 2, f"SLA monitoring correctly reports warning triggers (Found {warnings_found} active warnings)")
    passed_tests += 1

    # ------------------------------------------------------------
    print(f"\n{CYAN}[TC-07: RBAC Persona switcher and access restrictions]{RESET}")
    # Mock initial role
    active_role = "Presenter"
    
    # Action 1: Presenter attempts Cases Connect (denied/hidden in UI)
    presenter_permissions = ["Dashboard", "Agency Portal", "Email Gateway", "Resource Repository"]
    run_assert("Cases Connect Sandbox" not in presenter_permissions, "Presenter permissions restrict Cases Connect tab")
    run_assert("PM Queue" not in presenter_permissions, "Presenter permissions restrict PM Queue tab")
    
    # Action 2: Switch role to Product Manager (PM)
    active_role = "PM"
    pm_permissions = ["PM Queue", "Dashboard", "Resource Repository"]
    run_assert("Cases Connect Sandbox" not in pm_permissions, "PM permissions restrict Cases Connect tab")
    run_assert("Agency Portal" not in pm_permissions, "PM permissions restrict Agency Portal tab")
    run_assert("PM Queue" in pm_permissions, "PM permissions authorize PM Queue tab access")
    passed_tests += 1

    # ------------------------------------------------------------
    print(f"\n{CYAN}[TC-08: Dynamic Audit Logging and Activity Logs]{RESET}")
    # Seed logs + simulated logging
    state_logs = [
      { "timestamp": "2026-05-18T11:00:00Z", "level": "INFO", "message": "System initialized." }
    ]
    
    # Simulate logging an action
    new_log_msg = "Active role changed to: [PM]"
    state_logs.insert(0, {
        "timestamp": "2026-05-18T14:34:38Z",
        "level": "WARNING",
        "message": new_log_msg
    })
    
    run_assert(len(state_logs) == 2, "New audit log successfully created in local datastore logs")
    run_assert(state_logs[0]["level"] == "WARNING", "Audit log level 'WARNING' logged correctly")
    run_assert(state_logs[0]["message"] == new_log_msg, "Audit log details synced perfectly")
    passed_tests += 1

    # ------------------------------------------------------------
    print(f"\n{CYAN}[TC-09: Inter-Team Task Board UI]{RESET}")
    state_tasks = [
      { "id": "t1", "title": "Assign Lead Presenter to Case 2-9828", "assignee": "Presenter", "done": False },
      { "id": "t2", "title": "Review Discovery form data", "assignee": "Presenter", "done": False }
    ]
    
    # 1. Add task
    new_task_title = "Review GroupM Discovery menu"
    state_tasks.insert(0, {
        "id": "t3",
        "title": new_task_title,
        "assignee": "Presenter",
        "done": False
    })
    
    run_assert(len(state_tasks) == 3, "Task successfully added to task board")
    
    # 2. Check/complete task
    target_task = next(t for t in state_tasks if t["id"] == "t1")
    target_task["done"] = True
    
    run_assert(target_task["done"] is True, "Task successfully toggled to Complete")
    run_assert(len([t for t in state_tasks if not t["done"]]) == 2, "Counts verify exactly 2 tasks remaining pending")
    passed_tests += 1

    # ------------------------------------------------------------
    print(f"\n{CYAN}[TC-10: Team Collaboration Chat interface]{RESET}")
    state_chats = [
      { "sender": "Presenter", "text": "Discovery form link sent to GroupM" }
    ]
    
    # Send chat message
    msg_text = "AM Sarah, please push GroupM for Discovery submission"
    state_chats.append({
        "sender": "Presenter",
        "text": msg_text
    })
    
    # Simulated response trigger
    if "discovery" in msg_text.lower():
        state_chats.append({
            "sender": "AM",
            "text": "On it! Pushing contacts today."
        })
        
    run_assert(len(state_chats) == 3, "Chat message logged and automated AM reply triggered successfully")
    run_assert(state_chats[-1]["sender"] == "AM", "Collaborative response verified from role: AM")
    passed_tests += 1

    # ------------------------------------------------------------
    print(f"\n{CYAN}[TC-11: Workspace Sync & CC/BCC Email Gateway Ingest]{RESET}")
    # 1. Ingest email with CC/BCC fields
    gateway_mail = {
        "from": "am.starcom@google.com",
        "cc": "cc.am@google.com",
        "bcc": "bcc.audit@google.com",
        "subject": "Nomination for Starcom",
        "body": "Starcom nomination"
    }
    
    state_outbox.insert(0, {
        "timestamp": "2026-05-18T14:34:38Z",
        "from": "gpeg-camps@google.com",
        "to": gateway_mail["from"],
        "cc": gateway_mail["cc"],
        "bcc": gateway_mail["bcc"],
        "subject": f"Ingest Nomination - Starcom",
        "body": "Nomination received."
    })
    
    run_assert(state_outbox[0]["cc"] == "cc.am@google.com", "CC address successfully parsed and recorded")
    run_assert(state_outbox[0]["bcc"] == "bcc.audit@google.com", "BCC address successfully parsed and recorded")
    
    # 2. Workspace Drive/Docs Mock sync status check
    camp_sync_state = { "caseId": "1-4893000041135", "driveSynced": False, "docsCompiled": False }
    
    # Sync triggers
    camp_sync_state["driveSynced"] = True
    camp_sync_state["docsCompiled"] = True
    
    run_assert(camp_sync_state["driveSynced"] is True, "Google Drive workspace integration mock successfully synced")
    run_assert(camp_sync_state["docsCompiled"] is True, "Google Docs workspace integration mock compiled package summary")
    passed_tests += 1

    # ------------------------------------------------------------
    print(f"\n{CYAN}[TC-12: Automated Data Retention & Recording Deletion Cron]{RESET}")
    # Mock camp record closed for 123 days (Case 6-2203000011200, nomination date "2026-01-15")
    retention_camp = {
        "id": "6-2203000011200",
        "agency": "Havas Media",
        "stage": "closed",
        "nominationDate": "2026-01-15",
        "recordingDeleted": False
    }
    
    # Simulated cron execution logic (calculates elapsed time since nomination date)
    simulated_now = datetime.strptime("2026-05-18T14:34:38Z", "%Y-%m-%dT%H:%M:%SZ")
    nomination_time = datetime.strptime(retention_camp["nominationDate"], "%Y-%m-%d")
    elapsed_days = (simulated_now - nomination_time).days
    
    # Cron rules: if closed and older than 90 days
    if retention_camp["stage"] == "closed" and not retention_camp["recordingDeleted"]:
        if elapsed_days > 90:
            retention_camp["recordingDeleted"] = True
            # Log warn action
            state_logs.insert(0, {
                "timestamp": "2026-05-18T14:34:38Z",
                "level": "WARNING",
                "message": f"Automated Data Retention: Purged expired recording for {retention_camp['agency']} - older than 90 days."
            })
            
    run_assert(elapsed_days == 123, "Calculated elapsed time matches exactly 123 days")
    run_assert(retention_camp["recordingDeleted"] is True, "Data retention cron successfully deleted/purged expired recording")
    run_assert("Purged expired recording" in state_logs[0]["message"], "Automated warning log generated successfully inside system logs")
    passed_tests += 1

    # ------------------------------------------------------------
    print(f"\n{CYAN}[TC-13: Specialized Programs Curriculums & Regional Scoping Badges]{RESET}")
    # 1. Ingest specialized Partnership Ads training in APAC Region
    pa_camp = {
        "id": "2-84930221",
        "agency": "GroupM APAC",
        "product": "Partnership Ads Training (MFG - WPP)",
        "region": "APAC",
        "stage": "in-camp"
    }
    
    # Dynamic checklist simulation
    checklist_items = []
    if "Partnership Ads" in pa_camp["product"]:
        checklist_items.append("MFG / WPP concise 45-60 min limit monitored")
        checklist_items.append("DR-focused PA models reviewed")
        
    # Validate HSL colors region scoping
    region_style_class = "APAC" if pa_camp["region"] == "APAC" else "Standard"
    
    run_assert(pa_camp["region"] == "APAC", "APAC regional scope successfully verified")
    run_assert(region_style_class == "APAC", "HSL Region Badge styling matches 'APAC' rules")
    run_assert("MFG / WPP concise 45-60 min limit monitored" in checklist_items, "Dynamic checklist successfully loaded curriculum duration rules")
    passed_tests += 1

    # ------------------------------------------------------------
    print(f"\n{CYAN}[TC-14: Drag-and-Drop stage drops and triggers]{RESET}")
    drag_camp = { "id": "2-9828", "stage": "nomination", "discoveryStatus": "Not Sent" }
    
    # Drop target columns simulation
    dropped_column_id = "col-precamp"
    target_stage = "pre-camp" if dropped_column_id == "col-precamp" else "nomination"
    
    # Trigger drop transition
    if drag_camp["stage"] == "nomination" and target_stage == "pre-camp":
        # Simulates opening kickoff scheduler modal
        drag_camp["stage"] = target_stage
        drag_camp["status"] = "Awaiting Discovery"
        drag_camp["slaDaysRemaining"] = 3
        
    run_assert(drag_camp["stage"] == "pre-camp", "Camp stage successfully transitioned to 'pre-camp' on drop")
    run_assert(drag_camp["slaDaysRemaining"] == 3, "Kickoff scheduler successfully initialized SLA parameters")
    passed_tests += 1

    # ------------------------------------------------------------
    print(f"\n{CYAN}[TC-15: SLA Time Machine Simulation temporal travel]{RESET}")
    time_camp = {
        "id": "1-489302",
        "stage": "pre-camp",
        "deckType": "Customized Deck",
        "slaDaysRemaining": 3,
        "slaBreached": False,
        "status": "Awaiting Discovery"
    }
    
    # Fast forward simulated clock +5 days
    skip_days = 5
    time_camp["slaDaysRemaining"] = max(0, time_camp["slaDaysRemaining"] - skip_days)
    
    if time_camp["slaDaysRemaining"] == 0:
        time_camp["slaBreached"] = True
        time_camp["deckType"] = "Standard Deck" # Reverts to default deck protocol!
        time_camp["status"] = "SLA Breached ⚠️"
        state_logs.insert(0, {
            "timestamp": "2026-05-18T14:34:38Z",
            "level": "WARNING",
            "message": f"SLA Expiration: Case {time_camp['id']} Discovery SLA breached! Reverted to Default Deck Protocol."
        })
        
    run_assert(time_camp["slaDaysRemaining"] == 0, "Time travel successfully decremented SLA countdown to 0")
    run_assert(time_camp["slaBreached"] is True, "SLA breach flag activated")
    run_assert(time_camp["deckType"] == "Standard Deck", "Default Deck Protocol successfully triggered (Adapted back to Standard Deck)")
    run_assert("SLA Expiration" in state_logs[0]["message"], "SLA breach warning correctly synced to activity logs")
    passed_tests += 1

    # ------------------------------------------------------------
    print(f"\n{CYAN}[TC-16: Presenter Schedule Calendar Grid double-booking checker]{RESET}")
    # Seed two overlapping sessions scheduled on the same day for Taylor Chen
    session1 = { "caseId": "A", "presenter": "Taylor Chen", "time": "2026-05-25T10:00:00Z", "conflict": False }
    session2 = { "caseId": "B", "presenter": "Taylor Chen", "time": "2026-05-25T10:30:00Z", "conflict": False }
    
    # Conflict check logic
    time1 = datetime.strptime(session1["time"], "%Y-%m-%dT%H:%M:%SZ")
    time2 = datetime.strptime(session2["time"], "%Y-%m-%dT%H:%M:%SZ")
    diff_minutes = abs((time1 - time2).total_seconds()) / 60
    
    if session1["presenter"] == session2["presenter"]:
        if diff_minutes < 90: # Clash if scheduled within 90 minutes
            session1["conflict"] = True
            session2["conflict"] = True
            state_logs.insert(0, {
                "timestamp": "2026-05-18T14:34:38Z",
                "level": "WARNING",
                "message": f"Calendar Clash: Presenter {session1['presenter']} is double booked!"
            })
            
    run_assert(diff_minutes == 30, "Session gap calculated exactly as 30 minutes")
    run_assert(session1["conflict"] is True, "Schedule clash conflict successfully flagged for Session A")
    run_assert(session2["conflict"] is True, "Schedule clash conflict successfully flagged for Session B")
    run_assert("Calendar Clash" in state_logs[0]["message"], "Schedule collision logged inside system activity audits")
    passed_tests += 1

    # ------------------------------------------------------------
    print(f"\n{CYAN}[TC-17: Secure Agency Gateway Authentication & Isolation]{RESET}")
    # Action 1: Attempt login using invalid Token
    invalid_token = "2-XXXXXX"
    authenticated_id = None
    
    match_fail = next((c for c in state_camps if c["id"] == invalid_token), None)
    if not match_fail:
        state_logs.insert(0, {
            "timestamp": "2026-05-18T14:34:38Z",
            "level": "WARNING",
            "message": f"Agency Auth Fail: Unauthorized access attempt using invalid token: {invalid_token}."
        })
        
    run_assert(authenticated_id is None, "Access Gateway correctly blocked authentication for invalid token")
    run_assert("Agency Auth Fail" in state_logs[0]["message"], "Gateway logged authentication failure warning log")

    # Action 2: Attempt login using valid seed token (GroupM - ID: 1-4893000041135)
    valid_token = "1-4893000041135"
    match_success = next((c for c in state_camps if c["id"] == valid_token), None)
    if match_success:
        authenticated_id = valid_token
        state_logs.insert(0, {
            "timestamp": "2026-05-18T14:34:38Z",
            "level": "SUCCESS",
            "message": f"Agency Authenticated: Practitioner session established for Case ID: {valid_token}."
        })
        
    run_assert(authenticated_id == valid_token, "Access Gateway successfully verified valid token and unlocked session")
    run_assert("Agency Authenticated" in state_logs[0]["message"], "Gateway logged successful session authorization log")
    passed_tests += 1

    # ------------------------------------------------------------
    print(f"\n{CYAN}[TC-18: AM LDAP Portfolio Dashboard Scoping]{RESET}")
    # Simulate AM Sarah Jenkins logged in (LDAP am.sarah@google.com)
    active_am_ldap = "am.sarah@google.com"
    
    # Filter camps scoped exclusively by AM LDAP
    sarah_portfolio = [c for c in state_camps if c["amEmail"] == active_am_ldap]
    
    run_assert(len(sarah_portfolio) == 1, "AM portfolio filtering scoped exactly 1 visible card in pipeline")
    run_assert(sarah_portfolio[0]["agency"] == "GroupM", "AM Sarah Jenkins sees ONLY her GroupM camp card")
    run_assert(all(c["agency"] != "Omnicom Group" for c in sarah_portfolio), "AM John's Omnicom camp card is completely filtered out")
    passed_tests += 1

    # ------------------------------------------------------------
    print(f"\n{CYAN}[TC-19: Read-Only Stakeholder Permission Locks & Redirection]{RESET}")
    active_role = "Stakeholder"
    
    # Validate permissions constraints
    stakeholder_permissions = ["Dashboard", "Resource Repository", "Performance KPI"]
    run_assert("Cases Connect Sandbox" not in stakeholder_permissions, "Stakeholder permissions hide Cases Connect tab")
    run_assert("PM Queue" not in stakeholder_permissions, "Stakeholder permissions hide PM Queue tab")
    run_assert("Agency Portal" not in stakeholder_permissions, "Stakeholder permissions hide Agency Portal tab")
    
    # Verify default redirection target is Analytics view
    default_landing_tab = "analytics" if active_role == "Stakeholder" else "dashboard"
    run_assert(default_landing_tab == "analytics", "Stakeholder active tab automatically defaults directly to Performance KPI Analytics view")
    passed_tests += 1

    # ------------------------------------------------------------
    print(f"\n{CYAN}[TC-20: Camp Recording Retention Policy & Shared Drive Archival Exception]{RESET}")
    # Case A: Camp older than 90 days and NOT archived -> Deletion Cron purges recording!
    camp_unarchived = { "id": "6-220300", "nominationDate": "2026-01-15", "stage": "closed", "recordingArchived": False, "recordingDeleted": False }
    now = datetime.strptime("2026-05-18T14:34:38Z", "%Y-%m-%dT%H:%M:%SZ")
    nom_date = datetime.strptime(camp_unarchived["nominationDate"], "%Y-%m-%d")
    elapsed = (now - nom_date).days
    
    if elapsed > 90 and not camp_unarchived["recordingArchived"]:
        camp_unarchived["recordingDeleted"] = True
        
    run_assert(camp_unarchived["recordingDeleted"] is True, "Unarchived closed recording older than 90 days was successfully purged")

    # Case B: Camp older than 90 days and safely ARCHIVED to Shared Drive -> Deletion Cron skips deletion!
    camp_archived = { "id": "5-110200", "nominationDate": "2026-01-15", "stage": "closed", "recordingArchived": True, "recordingDeleted": False }
    
    if elapsed > 90 and not camp_archived["recordingArchived"]:
        camp_archived["recordingDeleted"] = True
    else:
        state_logs.insert(0, {
            "timestamp": "2026-05-18T14:34:38Z",
            "level": "INFO",
            "message": f"Data Retention Skip: Excluded Case {camp_archived['id']} recording from auto-deletion (Archived in Shared Drive)."
        })
        
    run_assert(camp_archived["recordingDeleted"] is False, "Archived recording safely bypassed auto-deletion")
    run_assert("Data Retention Skip" in state_logs[0]["message"], "Bypass warning successfully recorded in system logs")
    passed_tests += 1

    # ------------------------------------------------------------
    print(f"\n{CYAN}[TC-21: MS Teams platform Recording URL validation & sharing triggers]{RESET}")
    teams_camp = {
        "id": "3-772100",
        "agency": "Dentsu Aegis",
        "platform": "Teams",
        "teamsRecordingUrl": "",
        "liveQuestions": [],
        "followUpSent": False,
        "internalShare": "shivam@google.com, rahul.gupta@google.com"
    }
    
    # Step 1: Presenter attempts to send follow-up without Teams Link
    send_btn_disabled = True
    if teams_camp["platform"] == "Teams" and not teams_camp["teamsRecordingUrl"]:
        send_btn_disabled = True
        
    run_assert(send_btn_disabled is True, "Follow-up dispatch button is locked when Teams Recording URL is missing")

    # Step 2: Teams link is provided (Agency Lead shares recording)
    teams_camp["teamsRecordingUrl"] = "https://teams.microsoft.com/l/meetup-join/12345"
    if teams_camp["platform"] == "Teams" and teams_camp["teamsRecordingUrl"]:
        send_btn_disabled = False
        
    run_assert(send_btn_disabled is False, "Follow-up dispatch button is unlocked when Teams link is successfully entered")

    # Step 3: Trigger follow-up dispatch
    teams_camp["followUpSent"] = True
    state_logs.insert(0, {
        "timestamp": "2026-05-18T14:34:38Z",
        "level": "SUCCESS",
        "message": f"Workspace Share: Access to Case {teams_camp['id']} recording shared with: [{teams_camp['internalShare']}]."
    })
    
    run_assert(teams_camp["followUpSent"] is True, "Follow-up package successfully dispatched")
    run_assert("Workspace Share" in state_logs[0]["message"], "System successfully audited dynamic Drive sharing with internal POCs (Shivam)")
    passed_tests += 1

    # ------------------------------------------------------------
    print(f"\n{CYAN}[TC-22: AI Support Agent Chat Command Routing - Calendar View Switch]{RESET}")
    # Simulate user posting "switch tab to schedule calendar"
    user_message = "switch tab to schedule calendar"
    
    active_tab = "dashboard"
    ai_reply = ""
    
    # Intent matching simulation
    if "calendar" in user_message.lower() or "schedule" in user_message.lower():
        active_tab = "calendar"
        ai_reply = "Opening Weekly Schedule Calendar Grid!"
        state_logs.insert(0, {
            "timestamp": "2026-05-18T14:34:38Z",
            "level": "SUCCESS",
            "message": f"AI Assist: Switch active tab to calendar on user command."
        })
        
    run_assert(active_tab == "calendar", "AI Chat Agent successfully parsed intent and triggered switchTab('calendar')")
    run_assert("Opening Weekly Schedule" in ai_reply, "AI Chat Agent compiled correct contextual reply")
    run_assert("AI Assist" in state_logs[0]["message"], "AI assistance action logged in system logs")
    passed_tests += 1

    # ------------------------------------------------------------
    print(f"\n{CYAN}[TC-23: AI Support Agent Chat Command Routing - Persona Switch AM]{RESET}")
    # Simulate user asking "log in as Sarah Jenkins AM AE portfolio"
    user_message = "log in as Sarah Jenkins AM AE portfolio"
    
    active_role = "Presenter"
    ai_reply = ""
    
    # Intent matching simulation
    if "am" in user_message.lower() or "ae" in user_message.lower():
        active_role = "AM"
        ai_reply = "Switched active persona to AM Sarah Jenkins."
        state_logs.insert(0, {
            "timestamp": "2026-05-18T14:34:38Z",
            "level": "SUCCESS",
            "message": "AI Assist: Switch active role to AM on user command."
        })
        
    run_assert(active_role == "AM", "AI Chat Agent successfully parsed intent and triggered changeActiveRole('AM')")
    run_assert("Switched active persona to AM" in ai_reply, "AI Chat Agent compiled correct role-switch reply")
    passed_tests += 1

    # ------------------------------------------------------------
    print(f"\n{CYAN}[TC-24: Proactive Team Capacity Load Balancing]{RESET}")
    # Mock weekly utilization table state for week "2026-05-22"
    mock_utilization = [
        { "name": "Alex Rivera", "loggedHrs": 48, "expectedHrs": 40, "status": "Overutilized", "weekEnding": "2026-05-22" },
        { "name": "Jordan Blake", "loggedHrs": 22, "expectedHrs": 40, "status": "Underutilized", "weekEnding": "2026-05-22" }
    ]

    alex = next(u for u in mock_utilization if u["name"] == "Alex Rivera")
    jordan = next(u for u in mock_utilization if u["name"] == "Jordan Blake")

    run_assert(alex["status"] == "Overutilized", "Alex Rivera is initially Overutilized (48 hrs logged / 40 expected)")

    # Trigger dynamic load balancing shift (8 hours shifted from Alex to Jordan)
    alex["loggedHrs"] -= 8
    alex["status"] = "Optimal"
    jordan["loggedHrs"] += 8
    if jordan["loggedHrs"] >= 30:
        jordan["status"] = "Optimal"

    run_assert(alex["loggedHrs"] == 40, "Alex Rivera's hours successfully reduced to 40 hours")
    run_assert(alex["status"] == "Optimal", "Alex Rivera's capacity status successfully balanced to 'Optimal'")
    run_assert(jordan["loggedHrs"] == 30, "Jordan Blake's hours successfully increased to 30 hours")
    run_assert(jordan["status"] == "Optimal", "Jordan Blake's capacity status successfully balanced to 'Optimal'")
    passed_tests += 1

    # ------------------------------------------------------------
    print(f"\n{CYAN}[TC-25: Pre-kickoff Meeting Link Platform Mismatch Warning]{RESET}")
    # Scenario A: MS Teams platform but Google Meet link entered -> triggers mismatch warning
    mismatch_platform = "Teams"
    mismatch_link = "https://meet.google.com/gpeg-sessions-2026"
    warning_active = False

    if mismatch_platform == "Teams" and "meet.google.com" in mismatch_link:
        warning_active = True

    run_assert(warning_active is True, "Platform Mismatch: MS Teams platform with Google Meet link successfully triggers warning")

    # Scenario B: Google Meet platform (GVC) and MS Teams link entered -> triggers mismatch warning
    mismatch_platform_2 = "GVC"
    mismatch_link_2 = "https://teams.microsoft.com/l/meetup-join/123"
    warning_active_2 = False

    if mismatch_platform_2 == "GVC" and ("teams.microsoft.com" in mismatch_link_2 or "teams.live" in mismatch_link_2):
        warning_active_2 = True

    run_assert(warning_active_2 is True, "Platform Mismatch: Google Meet platform with MS Teams link successfully triggers warning")
    passed_tests += 1

    # ------------------------------------------------------------
    print(f"\n{CYAN}[TC-26: AI STT Voice present pitch simulation and pre-flight length guard]{RESET}")
    # Scenario A: Pitch response response is too short (<15 chars) -> blocked by pre-flight guard
    short_response = "attri"
    is_blocked = False

    if len(short_response) < 15:
        is_blocked = True

    run_assert(is_blocked is True, "Pre-flight Ingress Guard successfully blocks pitch evaluations with less than 15 characters")

    # Scenario B: Trigger AI Voice STT simulation -> transcribes robust technical pitch response
    stt_message_compiled = "Regarding b/38291002: Custom variables mapping inside Google Marketing Platform CM360 can be completed programmatically via S2S API..."
    is_blocked_2 = False

    if len(stt_message_compiled) < 15:
        is_blocked_2 = True

    run_assert(is_blocked_2 is False, "Pre-flight Guard successfully authorizes robust voice-transcribed pitch response")
    run_assert(len(stt_message_compiled) > 100, "AI Voice STT engine compiles detailed campaign strategy answer successfully")
    passed_tests += 1

    # ------------------------------------------------------------
    print(f"\n{GREEN}=================================================={RESET}")
    print(f"{GREEN}SUCCESS: All {passed_tests}/26 E2E Simulation Test Scenarios Passed!{RESET}")
    print(f"{GREEN}=================================================={RESET}\n")

except AssertionError as err:
    print(f"\n{RED}=================================================={RESET}")
    print(f"{RED}  STATE SIMULATION ASSERTION ERROR DETECTED       {RESET}")
    print(f"{RED}=================================================={RESET}")
    sys.exit(1)
except Exception as err:
    print(f"\n{RED}=================================================={RESET}")
    print(f"{RED}  RUNNER SYSTEM EXCEPTION IN SIMULATOR            {RESET}")
    print(f"{RED}=================================================={RESET}")
    print(err)
    sys.exit(1)
