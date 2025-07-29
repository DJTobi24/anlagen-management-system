#!/bin/bash

echo "===== Testing Large Import via API ====="
echo "File: demodaten/anlagenimport.xlsx"
echo "Expected: 2248 Anlagen, 1 Liegenschaft, 10 Gebäude"
echo ""

# Start time
START_TIME=$(date +%s)

# Upload the file
echo "Uploading file..."
RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer test-token" \
  -F "file=@demodaten/anlagenimport.xlsx" \
  http://localhost:3000/api/v1/import/upload/extended)

# End time
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "Response:"
echo "$RESPONSE" | jq .

echo ""
echo "Duration: $DURATION seconds"

# Parse response
SUCCESS=$(echo "$RESPONSE" | jq -r '.data.success // 0')
FAILED=$(echo "$RESPONSE" | jq -r '.data.failed // 0')
CREATED_LIEG=$(echo "$RESPONSE" | jq -r '.data.createdLiegenschaften // 0')
CREATED_GEB=$(echo "$RESPONSE" | jq -r '.data.createdGebaeude // 0')

echo ""
echo "===== Summary ====="
echo "Successfully imported: $SUCCESS Anlagen"
echo "Failed: $FAILED"
echo "Created Liegenschaften: $CREATED_LIEG"
echo "Created Gebäude: $CREATED_GEB"

if [ "$SUCCESS" -eq 2248 ]; then
  echo ""
  echo "✅ SUCCESS: All 2248 Anlagen imported successfully!"
else
  echo ""
  echo "⚠️  WARNING: Not all Anlagen were imported successfully"
fi