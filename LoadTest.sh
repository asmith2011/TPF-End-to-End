TEST_FAILED=false
# #WSO2 Login -> Portfolio-Load ->Logout
if ! k6 run --out statsd --out csv=raw-data-transactionHistory.csv ./tests/GeneralAPITesting/transactionHistory-load.js -e ENDPOINT=https://env3-cl.aj-dev1.ajbbuild.uk/ --vus 1 --duration 2s ; then
    TEST_FAILED=true
fi

TEST_FAILED=false
# #Research
if ! k6 run ./tests/GeneralAPITesting/research.js -e ENDPOINT=https://env3-cl.aj-dev1.ajbbuild.uk/ --vus 1 --duration 2s ; then
    TEST_FAILED=true
fi

# check if TEST_FAILED is true
if [ "$TEST_FAILED" = true ]; then
    echo "LoadTest.sh: FAILED"
    exit 1
fi