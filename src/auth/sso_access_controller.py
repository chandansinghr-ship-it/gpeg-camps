#!/usr/bin/env python3
"""
GPEG Camps Single Sign-On (SSO) Role-Based Access Control (RBAC) Module.
Extracts authenticated headers and enforces row-level SQL filters in Spanner.
"""

from google.cloud import spanner

class SSOAccessController:
    def __init__(self, request_headers):
        # Extract authenticated user LDAP from Google Identity headers
        self.user_email = request_headers.get('X-Goog-Authenticated-User-Email', '').lower()
        self.user_ldap = self.user_email.split('@')[0] if '@' in self.user_email else ''
        self.roles = self._resolve_user_roles()

    def _resolve_user_roles(self):
        """
        Determines user group roles using corporate ACL checks or mock equivalent.
        """
        # In production, query Ganpati or Sphinx directory memberships:
        # %gpeg-coordinators-admin.prod -> 'Admin'
        # %gpeg-presenters.prod -> 'Presenter'
        
        admin_ldaps = ["chandansinghr", "shjha", "siddharthdubey", "mstg"]
        presenter_ldaps = ["nikkip", "vasanthie", "kalyanik", "phassanwalia", "sauravi", "gvenkat", "ryaqub", "pagadalap", "mounikac"]
        
        if self.user_ldap in admin_ldaps:
            return ["Admin"]
        elif self.user_ldap in presenter_ldaps:
            return ["Presenter"]
        return ["Read-Only"]

    def is_admin(self):
        return "Admin" in self.roles

    def build_secure_case_query(self):
        """
        Constructs a parameterized SQL statement with Row-Level filtering.
        """
        base_query = (
            "SELECT case_id, status, region, country, agency_name, client_division, "
            "       camp_type, planned_date, proposed_time, gpeg_poc_1, meeting_link "
            "FROM gpeg_camp_cases "
        )
        
        # If the authenticated user is an administrator, retrieve all rows
        if self.is_admin():
            return base_query + "ORDER BY planned_date ASC", {}
            
        # If the user is a GPEG Presenter, restrict rows strictly to their assigned LDAP
        elif "Presenter" in self.roles:
            secure_query = base_query + "WHERE LOWER(gpeg_poc_1) = @poc_email ORDER BY planned_date ASC"
            params = {"poc_email": self.user_email}
            return secure_query, params
            
        # Default fallback: restrict read-only users to general public records or none
        else:
            secure_query = base_query + "WHERE status = 'Conducted' ORDER BY planned_date ASC"
            return secure_query, {}

    def fetch_authorized_cases(self, spanner_instance, spanner_db):
        """
        Executes the row-level security query against the active Spanner database.
        """
        spanner_client = spanner.Client()
        instance = spanner_client.instance(spanner_instance)
        database = instance.database(spanner_db)
        
        sql_query, params = self.build_secure_case_query()
        param_types = {"poc_email": spanner.param_types.STRING} if params else {}

        with database.snapshot() as session:
            results = session.execute_sql(
                sql_query,
                params=params,
                param_types=param_types
            )
            
            cases = []
            for row in results:
                cases.append({
                    "case_id": row[0],
                    "status": row[1],
                    "region": row[2],
                    "country": row[3],
                    "agency_name": row[4],
                    "client_division": row[5],
                    "camp_type": row[6],
                    "planned_date": row[7],
                    "proposed_time": row[8],
                    "gpeg_poc_1": row[9],
                    "meeting_link": row[10]
                })
            return cases
