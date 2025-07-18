TEST_FAILED=false
#Prices with Realtime quality
if ! k6 run ./tests/GQLEndPointTesting/livepriceRTLGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi
# check if TEST_FAILED is true
if [ "$TEST_FAILED" = true ]; then
    echo "Live Price RTL Test: FAILED"
    exit 1
else
    echo "Live Price RTL Test PASSED"
    exit 0
fi