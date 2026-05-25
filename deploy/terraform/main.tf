provider "google" {
  project = "google.com:gpeg-camps-automation"
  region  = "europe-west1"
}

# 1. Cloud Run Job to host the execution container
resource "google_cloud_run_v2_job" "ingestion_job" {
  name     = "gpeg-inbox-ingestion-job"
  location = "europe-west1"

  template {
    template {
      containers {
        image = "gcr.io/google.com/gpeg-camps-automation/ingestion-engine:latest"
        resources {
          limits = {
            cpu    = "1"
            memory = "512Mi"
          }
        }
        env {
          name  = "CLOUD_SPANNER_INSTANCE"
          value = "gpeg-spanner-instance"
        }
        env {
          name  = "CLOUD_SPANNER_DATABASE"
          value = "gpeg-camps-db"
        }
      }
    }
  }
}

# 2. Cloud Scheduler Cron Task to trigger execution every 15 minutes
resource "google_cloud_scheduler_job" "cron_trigger" {
  name             = "gpeg-inbox-polling-cron"
  description      = "Queries mailbox and creates cases in Spanner every 15 minutes."
  schedule         = "*/15 * * * *"
  time_zone        = "Europe/Brussels"
  attempt_deadline = "320s"

  http_target {
    http_method = "POST"
    uri         = "https://europe-west1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/google.com:gpeg-camps-automation/jobs/gpeg-inbox-ingestion-job:run"
    
    oauth_token {
      service_account_email = "gpeg-cloud-run-invoker@google.com"
    }
  }
}
