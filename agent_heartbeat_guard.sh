#!/bin/bash
# GPEG Camps Agentic Infrastructure - Automated SRE Heartbeat Guard
# Evaluates compilation and E2E tests dynamically on the infrastructure side prior to LLM turns.

TEST_RUNNER="/usr/local/google/home/chandansinghr/.gemini/jetski/scratch/camps-portal/simulate_tests.py"
FAILURE_REPORT="/usr/local/google/home/chandansinghr/.gemini/jetski/scratch/camps-portal/.agent_brain/test_failure_report.json"
mkdir -p "/usr/local/google/home/chandansinghr/.gemini/jetski/scratch/camps-portal/.agent_brain"

echo "📡 SRE Heartbeat: Initiating E2E system test validations..."

# Run python test runner and capture stdout
test_output=$(python3 "$TEST_RUNNER" 2>&1)
exit_code=$?

if [ $exit_code -eq 0 ]; then
  passed_msg=$(echo "$test_output" | grep -i "SUCCESS: All")
  if [ -n "$passed_msg" ]; then
    # Strip color formatting escape codes from parsed logs
    passed_clean=$(echo "$passed_msg" | sed -r "s/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[mGK]//g")
    echo "✓ SRE Heartbeat: $passed_clean! Infrastructure state is stable."
  else
    echo "✓ SRE Heartbeat: All E2E test scenarios passed successfully! Infrastructure state is stable."
  fi
  rm -f "$FAILURE_REPORT"
  exit 0
else
  echo "❌ SRE Heartbeat: System test failures detected! Creating failure telemetry logs..."
  
  # Extract Python traceback error if present
  error_trace=$(echo "$test_output" | grep -A 15 -i -E "Traceback|Error|Exception" | tail -n 15)
  
  # Compile telemetry JSON report
  cat <<EOF > "$FAILURE_REPORT"
{
  "status": "TEST_FAILURE",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "exit_code": $exit_code,
  "error_snippet": $(echo "$error_trace" | jq -R -s '.'),
  "resolved": false
}
EOF
  
  echo "✓ SRE Telemetry recorded persistently inside: $FAILURE_REPORT"
  echo "⚠️ Heartbeat Notification: Presenter scheduling conflicts or database binding errors must be resolved before live runs."
  exit $exit_code
fi
