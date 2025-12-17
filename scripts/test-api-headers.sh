#!/bin/bash
# Test script to verify quota headers in API responses
# Run this after logging in and getting a session cookie

# Replace PROJECT_ID with an actual project ID from your database
PROJECT_ID=1

echo "Testing /api/projects/${PROJECT_ID}/generate endpoint headers..."
echo ""

# This will fail without proper authentication, but you can use browser DevTools instead
# to inspect the response headers:
# 1. Open DevTools (F12)
# 2. Go to Network tab
# 3. Generate outputs
# 4. Look for the POST request to /api/projects/{id}/generate
# 5. Check Response Headers for:
#    - X-Quota-Used
#    - X-Quota-Limit
#    - X-Quota-Remaining
#    - X-Quota-Reset-Date

echo "Expected headers in response:"
echo "  X-Quota-Used: <number>"
echo "  X-Quota-Limit: <number>"
echo "  X-Quota-Remaining: <number>"
echo "  X-Quota-Reset-Date: <ISO date>"
