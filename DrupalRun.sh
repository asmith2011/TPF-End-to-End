TEST_FAILED=false
# #drupal Home
if ! k6 run tests/DrupalBatch1/home.js -e ENDPOINT=https://env5-cl.ajb-test2.ajbbuild.uk  ; then
    TEST_FAILED=true
fi

# #drupal Investment Accounts
if ! k6 run tests/DrupalBatch1/investmentAccounts.js -e ENDPOINT=https://env5-cl.ajb-test2.ajbbuild.uk  ; then
    TEST_FAILED=true
fi

# #drupal Stocks and shares ISA
if ! k6 run tests/DrupalBatch1/stocksAndSharesISA.js -e ENDPOINT=https://env5-cl.ajb-test2.ajbbuild.uk  ; then
    TEST_FAILED=true
fi

# #drupal ISA Charges
if ! k6 run tests/DrupalBatch1/isaCharges.js -e ENDPOINT=https://env5-cl.ajb-test2.ajbbuild.uk  ; then
    TEST_FAILED=true
fi

# #drupal Managed Funds
if ! k6 run tests/DrupalBatch1/managedFunds.js -e ENDPOINT=https://env5-cl.ajb-test2.ajbbuild.uk   ; then
    TEST_FAILED=true
fi

# #drupal Fund screener
if ! k6 run tests/DrupalBatch1/screenerFunds.js -e ENDPOINT=https://env5-cl.ajb-test2.ajbbuild.uk   ; then
    TEST_FAILED=true
fi

# #drupal Shares screener
if ! k6 run tests/DrupalBatch1/screenerShares.js -e ENDPOINT=https://env5-cl.ajb-test2.ajbbuild.uk  ; then
    TEST_FAILED=true
fi

# #drupal ETFs screener
if ! k6 run tests/DrupalBatch1/screenerETFs.js -e ENDPOINT=https://env5-cl.ajb-test2.ajbbuild.uk  ; then
    TEST_FAILED=true
fi

# #drupal Investment Trusts screener
if ! k6 run tests/DrupalBatch1/screenerInvestmentTrust.js -e ENDPOINT=https://env5-cl.ajb-test2.ajbbuild.uk  ; then
    TEST_FAILED=true
fi

# #drupal starter portfolios
if ! k6 run tests/DrupalBatch1/starterPortfolio.js -e ENDPOINT=https://env5-cl.ajb-test2.ajbbuild.uk  ; then
    TEST_FAILED=true
fi

# drupal search
if ! k6 run tests/DrupalBatch1/search.js -e ENDPOINT=https://internal.ajb-test2.ajbbuild.uk  ; then
    TEST_FAILED=true
fi

# check if TEST_FAILED is true
if [ "$TEST_FAILED" = true ]; then
    echo "DrupalRun.sh: FAILED"
    exit 1
fi