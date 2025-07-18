TEST_FAILED=false
#WSO2 Login ->Account Summary ->Logout
if ! k6 run --out statsd --out csv=raw-data-account-summary.csv ./tests/GeneralAPITesting/accountSummary.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk --vus 5 --duration 2s ; then
    TEST_FAILED=true
fi

#WSO2 Login ->Account Quote ->Logout
if ! k6 run ./tests/GeneralAPITesting/account-quote.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi

#WSO2 Login ->Account Quote -> Deal ->Logout
if ! k6 run ./tests/GeneralAPITesting/deal-buy.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk --vus 2 --duration 1s ; then
    TEST_FAILED=true
fi

#WSO2 Login ->Account Quote -> Sell all -> Cancel ->Logout
if ! k6 run ./tests/GeneralAPITesting/deal-sell.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk --vus 2 --duration 1s ; then
    TEST_FAILED=true
fi

#WSO2 Login ->Active Orders ->Logout
if ! k6 run --out statsd --out csv=raw-data-active-orders.csv ./tests/GeneralAPITesting/active-orders.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk --vus 1 --duration 2s ; then
    TEST_FAILED=true
fi

#WSO2 Login ->Direct Debit ->Logout
if ! k6 run --out statsd --out csv=raw-data-direct-debit.csv ./tests/GeneralAPITesting/direct-debit.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk --vus 2 --duration 2s ; then
    TEST_FAILED=true
fi

#Order Type
if ! k6 run --out statsd --out csv=raw-data-order-type.csv ./tests/GeneralAPITesting/order-type.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk -e IDENTIFIER=LSE:ISF --vus 2 --duration 2s ; then
    TEST_FAILED=true
fi

#Accepting Sedol
if ! k6 run --out csv=raw-data-accepting-sedol.csv ./tests/GeneralAPITesting/accepting-sedol.js -e IDENTIFIER=FUND:B4PQW15  -e ENDPOINT=https://marketdata-graphql-uat1.dev-shared1.ajbbuild.uk/marketdata/graphql -e APIENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk ; then
    TEST_FAILED=true
fi

#Available Products
if ! k6 run --out statsd --out csv=raw-data-available-products.csv ./tests/GeneralAPITesting/available-products.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk --vus 1 --duration 2s ; then
    TEST_FAILED=true
fi

# #WSO2 Login -> Portfolio-Load ->Logout
if ! k6 run --out statsd --out csv=raw-data-portfolio.csv ./tests/GeneralAPITesting/portfolio-load.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk --vus 2 --duration 2s ; then
    TEST_FAILED=true
fi

# #drupal
if ! k6 run --out statsd --out csv=raw-data-drupal.csv ./tests/GeneralAPITesting/drupal.js -e ENDPOINT=https://beta.ajbell.co.uk --vus 2 --duration 2s ; then
    TEST_FAILED=true
fi

# check if TEST_FAILED is true
if [ "$TEST_FAILED" = true ]; then
    echo "GeneralAPI.sh: FAILED"
    exit 1
else
    echo "All K6 api TestS PASSED"
    exit 0
fi