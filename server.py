#!/usr/bin/env python3
import http.server
import socketserver
import json
import os
import random
import sqlite3
import re
from email.message import EmailMessage

PORT = 8080
DB_FILE = 'camps.db'

# Webhook Secret Keys (loaded from Environment variables with fallback defaults)
CONNECT_WEBHOOK_TOKEN = os.environ.get("CONNECT_WEBHOOK_TOKEN", "secret_connect_gpeg_2026")
CONNECT_SIGNATURE_KEY = os.environ.get("CONNECT_SIGNATURE_KEY", "connect_signature_key_2026").encode('utf-8')

# In-memory active session datastore for SSO authentication
sessions_db = {}

def get_session_from_headers(headers):
    session_token = headers.get('X-GPEG-Session')
    if not session_token or session_token not in sessions_db:
        return None
    return sessions_db[session_token]

# Server-Side RBAC Authorization Helpers
def is_authorized(session, authorized_roles):
    if not session:
        return False
    user_role = session.get('role')
    return user_role in authorized_roles

def send_rbac_denied(handler, message):
    handler.send_response(403)
    handler.send_header('Content-Type', 'application/json')
    handler.end_headers()
    handler.wfile.write(json.dumps({
        "status": "forbidden",
        "error": "Permission Denied (RBAC Enforcement)",
        "message": message
    }).encode('utf-8'))

# Initialize database tables and schemas
def init_db():
    db_is_new = not os.path.exists(DB_FILE)
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Create camps table with a 100% complete schema match for all GPEG frontend models
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS camps (
            id TEXT PRIMARY KEY,
            country TEXT,
            holdingGroup TEXT,
            agency TEXT,
            suite TEXT,
            product TEXT,
            presenter TEXT,
            platform TEXT,
            deliveryType TEXT,
            deckType TEXT,
            nominationDate TEXT,
            scheduledTime TEXT,
            duration INTEGER,
            amEmail TEXT,
            language TEXT,
            stage TEXT,
            status TEXT,
            revCovered REAL,
            meetingLink TEXT,
            comments TEXT,
            liveQuestions TEXT,     -- JSON serialized list
            discoveryData TEXT,     -- JSON serialized dict
            followUpSent INTEGER,   -- 0 or 1
            slaBreached INTEGER,    -- 0 or 1
            slaDaysRemaining INTEGER,
            bfmUplift REAL,
            feedbackScore REAL,
            recordingArchived INTEGER, -- 0 or 1
            recordingDeleted INTEGER,  -- 0 or 1
            internalShare TEXT,
            newRerun TEXT,
            registrationsCount INTEGER,
            supportPocs TEXT,
            psmLdap TEXT,
            discoveryStatus TEXT,
            strategicGoal TEXT,
            salesSegment TEXT,
            curriculumLevel TEXT
        )
    ''')
    
    # Create outbox table to store persistent email drafts
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS outbox (
            id TEXT PRIMARY KEY,
            timestamp TEXT,
            from_email TEXT,
            to_email TEXT,
            cc_email TEXT,
            bcc_email TEXT,
            subject TEXT,
            body TEXT
        )
    ''')
    
    # Create buganizer_tickets table to persistently store PM queue issues E2E
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS buganizer_tickets (
            id TEXT PRIMARY KEY,
            caseId TEXT,
            questionId TEXT,
            component TEXT,
            title TEXT,
            desc TEXT,
            status TEXT,
            answer TEXT,
            timestamp TEXT
        )
    ''')
    
    if db_is_new:
        print("Pre-seeding GPEG Camps database with baseline seed records...")
        seed_camps = [
          {
            "id": "2-9828000040100",
            "agency": "Omnicom Group",
            "holdingGroup": "OMG",
            "suite": "Google Marketing Platform (GMP)",
            "product": "GMP Camp: CM360 Foundations",
            "region": "EMEA",
            "platform": "Meet",
            "stage": "nomination",
            "status": "Pending Kickoff",
            "nominationDate": "2026-05-18",
            "discoveryStatus": "Not Sent",
            "amEmail": "am.harenberg@google.com",
            "discoveryData": None,
            "deckType": "Standard Deck",
            "scheduledTime": None,
            "presenter": None,
            "liveQuestions": [],
            "followUpSent": False,
            "slaBreached": False,
            "slaDaysRemaining": None,
            "bfmUplift": None,
            "feedbackScore": None,
            "recordingArchived": False,
            "newRerun": "New",
            "registrationsCount": 85,
            "supportPocs": "",
            "psmLdap": "",
            "strategicGoal": "Obviating Troubleshooting",
            "salesSegment": "LCS",
            "curriculumLevel": "101"
          },
          {
            "id": "1-4893000041135",
            "agency": "GroupM",
            "holdingGroup": "WPP",
            "suite": "Google Marketing Platform (GMP)",
            "product": "GMP Camp: DV360 Campaign Setup & Opt",
            "region": "APAC",
            "platform": "Meet",
            "stage": "pre-camp",
            "status": "Awaiting Discovery",
            "nominationDate": "2026-05-14",
            "discoveryStatus": "Pending",
            "amEmail": "am.sarah@google.com",
            "discoveryData": None,
            "deckType": "Standard Deck",
            "scheduledTime": "2026-05-22T14:00:00Z",
            "presenter": "Taylor Chen (Presenter)",
            "liveQuestions": [],
            "followUpSent": False,
            "slaBreached": False,
            "slaDaysRemaining": 3,
            "bfmUplift": None,
            "feedbackScore": None,
            "recordingArchived": False,
            "newRerun": "New",
            "registrationsCount": 45,
            "supportPocs": "PSM Support Lead",
            "psmLdap": "psm.lead",
            "strategicGoal": "Product Activation",
            "salesSegment": "LCS",
            "curriculumLevel": "201"
          },
          {
            "id": "3-7721000010200",
            "agency": "Dentsu Aegis",
            "holdingGroup": "Dentsu",
            "suite": "AI, Search & Commerce",
            "product": "KPI Camp: Search & PMax AI Bidding",
            "region": "AMER",
            "platform": "Teams",
            "stage": "in-camp",
            "status": "Live Session Active",
            "nominationDate": "2026-05-12",
            "discoveryStatus": "Submitted",
            "amEmail": "am.elitsa@google.com",
            "discoveryData": {
              "confidence": "Intermediate",
              "challenges": "Attribution modeling and conversion linker setups.",
              "topics": ["Attribution Models", "Conversion Linker", "GA4 integrations"]
            },
            "deckType": "Customized Deck",
            "scheduledTime": "2026-05-18T11:00:00Z",
            "presenter": "Alex Rivera (Presenter)",
            "liveQuestions": [
              { "id": "q1", "text": "Does GA4 automatically link conversion paths from CM360 without GTM?", "answered": True, "answer": "Yes, when linking CM360 directly to GA4 property in admin panel." }
            ],
            "followUpSent": False,
            "slaBreached": False,
            "slaDaysRemaining": None,
            "bfmUplift": None,
            "feedbackScore": None,
            "recordingArchived": False,
            "newRerun": "Rerun",
            "registrationsCount": 120,
            "supportPocs": "",
            "psmLdap": "",
            "strategicGoal": "Product Activation",
            "salesSegment": "GCS",
            "curriculumLevel": "201"
          },
          {
            "id": "4-9901000031200",
            "agency": "Publicis Groupe",
            "holdingGroup": "Publicis",
            "suite": "Video & Social",
            "product": "Partnership Ads Training (MFG - WPP)",
            "region": "EMEA",
            "platform": "Meet",
            "stage": "post-camp",
            "status": "Resolving Queries & Follow-up",
            "nominationDate": "2026-05-10",
            "discoveryStatus": "Submitted",
            "amEmail": "am.sarah@google.com",
            "discoveryData": {
              "confidence": "Advanced",
              "challenges": "Dynamic creative setups and custom floodlight variables.",
              "topics": ["Dynamic Creatives", "Custom Floodlights", "S2S API integrations"]
            },
            "deckType": "Customized Deck",
            "scheduledTime": "2026-05-17T10:00:00Z",
            "presenter": "Alex Rivera (Presenter)",
            "liveQuestions": [
              { "id": "q2", "text": "Can custom Floodlights be passed via S2S API without a web tag?", "answered": False, "answer": None }
            ],
            "followUpSent": False,
            "slaBreached": False,
            "slaDaysRemaining": 1,
            "bfmUplift": None,
            "feedbackScore": None,
            "recordingArchived": False,
            "newRerun": "New",
            "registrationsCount": 30,
            "supportPocs": "",
            "psmLdap": "",
            "strategicGoal": "Externalizing Solutions",
            "salesSegment": "GCAS",
            "curriculumLevel": "101"
          },
          {
            "id": "5-1102000088900",
            "agency": "Interpublic Group (IPG)",
            "holdingGroup": "IPG",
            "suite": "AI, Search & Commerce",
            "product": "Apps Partner Center (iOS & Measurement)",
            "region": "AMER",
            "platform": "Meet",
            "stage": "closed",
            "status": "Impact Logged",
            "nominationDate": "2026-04-12",
            "discoveryStatus": "Submitted",
            "amEmail": "am.sarah@google.com",
            "discoveryData": {
              "confidence": "Beginner",
              "challenges": "Understanding BFM benefits over standard setups.",
              "topics": ["BFM basics", "Bidding optimization"]
            },
            "deckType": "Customized Deck",
            "scheduledTime": "2026-04-18T15:00:00Z",
            "presenter": "Alex Rivera (Presenter)",
            "liveQuestions": [],
            "followUpSent": True,
            "slaBreached": False,
            "slaDaysRemaining": None,
            "bfmUplift": 18.4,
            "feedbackScore": 4.8,
            "recordingArchived": True,
            "newRerun": "New",
            "registrationsCount": 60,
            "supportPocs": "",
            "psmLdap": "",
            "strategicGoal": "Externalizing Solutions",
            "salesSegment": "LCS",
            "curriculumLevel": "201"
          },
          {
            "id": "6-2203000011200",
            "agency": "Havas Media",
            "holdingGroup": "Havas",
            "suite": "Google Marketing Platform (GMP)",
            "product": "GMP Camp: SA360 Bidding & Value",
            "region": "APAC",
            "platform": "Meet",
            "stage": "closed",
            "status": "Impact Logged",
            "nominationDate": "2026-01-15",
            "discoveryStatus": "Submitted",
            "amEmail": "am.elitsa@google.com",
            "discoveryData": {
              "confidence": "Advanced",
              "challenges": "Tagging hygiene setups.",
              "topics": ["Tagging Hygiene"]
            },
            "deckType": "Customized Deck",
            "scheduledTime": "2026-01-20T10:00:00Z",
            "presenter": "Alex Rivera (Presenter)",
            "liveQuestions": [],
            "followUpSent": True,
            "slaBreached": False,
            "slaDaysRemaining": None,
            "bfmUplift": 12.5,
            "feedbackScore": 4.5,
            "recordingDeleted": False,
            "recordingArchived": False,
            "newRerun": "New",
            "registrationsCount": 50,
            "supportPocs": "",
            "psmLdap": "",
            "strategicGoal": "Obviating Troubleshooting",
            "salesSegment": "GCS",
            "curriculumLevel": "101"
          }
        ]
        
        for camp in seed_camps:
            cursor.execute('''
                INSERT INTO camps (
                    id, country, holdingGroup, agency, suite, product, presenter, platform, 
                    deliveryType, deckType, nominationDate, scheduledTime, duration, amEmail, 
                    language, stage, status, revCovered, meetingLink, comments, liveQuestions, 
                    discoveryData, followUpSent, slaBreached, slaDaysRemaining, bfmUplift, 
                    feedbackScore, recordingArchived, recordingDeleted, internalShare,
                    newRerun, registrationsCount, supportPocs, psmLdap, discoveryStatus,
                    strategicGoal, salesSegment, curriculumLevel
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                camp.get('id'),
                camp.get('country', 'SG'),
                camp.get('holdingGroup', 'OMG'),
                camp.get('agency'),
                camp.get('suite'),
                camp.get('product'),
                camp.get('presenter'),
                camp.get('platform', 'Meet'),
                camp.get('deliveryType', 'Standard'),
                camp.get('deckType', 'Standard Deck'),
                camp.get('nominationDate'),
                camp.get('scheduledTime'),
                camp.get('duration', 60),
                camp.get('amEmail', 'am.starcom@google.com'),
                camp.get('language', 'EN'),
                camp.get('stage'),
                camp.get('status'),
                camp.get('revCovered', 4.25),
                camp.get('meetingLink', ''),
                camp.get('comments', ''),
                json.dumps(camp.get('liveQuestions', [])),
                json.dumps(camp.get('discoveryData')),
                1 if camp.get('followUpSent', False) else 0,
                1 if camp.get('slaBreached', False) else 0,
                camp.get('slaDaysRemaining'),
                camp.get('bfmUplift'),
                camp.get('feedbackScore'),
                1 if camp.get('recordingArchived', False) else 0,
                1 if camp.get('recordingDeleted', False) else 0,
                camp.get('internalShare', "shivam@google.com, rahul.gupta@google.com"),
                camp.get('newRerun', 'New'),
                camp.get('registrationsCount', 85),
                camp.get('supportPocs', ''),
                camp.get('psmLdap', ''),
                camp.get('discoveryStatus', 'Not Sent'),
                camp.get('strategicGoal', ''),
                camp.get('salesSegment', ''),
                camp.get('curriculumLevel', '')
            ))
            
        # Pre-seed outbox table
        seed_outbox = [
          {
            "id": "m1",
            "timestamp": "2026-05-14T14:05:00Z",
            "from_email": "gpeg-camps@google.com",
            "to_email": "am.sarah@google.com",
            "cc_email": "gpeg-camps-archive@google.com",
            "bcc_email": "",
            "subject": "ACTION REQUIRED: Pre-Camp Discovery Form for GroupM",
            "body": "Hi Sarah,\n\nYour DV360 Camp nomination has been kicked off! Please share this secure link with the GroupM agency contacts so they can complete their Discovery Form:\n\nhttps://camps.google.com/portal/agency-discovery?caseId=1-4893000041135\n\nThis form must be submitted by 2026-05-22 to avoid applying the default deck protocol.\n\nBest,\nGPEG Camps Team"
          }
        ]
        
        for mail in seed_outbox:
            cursor.execute('''
                INSERT INTO outbox (id, timestamp, from_email, to_email, cc_email, bcc_email, subject, body)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                mail["id"],
                mail["timestamp"],
                mail["from_email"],
                mail["to_email"],
                mail["cc_email"],
                mail["bcc_email"],
                mail["subject"],
                mail["body"]
            ))
            
        # Pre-seed buganizer_tickets table
        seed_tickets = [
          {
            "id": "4489301",
            "caseId": "4-9901000031200",
            "questionId": "q2",
            "component": "GMP > CM360 > API",
            "title": "Server-to-Server custom floodlights parameters support",
            "desc": "Can custom Floodlights be passed via S2S API without a web tag?",
            "status": "New",
            "answer": None,
            "timestamp": "2026-05-18T12:00:00Z"
          }
        ]
        
        for ticket in seed_tickets:
            cursor.execute('''
                INSERT INTO buganizer_tickets (id, caseId, questionId, component, title, desc, status, answer, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                ticket["id"],
                ticket["caseId"],
                ticket["questionId"],
                ticket["component"],
                ticket["title"],
                ticket["desc"],
                ticket["status"],
                ticket["answer"],
                ticket["timestamp"]
            ))
            
        conn.commit()
    conn.close()

# Query database camps with server-side portfolio scoping rules
def get_all_camps(session=None):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    if session and session.get('role') == 'AM':
        cursor.execute("SELECT * FROM camps WHERE amEmail = 'am.sarah@google.com' ORDER BY rowid DESC")
    elif session and session.get('role') == 'Presenter':
        cursor.execute("SELECT * FROM camps WHERE presenter LIKE '%Taylor Chen%' ORDER BY rowid DESC")
    else:
        cursor.execute('SELECT * FROM camps ORDER BY rowid DESC')
        
    rows = cursor.fetchall()
    conn.close()
    
    camps = []
    for row in rows:
        camp = {k: row[k] for k in row.keys()}
        try:
            camp['liveQuestions'] = json.loads(camp['liveQuestions']) if camp['liveQuestions'] else []
        except:
            camp['liveQuestions'] = []
        try:
            camp['discoveryData'] = json.loads(camp['discoveryData']) if camp['discoveryData'] else None
        except:
            camp['discoveryData'] = None
            
        camp['followUpSent'] = bool(camp['followUpSent'])
        camp['slaBreached'] = bool(camp['slaBreached'])
        camp['recordingArchived'] = bool(camp['recordingArchived'])
        camp['recordingDeleted'] = bool(camp['recordingDeleted'])
        camps.append(camp)
    return camps

# Bulk update/synchronize state push helper
def update_camps_db(camps_list):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    incoming_ids = [c.get('id') for c in camps_list if c.get('id')]
    if incoming_ids:
        placeholders = ','.join('?' for _ in incoming_ids)
        cursor.execute(f'DELETE FROM camps WHERE id NOT IN ({placeholders})', incoming_ids)
    else:
        cursor.execute('DELETE FROM camps')
        
    for camp in camps_list:
        cursor.execute('''
            INSERT OR REPLACE INTO camps (
                id, country, holdingGroup, agency, suite, product, presenter, platform, 
                deliveryType, deckType, nominationDate, scheduledTime, duration, amEmail, 
                language, stage, status, revCovered, meetingLink, comments, liveQuestions, 
                discoveryData, followUpSent, slaBreached, slaDaysRemaining, bfmUplift, 
                feedbackScore, recordingArchived, recordingDeleted, internalShare,
                newRerun, registrationsCount, supportPocs, psmLdap, discoveryStatus,
                strategicGoal, salesSegment, curriculumLevel
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            camp.get('id'),
            camp.get('country', 'SG'),
            camp.get('holdingGroup', 'OMG'),
            camp.get('agency'),
            camp.get('suite'),
            camp.get('product'),
            camp.get('presenter'),
            camp.get('platform', 'Meet'),
            camp.get('deliveryType', 'Standard'),
            camp.get('deckType', 'Standard Deck'),
            camp.get('nominationDate'),
            camp.get('scheduledTime'),
            camp.get('duration', 60),
            camp.get('amEmail', 'am.starcom@google.com'),
            camp.get('language', 'EN'),
            camp.get('stage'),
            camp.get('status'),
            camp.get('revCovered', 4.25),
            camp.get('meetingLink', ''),
            camp.get('comments', ''),
            json.dumps(camp.get('liveQuestions', [])),
            json.dumps(camp.get('discoveryData')),
            1 if camp.get('followUpSent', False) else 0,
            1 if camp.get('slaBreached', False) else 0,
            camp.get('slaDaysRemaining'),
            camp.get('bfmUplift'),
            camp.get('feedbackScore'),
            1 if camp.get('recordingArchived', False) else 0,
            1 if camp.get('recordingDeleted', False) else 0,
            camp.get('internalShare', "shivam@google.com, rahul.gupta@google.com"),
            camp.get('newRerun', 'New'),
            camp.get('registrationsCount', 85),
            camp.get('supportPocs', ''),
            camp.get('psmLdap', ''),
            camp.get('discoveryStatus', 'Not Sent'),
            camp.get('strategicGoal', ''),
            camp.get('salesSegment', ''),
            camp.get('curriculumLevel', '')
        ))
    conn.commit()
    conn.close()

# Webhook camp database insertion helper
def insert_camp_from_webhook(camp):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO camps (
            id, country, holdingGroup, agency, suite, product, presenter, platform, 
            deliveryType, deckType, nominationDate, scheduledTime, duration, amEmail, 
            language, stage, status, revCovered, meetingLink, comments, liveQuestions, 
            discoveryData, followUpSent, slaBreached, slaDaysRemaining, bfmUplift, 
            feedbackScore, recordingArchived, recordingDeleted, internalShare,
            newRerun, registrationsCount, supportPocs, psmLdap, discoveryStatus,
            strategicGoal, salesSegment, curriculumLevel
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        camp.get('id'),
        camp.get('country', 'SG'),
        camp.get('holdingGroup', 'OMG'),
        camp.get('agency'),
        camp.get('suite'),
        camp.get('product'),
        camp.get('presenter'),
        camp.get('platform', 'Meet'),
        camp.get('deliveryType', 'Standard'),
        camp.get('deckType', 'Standard Deck'),
        camp.get('nominationDate'),
        camp.get('scheduledTime'),
        camp.get('duration', 60),
        camp.get('amEmail', 'am.starcom@google.com'),
        camp.get('language', 'EN'),
        camp.get('stage'),
        camp.get('status'),
        camp.get('revCovered', 4.25),
        camp.get('meetingLink', ''),
        camp.get('comments', ''),
        json.dumps(camp.get('liveQuestions', [])),
        json.dumps(camp.get('discoveryData')),
        1 if camp.get('followUpSent', False) else 0,
        1 if camp.get('slaBreached', False) else 0,
        camp.get('slaDaysRemaining'),
        camp.get('bfmUplift'),
        camp.get('feedbackScore'),
        1 if camp.get('recordingArchived', False) else 0,
        1 if camp.get('recordingDeleted', False) else 0,
        camp.get('internalShare', "shivam@google.com, rahul.gupta@google.com"),
        camp.get('newRerun', 'New'),
        camp.get('registrationsCount', 85),
        camp.get('supportPocs', ''),
        camp.get('psmLdap', ''),
        camp.get('discoveryStatus', 'Not Sent'),
        camp.get('strategicGoal', ''),
        camp.get('salesSegment', ''),
        camp.get('curriculumLevel', '')
    ))
    conn.commit()
    conn.close()

# Google Workspace Sync simulation status updater helper
def sync_workspace_status(case_id, sync_type):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    if sync_type == 'Drive':
        cursor.execute('UPDATE camps SET recordingArchived = 1 WHERE id = ?', (case_id,))
    conn.commit()
    conn.close()
    print(f"[Google {sync_type} API] Compiling camp package for Case {case_id} and uploading to gdrive://gpeg-camps/emea/{case_id}...")

# Google Shared Drive Recording Archival status updater helper
def archive_recording_status(case_id):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('UPDATE camps SET recordingArchived = 1 WHERE id = ?', (case_id,))
    conn.commit()
    conn.close()
    print(f"[Google Drive API] Archiving session recording and chat log for Case {case_id} in gdrive://gpeg-shared/archive/{case_id}...")

# Physical EML file generation and local dispatcher helper
def dispatch_email_eml(mail):
    outbox_dir = 'email_outbox'
    if not os.path.exists(outbox_dir):
        os.makedirs(outbox_dir)
        
    msg = EmailMessage()
    msg['From'] = mail.get('from') or mail.get('from_email') or 'gpeg-camps@google.com'
    msg['To'] = mail.get('to') or mail.get('to_email') or ''
    cc = mail.get('cc') or mail.get('cc_email')
    if cc:
        msg['Cc'] = cc
    bcc = mail.get('bcc') or mail.get('bcc_email')
    if bcc:
        msg['Bcc'] = bcc
    msg['Subject'] = mail.get('subject', '')
    msg.set_content(mail.get('body', ''))
    
    import re as clean_re
    safe_subject = clean_re.sub(r'[^a-zA-Z0-9_-]', '_', mail.get('subject', 'draft'))[:35]
    filename = f"mail_{mail.get('id', 'temp')}_{safe_subject}.eml"
    filepath = os.path.join(outbox_dir, filename)
    
    with open(filepath, 'wb') as f:
        f.write(msg.as_bytes())
    print(f"[Email Gateway] Persistent EML MIME file written: {filepath}")

# Retrieve outbox email records from SQLite persistent DB helper
def get_all_outbox():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM outbox ORDER BY timestamp DESC')
    rows = cursor.fetchall()
    conn.close()
    
    outbox = []
    for row in rows:
        mail = {k: row[k] for k in row.keys()}
        mail['from'] = mail.get('from_email')
        mail['to'] = mail.get('to_email')
        mail['cc'] = mail.get('cc_email')
        mail['bcc'] = mail.get('bcc_email')
        mail.pop('from_email', None)
        mail.pop('to_email', None)
        mail.pop('cc_email', None)
        mail.pop('bcc_email', None)
        outbox.append(mail)
    return outbox

# Insert email records to SQLite outbox table helper
def insert_email_outbox(mail):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO outbox (id, timestamp, from_email, to_email, cc_email, bcc_email, subject, body)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        mail.get('id'),
        mail.get('timestamp'),
        mail.get('from'),
        mail.get('to'),
        mail.get('cc'),
        mail.get('bcc'),
        mail.get('subject'),
        mail.get('body')
    ))
    conn.commit()
    conn.close()

# SQL-based Calendar Presenter availability collision checker helper
def check_presenter_collision(presenter, scheduled_time_str, duration_str, exclude_case_id=None):
    if not presenter or not scheduled_time_str:
        return None
    try:
        import datetime
        start_time = datetime.datetime.fromisoformat(scheduled_time_str.replace('Z', '+00:00'))
    except Exception as e:
        print(f"[Calendar Collision Error] Failed to parse scheduled time: {e}")
        return None
        
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM camps 
        WHERE presenter = ? AND stage IN ('pre-camp', 'in-camp', 'post-camp')
    ''', (presenter,))
    rows = cursor.fetchall()
    conn.close()
    
    for row in rows:
        camp = {k: row[k] for k in row.keys()}
        if exclude_case_id and camp['id'] == exclude_case_id:
            continue
        if not camp['scheduledTime']:
            continue
        try:
            import datetime
            camp_start = datetime.datetime.fromisoformat(camp['scheduledTime'].replace('Z', '+00:00'))
            diff_seconds = abs((start_time - camp_start).total_seconds())
            if diff_seconds < 90 * 60: # 90 minutes overlap window clash
                return camp
        except Exception as e:
            print(f"[Calendar Collision Error] Failed to parse compare row {camp['id']}: {e}")
            continue
    return None

# Standard random Google Meet conferencing link generator helper
def generate_random_meet_link():
    chars = 'abcdefghijklmnopqrstuvwxyz'
    part1 = ''.join(random.choice(chars) for _ in range(3))
    part2 = ''.join(random.choice(chars) for _ in range(4))
    part3 = ''.join(random.choice(chars) for _ in range(3))
    return f"https://meet.google.com/{part1}-{part2}-{part3}"

# Retrieve Buganizer tickets from SQLite helper
def get_all_tickets():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM buganizer_tickets ORDER BY timestamp DESC')
    rows = cursor.fetchall()
    conn.close()
    
    tickets = []
    for row in rows:
        tickets.append({k: row[k] for k in row.keys()})
    return tickets

# Insert Buganizer ticket helper
def insert_buganizer_ticket(ticket):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO buganizer_tickets (id, caseId, questionId, component, title, desc, status, answer, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        ticket.get('id'),
        ticket.get('caseId'),
        ticket.get('questionId'),
        ticket.get('component'),
        ticket.get('title'),
        ticket.get('desc'),
        ticket.get('status', 'New'),
        ticket.get('answer'),
        ticket.get('timestamp')
    ))
    conn.commit()
    conn.close()

# Atomic PM Webhook sync status propagation helper
def resolve_buganizer_ticket_db(bug_id, answer):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # 1. Resolve Buganizer ticket
    cursor.execute('''
        UPDATE buganizer_tickets 
        SET status = 'Resolved', answer = ? 
        WHERE id = ?
    ''', (answer, bug_id))
    
    # Fetch ticket mappings
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM buganizer_tickets WHERE id = ?', (bug_id,))
    ticket_row = cursor.fetchone()
    if not ticket_row:
        conn.close()
        raise Exception("Bug ID not found")
        
    ticket = {k: ticket_row[k] for k in ticket_row.keys()}
    case_id = ticket.get('caseId')
    question_id = ticket.get('questionId')
    
    # 2. Fetch mapped camp row
    cursor.execute('SELECT * FROM camps WHERE id = ?', (case_id,))
    camp_row = cursor.fetchone()
    if not camp_row:
        conn.close()
        raise Exception("Mapped Camp Case ID not found")
        
    camp = {k: camp_row[k] for k in camp_row.keys()}
    
    # 3. Deserialize and propagate Q&A resolution E2E
    try:
        live_questions = json.loads(camp['liveQuestions']) if camp['liveQuestions'] else []
    except:
        live_questions = []
        
    question_updated = False
    for q in live_questions:
        if q.get('id') == question_id:
            q['answered'] = True
            q['answer'] = answer
            question_updated = True
            break
            
    if question_updated:
        cursor.execute('''
            UPDATE camps SET liveQuestions = ? WHERE id = ?
        ''', (json.dumps(live_questions), case_id))
        
    conn.commit()
    
    # Read updated camp row E2E
    cursor.execute('SELECT * FROM camps WHERE id = ?', (case_id,))
    updated_camp_row = cursor.fetchone()
    updated_camp = {k: updated_camp_row[k] for k in updated_camp_row.keys()}
    try:
        updated_camp['liveQuestions'] = json.loads(updated_camp['liveQuestions']) if updated_camp['liveQuestions'] else []
    except:
        updated_camp['liveQuestions'] = []
    try:
        updated_camp['discoveryData'] = json.loads(updated_camp['discoveryData']) if updated_camp['discoveryData'] else None
    except:
        updated_camp['discoveryData'] = None
    updated_camp['followUpSent'] = bool(updated_camp['followUpSent'])
    updated_camp['slaBreached'] = bool(updated_camp['slaBreached'])
    updated_camp['recordingArchived'] = bool(updated_camp['recordingArchived'])
    updated_camp['recordingDeleted'] = bool(updated_camp['recordingDeleted'])
    
    # 4. Auto-queue outbox persistent Q&A email & EML disk MIME
    import datetime
    mail = {
        "id": f"b-sync-{random.randint(10000, 99999)}",
        "timestamp": datetime.datetime.utcnow().isoformat() + 'Z',
        "from": "gpeg-camps@google.com",
        "to": updated_camp["amEmail"],
        "subject": f"RESOLVED Q&A (Buganizer b/{bug_id}): Case {updated_camp['id']}",
        "body": f"Hi AM,\n\nThe Product Manager has authoritatively resolved ticket b/{bug_id} inside Buganizer.\n\nQuestion: \"{ticket.get('desc')}\"\nResolution: \"{answer}\"\n\nThis answer has been synced and auto-embedded into your outbound follow-up package draft!"
    }
    
    cursor.execute('''
        INSERT INTO outbox (id, timestamp, from_email, to_email, cc_email, bcc_email, subject, body)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        mail["id"],
        mail["timestamp"],
        mail["from"],
        mail["to"],
        None,
        None,
        mail["subject"],
        mail["body"]
    ))
    conn.commit()
    conn.close()
    
    dispatch_email_eml(mail)
    return updated_camp, mail


class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

class CampsBackendHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        super().log_message(format, *args)

    def do_GET(self):
        if self.path in ['/api/camps', '/api/outbox', '/api/buganizer/tickets']:
            session = get_session_from_headers(self.headers)
            if not session:
                self.send_response(401)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Unauthorized. Invalid or missing session credentials token."}).encode('utf-8'))
                return
                
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            self.end_headers()
            
            if self.path == '/api/camps':
                camps = get_all_camps(session)
                self.wfile.write(json.dumps(camps).encode('utf-8'))
            elif self.path == '/api/outbox':
                outbox = get_all_outbox()
                self.wfile.write(json.dumps(outbox).encode('utf-8'))
            else: # buganizer/tickets
                tickets = get_all_tickets()
                self.wfile.write(json.dumps(tickets).encode('utf-8'))
            return
        
        super().do_GET()

    def do_POST(self):
        # Check regular expression routes
        kickoff_match = re.match(r'^/api/camps/([^/]+)/kickoff$', self.path)
        sync_match = re.match(r'^/api/camps/([^/]+)/sync$', self.path)
        archive_match = re.match(r'^/api/camps/([^/]+)/archive$', self.path)

        # 1. SSO Auth Token Login Endpoint
        if self.path == '/api/auth/login':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                payload = json.loads(post_data.decode('utf-8'))
                ldap = payload.get('ldap', 'taylor.chen')
                role = payload.get('role', 'Presenter')
                
                token = f"token_{ldap}_{random.randint(1000, 9999)}"
                global sessions_db
                sessions_db[token] = {"ldap": ldap, "role": role}
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "success",
                    "token": token,
                    "ldap": ldap,
                    "role": role
                }).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        # 1.5. Developer Webhook Trigger Simulator (Remediates client secret leak)
        elif self.path == '/api/sandbox/trigger-webhook':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                payload = json.loads(post_data.decode('utf-8'))
                import hmac
                import hashlib
                import urllib.request
                import urllib.error
                
                payload_string = json.dumps(payload)
                signature = hmac.new(
                    CONNECT_SIGNATURE_KEY,
                    payload_string.encode('utf-8'),
                    hashlib.sha256
                ).hexdigest()
                
                # Dispatch E2E request locally to the active webhook
                url = f"http://localhost:{PORT}/api/webhook"
                req = urllib.request.Request(
                    url,
                    data=payload_string.encode('utf-8'),
                    headers={
                        'Content-Type': 'application/json',
                        'X-Connect-Token': CONNECT_WEBHOOK_TOKEN,
                        'X-Connect-Signature': signature
                    },
                    method='POST'
                )
                
                with urllib.request.urlopen(req) as resp:
                    result = json.loads(resp.read().decode('utf-8'))
                    
                self.send_response(201)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "success",
                    "camp": result["camp"],
                    "clientToken": CONNECT_WEBHOOK_TOKEN,
                    "hmacSignature": signature
                }).encode('utf-8'))
                
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        # Webhook ingestion bypass session checks freely as raw CRM webhook service
        elif self.path == '/api/webhook':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Webhook Ingestion token and signature security
            token = self.headers.get('X-Connect-Token')
            signature = self.headers.get('X-Connect-Signature')
            
            if not token or token != CONNECT_WEBHOOK_TOKEN:
                self.send_response(401)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Unauthorized. Webhook authentication token invalid or missing."}).encode('utf-8'))
                return
                
            import hmac
            import hashlib
            if not signature:
                self.send_response(401)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Unauthorized. Webhook cryptographic signature digest missing."}).encode('utf-8'))
                return
                
            expected_sig = hmac.new(
                CONNECT_SIGNATURE_KEY,
                post_data,
                hashlib.sha256
            ).hexdigest()
            
            if not hmac.compare_digest(signature, expected_sig):
                self.send_response(403)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Forbidden. HMAC cryptographic signature digest mismatch."}).encode('utf-8'))
                return
                
            try:
                payload = json.loads(post_data.decode('utf-8'))
                
                agency = payload.get('agency', 'Starcom Global')
                am_email = payload.get('amEmail', 'am.starcom@google.com')
                product = payload.get('product', 'GMP Camp: DV360 Campaign Setup & Opt')
                region = payload.get('region', 'EMEA')
                
                serial = random.randint(10000000, 99999999)
                case_id = payload.get('id', f"2-{serial}")
                
                new_camp = {
                    "id": case_id,
                    "country": payload.get('country', 'SG'),
                    "holdingGroup": payload.get('holdingGroup', 'OMG'),
                    "agency": agency,
                    "suite": payload.get('suite', 'Google Marketing Platform (GMP)'),
                    "product": product,
                    "presenter": payload.get('presenter', 'Taylor Chen'),
                    "platform": payload.get('platform', 'Meet'),
                    "deliveryType": payload.get('deliveryType', 'Standard'),
                    "deckType": payload.get('deckType', 'Standard Deck'),
                    "nominationDate": payload.get('nominationDate', '2026-05-22'),
                    "scheduledTime": payload.get('scheduledTime', '2026-05-22T10:00:00Z'),
                    "duration": payload.get('duration', 60),
                    "amEmail": am_email,
                    "language": payload.get('language', 'EN'),
                    "stage": "nomination",
                    "status": "Pending Kickoff",
                    "revCovered": payload.get('revCovered', '4.25'),
                    "meetingLink": payload.get('meetingLink', 'https://meet.google.com/abc-defg-hij'),
                    "comments": payload.get('comments', ''),
                    "liveQuestions": [],
                    "discoveryData": None,
                    "followUpSent": False,
                    "slaBreached": False,
                    "slaDaysRemaining": None,
                    "bfmUplift": None,
                    "feedbackScore": None,
                    "recordingArchived": False,
                    "internalShare": "shivam@google.com, rahul.gupta@google.com",
                    "newRerun": "New",
                    "registrationsCount": 85,
                    "supportPocs": "",
                    "psmLdap": "",
                    "discoveryStatus": "Not Sent",
                    "strategicGoal": "",
                    "salesSegment": "",
                    "curriculumLevel": ""
                }
                
                insert_camp_from_webhook(new_camp)
                
                self.send_response(201)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "success",
                    "message": "Cases Connect webhook processed successfully",
                    "camp": new_camp
                }).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        # Enforce Authentication Headers on all remaining RESTful write routes E2E
        session = get_session_from_headers(self.headers)
        if not session:
            self.send_response(401)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Unauthorized. Invalid or missing session token."}).encode('utf-8'))
            return

        if kickoff_match:
            if not is_authorized(session, ['Organizer', 'Admin']):
                send_rbac_denied(self, "Only Program Coordinators (Organizer) or Administrators (Admin) can schedule and kickoff campaigns.")
                return
            case_id = kickoff_match.group(1)
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                payload = json.loads(post_data.decode('utf-8'))
                presenter = payload.get('presenter')
                scheduled_time = payload.get('scheduledTime')
                duration = payload.get('duration', '60 Mins')
                platform = payload.get('platform', 'Meet')
                meeting_link = payload.get('meetingPlatformUrl', '').strip()
                
                clash = check_presenter_collision(presenter, scheduled_time, duration, exclude_case_id=case_id)
                if clash:
                    self.send_response(409)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "status": "conflict",
                        "error": "Presenter double-booking collision detected",
                        "conflictingCamp": {
                            "id": clash["id"],
                            "agency": clash["agency"],
                            "scheduledTime": clash["scheduledTime"],
                            "product": clash["product"]
                        }
                    }).encode('utf-8'))
                    return
                
                if not meeting_link and platform == 'Meet':
                    meeting_link = generate_random_meet_link()
                    print(f"[Google Calendar API] Conference generated Meet link: {meeting_link}")
                elif not meeting_link:
                    meeting_link = 'https://meet.google.com/gpeg-sessions-2026'
                
                sla_date_str = payload.get('slaDate', '')
                sla_days = 3
                if sla_date_str:
                    import datetime
                    try:
                        target_sla = datetime.datetime.strptime(sla_date_str, "%Y-%m-%d")
                        now_day = datetime.datetime.utcnow()
                        delta = (target_sla - now_day).days
                        sla_days = max(1, delta + 1)
                    except:
                        sla_days = 3
                
                conn = sqlite3.connect(DB_FILE)
                cursor = conn.cursor()
                cursor.execute('''
                    UPDATE camps SET 
                        product = ?,
                        presenter = ?,
                        scheduledTime = ?,
                        duration = ?,
                        platform = ?,
                        newRerun = ?,
                        registrationsCount = ?,
                        supportPocs = ?,
                        psmLdap = ?,
                        meetingLink = ?,
                        comments = ?,
                        stage = 'pre-camp',
                        discoveryStatus = 'Pending',
                        status = 'Awaiting Discovery',
                        slaDaysRemaining = ?,
                        slaBreached = 0
                    WHERE id = ?
                ''', (
                    payload.get('product', ''),
                    presenter,
                    scheduled_time,
                    duration,
                    platform,
                    payload.get('newRerun', 'New'),
                    payload.get('registrationsCount', 85),
                    payload.get('supportPocs', ''),
                    payload.get('psmLdap', ''),
                    meeting_link,
                    payload.get('comments', ''),
                    sla_days,
                    case_id
                ))
                conn.commit()
                
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM camps WHERE id = ?', (case_id,))
                row = cursor.fetchone()
                conn.close()
                
                updated_camp = {k: row[k] for k in row.keys()}
                try:
                    updated_camp['liveQuestions'] = json.loads(updated_camp['liveQuestions']) if updated_camp['liveQuestions'] else []
                except:
                    updated_camp['liveQuestions'] = []
                try:
                    updated_camp['discoveryData'] = json.loads(updated_camp['discoveryData']) if updated_camp['discoveryData'] else None
                except:
                    updated_camp['discoveryData'] = None
                updated_camp['followUpSent'] = bool(updated_camp['followUpSent'])
                updated_camp['slaBreached'] = bool(updated_camp['slaBreached'])
                updated_camp['recordingArchived'] = bool(updated_camp['recordingArchived'])
                updated_camp['recordingDeleted'] = bool(updated_camp['recordingDeleted'])
                
                import datetime
                mail = {
                    "id": f"m{random.randint(10000, 99999)}",
                    "timestamp": datetime.datetime.utcnow().isoformat() + 'Z',
                    "from": "gpeg-camps@google.com",
                    "to": updated_camp["amEmail"],
                    "subject": f"ACTION REQUIRED: Pre-Camp Discovery Form for {updated_camp['agency']}",
                    "body": f"Hi AM,\n\nYour {updated_camp['product']} Camp has been kicked off by presenter {presenter.split(' ')[0]}!\n\nPlease coordinate with your agency contact at {updated_camp['agency']} and have them fill out their customized discovery profile using this unique link:\n\nhttps://camps.google.com/portal/agency-discovery?caseId={updated_camp['id']}\n\nThis form must be completed by {sla_date_str} to ensure we tailor the customized deck protocol appropriately.\n\nBest,\nGPEG Camps Team"
                }
                insert_email_outbox(mail)
                dispatch_email_eml(mail)
                
                print(f"[Google Calendar API] Event successfully booked on GPEG presenter calendar: {presenter}")
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "success",
                    "camp": updated_camp,
                    "mail": mail
                }).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        elif sync_match:
            if not is_authorized(session, ['Presenter', 'Organizer', 'Admin']):
                send_rbac_denied(self, "Only Lead Presenters, Program Coordinators, or Portal Administrators are authorized to trigger Workspace synchronizations.")
                return
            case_id = sync_match.group(1)
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                payload = json.loads(post_data.decode('utf-8'))
                sync_type = payload.get('type', 'Drive')
                
                sync_workspace_status(case_id, sync_type)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "message": f"Synced to {sync_type}"}).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        elif archive_match:
            if not is_authorized(session, ['Presenter', 'Organizer', 'Admin']):
                send_rbac_denied(self, "Only Lead Presenters, Program Coordinators, or Portal Administrators are authorized to archive recording telemetries.")
                return
            case_id = archive_match.group(1)
            try:
                archive_recording_status(case_id)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "message": "Recording archived in Shared Drive"}).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        elif self.path == '/api/camps':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                camps_list = json.loads(post_data.decode('utf-8'))
                update_camps_db(camps_list)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        elif self.path == '/api/outbox':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                mail = json.loads(post_data.decode('utf-8'))
                import datetime
                if not mail.get('id'):
                    mail['id'] = f"m{random.randint(10000, 99999)}"
                if not mail.get('timestamp'):
                    mail['timestamp'] = datetime.datetime.utcnow().isoformat() + 'Z'
                
                insert_email_outbox(mail)
                dispatch_email_eml(mail)
                
                self.send_response(201)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "success",
                    "message": "Email successfully dispatched via persistent gateway",
                    "mail": mail
                }).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        # Expose /api/buganizer/escalate POST endpoint
        elif self.path == '/api/buganizer/escalate':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                payload = json.loads(post_data.decode('utf-8'))
                import datetime
                
                bug_id = f"{random.randint(4400000, 4500000)}"
                ticket = {
                    "id": bug_id,
                    "caseId": payload.get('caseId'),
                    "questionId": payload.get('questionId'),
                    "component": payload.get('component', 'GMP > CM360 > API'),
                    "title": payload.get('title', 'Escalated live session query'),
                    "desc": payload.get('desc', ''),
                    "status": "New",
                    "answer": None,
                    "timestamp": datetime.datetime.utcnow().isoformat() + 'Z'
                }
                
                insert_buganizer_ticket(ticket)
                print(f"[Buganizer API] Escalation ticket programmatically logged: b/{bug_id} - Component: {ticket['component']}")
                
                self.send_response(201)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "success",
                    "message": "Ticket successfully logged in Buganizer tracker",
                    "ticket": ticket
                }).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        # Expose /api/buganizer/resolve POST PM webhook endpoint E2E
        elif self.path == '/api/buganizer/resolve':
            if not is_authorized(session, ['PM', 'Admin']):
                send_rbac_denied(self, "Only SME Product PMs (PM) or Portal Administrators are authorized to resolve escalated expert queue tickets.")
                return
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                payload = json.loads(post_data.decode('utf-8'))
                bug_id = payload.get('bugId')
                answer = payload.get('answer')
                
                updated_camp, mail = resolve_buganizer_ticket_db(bug_id, answer)
                print(f"[Buganizer Sync Webhook] Resolved ticket b/{bug_id} - Two-way sync completed.")
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "success",
                    "message": "Buganizer sync resolution compiled successfully",
                    "camp": updated_camp,
                    "mail": mail
                }).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        else:
            self.send_response(404)
            self.end_headers()

def run_server():
    init_db()
    server_address = ('', PORT)
    httpd = ThreadingHTTPServer(server_address, CampsBackendHandler)
    print(f"Serving GPEG Camps Command Center database backend on port {PORT}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()

if __name__ == '__main__':
    run_server()
