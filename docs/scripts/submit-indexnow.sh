#!/usr/bin/env bash
# Submit key pages to IndexNow (Bing, Yandex, Seznam, Naver)
# Run after deploying the docs site: bash docs/scripts/submit-indexnow.sh

INDEXNOW_KEY="8ab3a51431dc4d69acaabf3f97ad90d2"
HOST="praman.zestest.in"

curl -s -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json" \
  -d "{
    \"host\": \"${HOST}\",
    \"key\": \"${INDEXNOW_KEY}\",
    \"keyLocation\": \"https://${HOST}/${INDEXNOW_KEY}.txt\",
    \"urlList\": [
      \"https://${HOST}/\",
      \"https://${HOST}/architecture\",
      \"https://${HOST}/features\",
      \"https://${HOST}/personas\",
      \"https://${HOST}/demo\",
      \"https://${HOST}/docs/guides/getting-started\",
      \"https://${HOST}/docs/guides/configuration\",
      \"https://${HOST}/docs/guides/authentication\",
      \"https://${HOST}/docs/guides/fixtures\",
      \"https://${HOST}/docs/guides/selectors\",
      \"https://${HOST}/docs/guides/agent-setup\",
      \"https://${HOST}/docs/guides/control-interactions\",
      \"https://${HOST}/docs/guides/fiori-elements\",
      \"https://${HOST}/docs/guides/odata-operations\",
      \"https://${HOST}/docs/guides/migration-from-wdi5\",
      \"https://${HOST}/docs/guides/migration-from-playwright\",
      \"https://${HOST}/docs/guides/migration-from-tosca\",
      \"https://${HOST}/docs/guides/docker-cicd\",
      \"https://${HOST}/docs/api/\",
      \"https://${HOST}/blog\",
      \"https://${HOST}/llms.txt\",
      \"https://${HOST}/llms-full.txt\"
    ]
  }"

echo ""
echo "IndexNow submission complete. HTTP 200/202 = success."
