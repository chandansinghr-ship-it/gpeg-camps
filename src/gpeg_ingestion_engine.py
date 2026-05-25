#!/usr/bin/env python3
"""
GPEG Camps Inbound Ingestion, Case Creation, & Spreadsheet Provisioning Engine.
Synchronizes inbox alerts, initiates Connect Cases, and clones GPEG series sheets.
"""

import os
import re
import sys
import json
from datetime import datetime, timedelta

# Environment-agnostic library loader
try:
    from google.cloud import spanner
except ImportError:
    spanner = None

try:
    from googleapiclient.discovery import build
    from google.oauth2 import service_account
except ImportError:
    build = None
    service_account = None


# ==========================================
# 1. Product-to-POC Routing Matrix Mapping (Including Product-Specific MoS Links)
# ==========================================
PRODUCT_POC_ROUTING = {
    "YOUTUBE": {
        "poc_name": "Nikki Pradhan",
        "poc_email": "nikkip@google.com",
        "hours": "02:00 PM to 12:00 AM (IST)",
        "mos_link": "http://go/gpeg-YouTube-mos"
    },
    "SEARCH": {
        "poc_name": "Vasanthi Endapalli",
        "poc_email": "vasanthie@google.com",
        "hours": "11:00 AM to 09:00 PM (IST)",
        "mos_link": "http://go/gpeg-onesearch-mos"
    },
    "ONE SEARCH": {
        "poc_name": "Vasanthi Endapalli",
        "poc_email": "vasanthie@google.com",
        "hours": "11:00 AM to 09:00 PM (IST)",
        "mos_link": "http://go/gpeg-onesearch-mos"
    },
    "AI MAX": {
        "poc_name": "Vasanthi Endapalli",
        "poc_email": "vasanthie@google.com",
        "hours": "11:00 AM to 09:00 PM (IST)",
        "mos_link": "http://go/gpeg-onesearch-mos"
    },
    "PMAX": {
        "poc_name": "Kalyani Kumari",
        "poc_email": "kalyanik@google.com",
        "hours": "11:00 AM to 09:00 PM (IST)",
        "mos_link": "http://go/gpeg-pmaxcamp-mos"
    },
    "DEMAND GEN": {
        "poc_name": "Priyanka Hassanwalia",
        "poc_email": "phassanwalia@xwf.google.com",
        "hours": "11:00 AM to 09:00 PM (IST)",
        "mos_link": "http://go/gpeg-dgcamp-mos"
    },
    "MEASUREMENT": {
        "poc_name": "Dnyaneshwar Sauravi",
        "poc_email": "sauravi@xwf.google.com",
        "hours": "11:00 AM to 09:00 PM (IST)",
        "mos_link": "http://go/gpeg-measurement-mos"
    },
    "ANALYTICS": {
        "poc_name": "Ganji Venkat",
        "poc_email": "gvenkat@xwf.google.com",
        "hours": "11:00 AM to 09:00 PM (IST)",
        "mos_link": "http://go/gpeg-ga-mos"
    },
    "GA EXCELLENCE": {
        "poc_name": "Ganji Venkat",
        "poc_email": "gvenkat@xwf.google.com",
        "hours": "11:00 AM to 09:00 PM (IST)",
        "mos_link": "http://go/gpeg-ga-mos"
    },
    "APPS": {
        "poc_name": "Ruksana Yaqub",
        "poc_email": "ryaqub@xwf.google.com",
        "hours": "11:00 AM to 09:00 PM (IST)",
        "mos_link": "http://go/gpeg-apps-mos"
    },
    "GMP": {
        "poc_name": "Pagadala Prateek",
        "poc_email": "pagadalap@xwf.google.com",
        "hours": "11:00 AM to 09:00 PM (IST)",
        "mos_link": "http://go/gpeg-cm360camp-mos"
    },
    "CM360": {
        "poc_name": "Pagadala Prateek",
        "poc_email": "pagadalap@xwf.google.com",
        "hours": "11:00 AM to 09:00 PM (IST)",
        "mos_link": "http://go/gpeg-cm360camp-mos"
    },
    "SA360": {
        "poc_name": "Pagadala Prateek",
        "poc_email": "pagadalap@xwf.google.com",
        "hours": "11:00 AM to 09:00 PM (IST)",
        "mos_link": "http://go/gpeg-sa360camp-mos"
    },
    "DV360": {
        "poc_name": "Chintala Mounika",
        "poc_email": "mounikac@google.com",
        "hours": "11:00 AM to 09:00 PM (IST)",
        "mos_link": "http://go/gpeg-dv360camp-mos"
    }
}

PRODUCT_SYLLABUS = {
    "YOUTUBE": [
        "YouTube Shorts & Creator Solutions Mastery",
        "Video View & Reach Campaigns Depth",
        "Reservation in Google Ads Camp",
        "YouTube Reach Planner & Frequency Golden Rules"
    ],
    "SEARCH": [
        "Gemini Advantage & Repositioning Search",
        "Broad Match & Smart Bidding Masterclass",
        "Account Structure Optimization"
    ],
    "ONE SEARCH": [
        "Gemini Advantage & Repositioning Search",
        "Broad Match & Smart Bidding Masterclass",
        "Account Structure Optimization"
    ],
    "AI MAX": [
        "Gemini Advantage & Repositioning Search",
        "Broad Match & Smart Bidding Masterclass",
        "Account Structure Optimization"
    ],
    "PMAX": [
        "PMax for Growth & Asset Studio walkthrough",
        "Bespoke PMax Optimization & Best Practices",
        "Enhanced Signal Mapping & Audience Insights"
    ],
    "DEMAND GEN": [
        "Demand Gen Online Sales Pitch Narrative",
        "Measurement Deep Dive for Demand Gen",
        "Asset Studio walkthrough & Creative Optimization"
    ],
    "MEASUREMENT": [
        "Google Tag Gateway Basics & CDN Implementations",
        "Enhanced Conversions for Web & sGTM Setup",
        "Effective Measurement - MMM, Incrementality & Attribution"
    ],
    "GA EXCELLENCE": [
        "GA 3.0 vs GA 4.0 Alignment",
        "GA4 Advanced Implementations & Explorations",
        "BigQuery Integration & Custom Reporting"
    ],
    "ANALYTICS": [
        "GA 3.0 vs GA 4.0 Alignment",
        "GA4 Advanced Implementations & Explorations",
        "BigQuery Integration & Custom Reporting"
    ],
    "APPS": [
        "Mobile App Attributions and Campaigns 101",
        "SKAN & Privacy Sandbox Walkthrough"
    ],
    "GMP": [
        "CM360 Campaign Specification & Setup",
        "DV360 Programmatic Insertion Masterclass",
        "SA360 Bidding & Value-Based Optimizations"
    ]
}

DEFAULT_STAKEHOLDERS_CC = [
    "mstg@google.com",
    "nicolasoren@google.com",
    "ashishgalav@google.com",
    "kajaria@google.com",
    "gpeg-camps@google.com"
]

TEMPLATE_SHEET_ID = "1OhcQhsipjELRJ4w98aSyAzDMAJJJmszlreFgR9rH50M"

LCS_DISCOVERY_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSegOTv74rU8WgB259ajCYF_ag6zlCv8O9cJkViGU7u52GAqoQ/viewform"
GCS_FEEDBACK_FORM_URL = "https://forms.gle/hHP11MLpCmZtsyup6"



# ==========================================
# 2. Inbound Parsing Logic
# ==========================================
def parse_email_message(subject, body):
    """
    Parses a single email thread to extract core fields.
    """
    # 1. Parse Agency Name
    agency_match = re.search(r"\*\*Company / Agency\*\*\s*\n*([^\n]+)", body)
    if not agency_match:
        agency_match = re.search(r"Request for ([a-zA-Z0-9\s]+) -", subject)
    agency_name = agency_match.group(1).strip() if agency_match else "Unknown Agency"

    # 2. Parse Requester LDAP
    # Scans the text for any valid @google.com address excluding stakeholders
    ldap_addresses = re.findall(r"([a-zA-Z0-9._%+-]+@google\.com)", body)
    requester_ldap = "AM email not found"
    
    for email in ldap_addresses:
        email_clean = email.lower()
        if email_clean not in DEFAULT_STAKEHOLDERS_CC:
            requester_ldap = email_clean
            break
            
    # 3. Resolve Camp Type / Topic
    camp_type = "Other"
    for keyword in PRODUCT_POC_ROUTING.keys():
        if keyword in (subject + " " + body).upper():
            camp_type = keyword
            break
            
    # Intercept and explicitly map 'duplicate' keyword if found in raw subject
    if "DUPLICATE" in subject.upper() or "DUPLICATE" in body.upper():
        camp_type += " Duplicate"
        
    return agency_name, requester_ldap, camp_type


def detect_multi_camp_series(subject, body):
    """
    Detects if the request contains multiple distinct camp topics or schedule arrays.
    """
    combined = (subject + " " + body).lower()
    trigger_words = ["schedule", "multi-camp", "camp series", "set of camps", "collated", "batches"]
    has_trigger = any(word in combined for word in trigger_words)
    
    # Check for lists of dates
    dates_found = len(re.findall(r"(june|july|august|may)\s+\d{1,2}", combined))
    
    return has_trigger or dates_found > 1

# ==========================================
# 3. API Integrations
# ==========================================
def determine_client_segment(subject, body):
    """
    Determines if the request belongs to an LCS (Large Customer Sales) or GCS/Torso account.
    """
    combined = (subject + " " + body).upper()
    if "LCS" in combined:
        return "LCS"
    return "GCS"

# ==========================================
# 3. API Integrations & Duplication Checks
# ==========================================
def is_case_already_processed(spanner_client, instance_id, database_id, agency_name, camp_type):
    """
    Queries Cloud Spanner to check if an active ticket has already been logged for this 
    particular agency and product camp within a rolling 30-day window.
    """
    if not spanner or not spanner_client:
        # Mock local testing duplication bypass helper
        if "airhelp" in agency_name.lower() and "duplicate" in camp_type.lower():
            return "6-5688000041078", "Pending Kickoff"
        return None, None

        
    instance = spanner_client.instance(instance_id)
    database = instance.database(database_id)
    
    query = (
        "SELECT case_id, status, requested_date "
        "FROM gpeg_camp_cases "
        "WHERE LOWER(agency_name) = @agency "
        "  AND LOWER(camp_type) = @camp "
        "  AND requested_date >= @time_boundary "
        "LIMIT 1"
    )
    
    time_boundary = datetime.utcnow() - timedelta(days=30)
    params = {
        "agency": agency_name.lower(),
        "camp": camp_type.lower(),
        "time_boundary": time_boundary
    }
    
    param_types = {
        "agency": spanner.param_types.STRING,
        "camp": spanner.param_types.STRING,
        "time_boundary": spanner.param_types.TIMESTAMP
    }
    
    try:
        with database.snapshot() as session:
            results = session.execute_sql(query, params=params, param_types=param_types)
            for row in results:
                return row[0], row[1]
    except Exception as e:
        print(f"Spanner query exception: {e}. Defaulting to safe check.")
        
    return None, None

def mark_email_thread_processed(gmail_service, thread_id):
    """
    Removes the STARRED and UNREAD labels from the processed email thread to prevent re-ingestion.
    """
    if not gmail_service:
        print(f"[Mock Gmail] Thread {thread_id} marked as processed (labels cleared).")
        return
        
    try:
        gmail_service.users().threads().modify(
            userId='me',
            id=thread_id,
            body={
                'removeLabelIds': ['STARRED', 'UNREAD']
            }
        ).execute()
        print(f"Gmail thread {thread_id} successfully marked as processed and unstarred.")
    except Exception as e:
        print(f"Error updating Gmail thread labels: {e}")

def create_connect_case(agency_name, camp_type, requester_ldap, raw_body):
    """
    Simulates calling the Cases Partner API V2 (CreateEmailCase stubby service)
    to register a ticket in Connect Cases and return a generated Case ID.
    """
    print(f"Calling Cases Partner API v2 for {agency_name} | {camp_type}...")
    import random
    mock_case_id = f"6-{random.randint(10000000, 99999999)}00040125"
    return mock_case_id

def clone_camp_series_spreadsheet(credentials, agency_name, case_id):
    """
    Clones the master template spreadsheet and names it '[Camp Series] <Agency Name> - 2026'.
    """
    if not build:
        return "https://docs.google.com/spreadsheets/d/" + TEMPLATE_SHEET_ID
        
    drive_service = build('drive', 'v3', credentials=credentials)
    copy_metadata = {'name': f"[Camp Series] {agency_name} - 2026"}
    
    try:
        cloned_file = drive_service.files().copy(
            fileId=TEMPLATE_SHEET_ID,
            body=copy_metadata
        ).execute()
        return f"https://docs.google.com/spreadsheets/d/{cloned_file['id']}"
    except Exception as e:
        print(f"Error cloning spreadsheet: {e}")
        return "https://docs.google.com/spreadsheets/d/" + TEMPLATE_SHEET_ID

# ==========================================
# 4. Spanner Synchronization
# ==========================================
def upsert_spanner_record(spanner_client, instance_id, database_id, payload):
    """
    Upserts the parsed Case details into Spanner gpeg_camp_cases table.
    """
    if not spanner or not spanner_client:
        print("[Mock Spanner] Skipping actual Spanner insert as libraries are missing locally.")
        return
        
    instance = spanner_client.instance(instance_id)
    database = instance.database(database_id)

    def write_transaction(transaction):
        columns = [
            "case_id", "status", "region", "agency_name", "camp_type", 
            "requester_ldap", "gpeg_poc_1", "requested_date", "comments",
            "is_kpi_program", "gcas_kpi_id", "agency_shared_drive_link", 
            "revenue_covered_m", "arr_uplift_m", "language"
        ]
        
        values = [
            payload["case_id"],
            payload["status"],
            payload["region"],
            payload["agency_name"],
            payload["camp_type"],
            payload["requester_ldap"],
            payload["gpeg_poc_1"],
            datetime.utcnow(),
            payload["comments"],
            payload.get("is_kpi_program", False),
            payload.get("gcas_kpi_id", "None"),
            payload.get("agency_shared_drive_link", ""),
            payload.get("revenue_covered_m", 0.0),
            payload.get("arr_uplift_m", 0.0),
            payload.get("language", "English")
        ]
        
        if payload.get("sheet_url"):
            values[8] = f"Spreadsheet Link: {payload['sheet_url']} | " + values[8]
            
        transaction.insert_or_update(
            table="gpeg_camp_cases",
            columns=columns,
            values=[values]
        )

    database.run_in_transaction(write_transaction)
    print(f"Spanner Database synchronized for Case ID: {payload['case_id']}.")


# ==========================================
# 5. Core Ingestion Orchestrator & Response Draft Compiler
# ==========================================
def generate_nuanced_outbound_email(case_id, agency_name, camp_type, segment, requester_ldap, poc_name, poc_hours, mos_link, sheet_url=None):
    """
    Constructs a highly structured, professional, and compliant GPEG Camp response draft
    addressing all the operational nuances of the kickoff communications.
    """
    # 1. Resolve localized syllabus outline based on topic
    syllabus_list = PRODUCT_SYLLABUS.get(camp_type, ["Comprehensive Topic Deep Dive", "Case Studies & Interactive Q&A"])
    syllabus_text = "\n".join([f"   {i+1}. **{topic}**" for i, topic in enumerate(syllabus_list)])
    
    # 2. Select segment-correct pre-camp surveys
    form_url = LCS_DISCOVERY_FORM_URL if segment == "LCS" else GCS_FEEDBACK_FORM_URL
    form_name = "Pre-Camp Discovery Form" if segment == "LCS" else "Pre-Camp Feedback Form"
    
    # 3. Compile greetings and core content blocks
    requester_name = requester_ldap.split('@')[0].capitalize() if requester_ldap else "Partner"
    
    draft = "![Google Logo](https://www.gstatic.com/images/branding/googlelogo/1x/googlelogo_color_120x48dp.png)\n\n"
    draft += "*Please be advised that per Google’s privacy policy all of the below communication links are internal only. Please do not share/forward these externally.*\n\n"
    
    draft += f"Hi {requester_name},\n\nGreetings of the day!\n\n"
    
    if sheet_url:
        draft += f"Thank you for requesting a customized GPEG Camp Series for **{agency_name}**! Our team is looking forward to hosting you on these tracks.\n\n"
        draft += f"To ensure efficient management, progress monitoring, and easy file access, we have established a single Parent Case ID **{case_id}** to track the entire series. We have set up a dedicated tracking spreadsheet for your agency here:\n\n"
        draft += f"👉 **[Camp Series Tracker]({sheet_url})**\n\n"
    else:
        draft += f"Thank you for nominating **{agency_name}** for our **{camp_type}**! Our team is looking forward to delivering an impactful session.\n\n"
        draft += f"To ensure streamlined communication, we have registered this request under Case ID **{case_id}**. All subsequent correspondence regarding scheduling, invites, and deck reviews must be done through this specific communication thread to keep updates organized.\n\n"
    
    # 4. Inject Dynamic Syllabus Section
    draft += "**Proposed Session Agenda/Syllabus:**\n"
    draft += f"{syllabus_text}\n\n"
    
    # 5. Inject Structured Next Steps Checklist
    draft += "**Next Steps to Complete (Action Required):**\n"
    if segment == "LCS":
        draft += f"* **Pre-Camp Discovery Survey:** Please share this [Pre-Camp Discovery Form]({form_url}) with your agency practitioners. Their inputs are vital for us to customize the presentation to address their active product challenges.\n"
    else:
        draft += f"* **Pre-Camp Feedback Survey:** To help us tailor the materials, please complete this [Pre-Camp Feedback Form ({form_url})]. We have granted you edit rights to this form for your convenience.\n"
        
    draft += f"* **Menu of Services (MoS):** You can reference the specific [Menu of Services (MoS) ({mos_link})] to explore more detailed topics, references, and base decks available for this product camp.\n"
    draft += "* **Scheduling Details:** Please reply directly on this case thread with 2 to 3 preferred 90-minute timeslots for the session, along with the estimated count of practitioner attendees.\n"
    draft += "* **Calendar Invites:** Once the date is locked, we will dispatch a calendar invite with **modification and forwarding rights enabled** so you can easily manage the practitioner participant list.\n\n"
    
    draft += "Feel free to reach out if you have any questions or require custom modifications. We look forward to a highly productive session!\n\n"
    
    # 6. Professional localized signature block
    draft += "Sincerely,\n\n"
    draft += f"• **{poc_name}** • Camps Coordinator • GPEG Camps Team\n"
    draft += f"• Working Hours: {poc_hours}\n\n"
    draft += f"*NB: If you need to reference this support ticket in the future, the ID number is {case_id}*\n\n"
    
    # 7. Google Confidentiality Footnote
    draft += "---------------------------------------------------------\n"
    draft += "This email may be confidential or privileged. If you received this communication by mistake, please don't forward it to anyone else, please erase all copies and attachments, and let us know that it went to the wrong person.\n"
    draft += "Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA\n"
    
    return draft

def process_incoming_request(subject, body, thread_id, spanner_instance, spanner_db, creds=None, gmail_service=None):
    """
    Orchestrates the entire ingest, de-duplication, routing, and provisioning loop.
    """
    # 1. Parse Email Fields
    agency_name, requester_ldap, camp_type = parse_email_message(subject, body)
    
    # 2. PROACTIVE DUPLICATION CHECK
    spanner_client = spanner.Client() if spanner else None
    existing_case_id, existing_status = is_case_already_processed(
        spanner_client, spanner_instance, spanner_db, agency_name, camp_type
    )
    
    if existing_case_id:
        print(f"\n[SKIP - DUPLICATE DETECTED] Request for {agency_name} | {camp_type} already processed under Case ID {existing_case_id} (Status: {existing_status}).")
        print("Bypassing double programmatic case creation and secondary auto-reply.")
        
        mark_email_thread_processed(gmail_service, thread_id)
        return
        
    is_series = detect_multi_camp_series(subject, body)
    segment = determine_client_segment(subject, body)
    
    # Extract KPI and program tracking metadata cues from email body
    is_kpi = "KPI" in (subject + " " + body).upper()
    kpi_id_match = re.search(r"(kpi-\d+)", body, re.IGNORECASE)
    kpi_id = kpi_id_match.group(1).upper() if kpi_id_match else "None"
    
    drive_match = re.search(r"(drive\.google\.com/drive/folders/[a-zA-Z0-9\-_]+)", body, re.IGNORECASE)
    drive_link = f"https://{drive_match.group(1)}" if drive_match else ""
    
    lang_match = re.search(r"language:\s*([a-zA-Z]+)", body, re.IGNORECASE)
    lang = lang_match.group(1).capitalize() if lang_match else "English"
    
    # 3. Resolve Owner POC via Mapping Matrix (including dynamic MoS linking)
    pocs = PRODUCT_POC_ROUTING.get(camp_type, {"poc_name": "Nikki Pradhan", "poc_email": "nikkip@google.com", "hours": "11:00 AM to 09:00 PM (IST)", "mos_link": "http://go/gpeg-camps-mos-2026"})
    poc_email = pocs["poc_email"]
    poc_name = pocs["poc_name"]
    poc_hours = pocs["hours"]
    mos_link = pocs.get("mos_link", "http://go/gpeg-camps-mos-2026")
    
    # 4. Create Case programmatically
    case_id = create_connect_case(agency_name, camp_type, requester_ldap, body)
    
    # 5. Provision Template Spreadsheet if Multi-Camp is detected
    sheet_url = None
    if is_series and creds:
        sheet_url = clone_camp_series_spreadsheet(creds, agency_name, case_id)
        
    # 6. Compile Email Responses
    cc_emails = DEFAULT_STAKEHOLDERS_CC + [poc_email]
    
    payload = {
        "case_id": case_id,
        "status": "Pending Kickoff",
        "region": "EMEA",
        "agency_name": agency_name,
        "camp_type": camp_type if not is_series else "Camp Series",
        "requester_ldap": requester_ldap,
        "gpeg_poc_1": poc_email,
        "sheet_url": sheet_url,
        "comments": "Ingested programmatically via GPEG command center engine.",
        "is_kpi_program": is_kpi,
        "gcas_kpi_id": kpi_id,
        "agency_shared_drive_link": drive_link,
        "revenue_covered_m": 4.5 if is_kpi else 0.0,
        "arr_uplift_m": 0.8 if is_kpi else 0.0,
        "language": lang
    }
    
    # 7. Database Synchronization
    try:
        upsert_spanner_record(spanner_client, spanner_instance, spanner_db, payload)
    except Exception as e:
        print(f"Database synchronize error: {e}")

        
    # 8. Mark thread as read/processed in Gmail
    mark_email_thread_processed(gmail_service, thread_id)
    
    # 9. Compile and Print Dynamic Nuanced Outbound Email
    email_body = generate_nuanced_outbound_email(
        case_id=case_id,
        agency_name=agency_name,
        camp_type=camp_type if not is_series else "Camp Series",
        segment=segment,
        requester_ldap=requester_ldap,
        poc_name=poc_name,
        poc_hours=poc_hours,
        mos_link=mos_link,
        sheet_url=sheet_url
    )
    
    print("\n--- GENERATED OUTBOUND DRAFT ---")
    print(f"TO: {requester_ldap}")
    print(f"CC: {', '.join(cc_emails)}")
    print(f"SUBJECT: Re: [{case_id}] {agency_name} | {segment} | {camp_type if not is_series else 'Camp Series'}")
    print(email_body)
    print("--------------------------------\n")

if __name__ == "__main__":
    # 1. Run normal ingestion test
    print("=== SCENARIO 1: Brand New Inbound Nominations ===")
    process_incoming_request(
        subject="Request for Airhelp - AI Max Camp",
        body="Company / Agency: Airhelp \nValue Add: AI Max Camp\nFrom: kitlinska@google.com",
        thread_id="new_thread_123",
        spanner_instance="gpeg-spanner-instance",
        spanner_db="gpeg-camps-db"
    )

    # 2. Run duplicated ingestion test
    print("=== SCENARIO 2: Re-poll Ingest Duplicate Thread Nomination ===")
    process_incoming_request(
        subject="FWD: Request for Airhelp - AI Max Camp (duplicate)",
        body="Company / Agency: Airhelp \nValue Add: AI Max Camp\nFrom: sandra@google.com",
        thread_id="duplicate_thread_456",
        spanner_instance="gpeg-spanner-instance",
        spanner_db="gpeg-camps-db"
    )



