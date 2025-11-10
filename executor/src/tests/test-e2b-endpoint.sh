#!/bin/bash

# Test script for E2B execute endpoint
# Sends a "hello world" Python script to the endpoint

echo "Testing E2B execute endpoint..."
echo "Endpoint: https://echo.router.merit.systems/resource/e2b/execute"
echo ""

curl -X POST https://echo.router.merit.systems/resource/e2b/execute \
  -H "Content-Type: application/json" \
  -d '{
    "script": "print(\"Hello World!\")"
  }'

echo ""
echo "Test complete."
