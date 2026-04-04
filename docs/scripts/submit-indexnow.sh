#!/usr/bin/env bash
# Submit key pages to IndexNow (Bing, Yandex, Seznam, Naver)
# Run after deploying the docs site: bash docs/scripts/submit-indexnow.sh

INDEXNOW_KEY="8ab3a51431dc4d69acaabf3f97ad90d2"
HOST="praman.dev"
BASE_URL="https://${HOST}"

curl -s -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json" \
  -d "{
    \"host\": \"${HOST}\",
    \"key\": \"${INDEXNOW_KEY}\",
    \"keyLocation\": \"${BASE_URL}/${INDEXNOW_KEY}.txt\",
    \"urlList\": [
      \"${BASE_URL}/\",
      \"${BASE_URL}/architecture\",
      \"${BASE_URL}/features\",
      \"${BASE_URL}/personas\",
      \"${BASE_URL}/demo\",
      \"${BASE_URL}/docs/guides/getting-started\",
      \"${BASE_URL}/docs/guides/configuration\",
      \"${BASE_URL}/docs/guides/authentication\",
      \"${BASE_URL}/docs/guides/fixtures\",
      \"${BASE_URL}/docs/guides/selectors\",
      \"${BASE_URL}/docs/guides/agent-setup\",
      \"${BASE_URL}/docs/guides/control-interactions\",
      \"${BASE_URL}/docs/guides/fiori-elements\",
      \"${BASE_URL}/docs/guides/odata-operations\",
      \"${BASE_URL}/docs/guides/migration-from-wdi5\",
      \"${BASE_URL}/docs/guides/migration-from-playwright\",
      \"${BASE_URL}/docs/guides/migration-from-tosca\",
      \"${BASE_URL}/docs/guides/docker-cicd\",
      \"${BASE_URL}/docs/api/\",
      \"${BASE_URL}/blog\",
      \"${BASE_URL}/blog/sap-test-automation-comparison\",
      \"${BASE_URL}/llms.txt\",
      \"${BASE_URL}/llms-full.txt\"
    ]
  }"

echo ""
echo "IndexNow submission complete. HTTP 200/202 = success."
