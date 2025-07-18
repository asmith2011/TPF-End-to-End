TEST_FAILED=false
#Portfolio applicable for Funds, ETFs, & Investment Trusts only
if ! k6 run --out csv=raw-data-portfolioGQL.csv ./tests/GQLEndPointTesting/portfolioGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api -e INPUTFILE=portfolio --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi
#Document applicable for Equity, Funds, ETFs, & Investment Trusts 
if ! k6 run --out csv=raw-data-documentGQL.csv ./tests/GQLEndPointTesting/documentGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api -e INPUTFILE=document --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi
#Annual Return applicable for Funds
if ! k6 run --out csv=raw-data-annualReturnGQL.csv ./tests/GQLEndPointTesting/annualReturnGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api -e INPUTFILE=annualReturn --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi
#Annual Return Category applicable for Equity, Funds, ETFs, & Investment Trusts 
if ! k6 run --out csv=raw-data-annualReturnCategoryGQL.csv ./tests/GQLEndPointTesting/annualReturnCategoryGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api -e INPUTFILE=annualReturnCategory --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi
#Balance sheet applicable for Equity only
if ! k6 run --out csv=raw-data-balanceSheetGQL.csv ./tests/GQLEndPointTesting/balanceSheetGQL.js  -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api -e INPUTFILE=balanceSheet --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi
#Key Ratios applicable for Equity only
if ! k6 run --out csv=raw-data-keyRatiosGQL.csv ./tests/GQLEndPointTesting/keyRatiosGQL.js -e  ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api -e INPUTFILE=keyRatios --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi
#Performance applicable for CEF, ETFs and Funds only
if ! k6 run --out csv=raw-data-performanceGQL.csv ./tests/GQLEndPointTesting/performanceGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api -e INPUTFILE=performance --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi
#Cash Flow applicable for Equity only
if ! k6 run --out csv=raw-data-cashFlowGQL.csv ./tests/GQLEndPointTesting/cashFlowGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api -e INPUTFILE=cashFlow --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi
#Income Statement applicalbe for Equity only
if ! k6 run --out csv=raw-data-incomeStatementGQL.csv ./tests/GQLEndPointTesting/incomeStatementGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api -e INPUTFILE=incomeStatement --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi
#Quote applicable for Funds, ETFs, & Investment Trusts only
if ! k6 run --out csv=raw-data-quoteGQL.csv ./tests/GQLEndPointTesting/quoteGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api -e INPUTFILE=quote --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi
#Profile applicable for Funds and CEF
if ! k6 run --out csv=raw-data-profileGQL.csv ./tests/GQLEndPointTesting/profileGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api -e INPUTFILE=profile --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi
#Key Statistics applicable for CEF
if ! k6 run --out csv=raw-data-keyStatisticsCEFGQL.csv ./tests/GQLEndPointTesting/keyStatisticsCEFGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api -e INPUTFILE=keyStatistics --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi
#Ratings applicable for Funds and ETFs
if ! k6 run --out csv=raw-data-ratingsGQL.csv ./tests/GQLEndPointTesting/ratingsGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api -e INPUTFILE=ratings --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi
#Target Markets applicable for Funds and ETFs
if ! k6 run --out csv=raw-data-targetMarketsGQL.csv ./tests/GQLEndPointTesting/targetMarketGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api -e INPUTFILE=targetMarket --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi
#Director Deals applicable for CEF
if ! k6 run --out csv=raw-data-directorDealsCEFGQL.js ./tests/GQLEndPointTesting/directorDealsCEFGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api -e INPUTFILE=directorDeals --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi
#Share Holder Information applicable for CEF
if ! k6 run --out csv=raw-data-shareHolderInformationCEFGQL.js ./tests/GQLEndPointTesting/shareHolderInformationCEFGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api -e INPUTFILE=shareHolderInformation --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi
#Prices with Realtime & Delayed quality
if ! k6 run ./tests/GQLEndPointTesting/livepriceGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi
#Favorites investment list
if ! k6 run --out csv=raw-data-favoritesGQL.csv ./tests/GQLEndPointTesting/favoritesGQL.js -e  ENDPOINT=https://marketdata-graphql-dev1.dev-shared1.ajbbuild.uk/marketdata/graphql -e INPUTFILE=favorites --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi
#Quote Currency validations applicable for Equity, Funds, ETFs, & Investment Trusts
if ! k6 run --out csv=raw-data-quoteCurrencyGQL.csv ./tests/GQLEndPointTesting/quoteCurrencyGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api -e INPUTFILE=quoteCurrency --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi
#Security Summary of instruments
if ! k6 run --out csv=raw-data-favoritesGQL.csv ./tests/GQLEndPointTesting/securitySummaryGQL.js -e  ENDPOINT=https://marketdata-graphql-dev1.dev-shared1.ajbbuild.uk/marketdata/graphql --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi
#Instrument info validations applicable for any instrument type
if ! k6 run --out csv=raw-data-instrumentInfoGQL.csv ./tests/GQLEndPointTesting/instrumentInfoGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api -e INPUTFILE=instrumentInfo --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi
#Index Constituents of FTSE and other indices GQL
if ! k6 run --out statsd ./tests/GQLEndPointTesting/indexConstituentsGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi
#Index Performance of FTSE indices with index symbol
if ! k6 run --out statsd ./tests/GQLEndPointTesting/indexGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi
#Search results validation with search strings
if ! k6 run --out csv=raw-data-searchGQL.csv ./tests/GQLEndPointTesting/searchGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api -e INPUTFILE=searchString --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi

#Figaro data given in GQL Endpoint
if ! k6 run --out statsd ./tests/GQLEndPointTesting/figaroDataGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi

#RisersFallers in indices via GQL 
if ! k6 run --out statsd ./tests/GQLEndPointTesting/risersFallersGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi

#Dividends of instruments via GQL 
if ! k6 run --out statsd ./tests/GQLEndPointTesting/dividendsGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi

#Sector Performance via GQL 
if ! k6 run --out statsd ./tests/GQLEndPointTesting/sectorPerformanceGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api -e INPUTFILE=targetMarket --vus 1 --duration 1s ; then    
    TEST_FAILED=true
fi

#Market Sentiment via GQL 
if ! k6 run --out statsd ./tests/GQLEndPointTesting/marketSentimentGQL.js -e ENDPOINT=https://marketdata-graphql-dev1.dev-shared1.ajbbuild.uk/marketdata/graphql --vus 1 --duration 1s ; then    
    TEST_FAILED=true
fi

#Test Errors 
if ! k6 run --out statsd ./tests/GQLEndPointTesting/errorGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api --vus 1 --duration 1s ; then    
    TEST_FAILED=true
fi

#Test News from different sources
if ! k6 run --out statsd ./tests/GQLEndPointTesting/newsCompareGQL.js -e ENDPOINT=https://marketdata-graphql-dev1.dev-shared1.ajbbuild.uk/marketdata/graphql --vus 1 --duration 1s ; then    
    TEST_FAILED=true
fi

#Test Shares magazine
if ! k6 run ./tests/GQLEndPointTesting/sharesmagazineGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api --vus 1 --duration 1s ; then    
    TEST_FAILED=true
fi

#News Headlines & Market sentiment via GQL 
if ! k6 run ./tests/GQLEndPointTesting/newsHeadlinesGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphql/api --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi

#News Headlines & Market sentiment via GQL - 2 (shares)
if ! k6 run ./tests/GQLEndPointTesting/newsHeadlinesGQL.js -e ENDPOINT=https://env3-hotfix1.aj-dev1.ajbbuild.uk/api/v2/marketdata/graphqlshares/api --vus 1 --duration 1s ; then
    TEST_FAILED=true
fi


# check if TEST_FAILED is true
if [ "$TEST_FAILED" = true ]; then
    echo "GQLRun.sh: FAILED"
    exit 1
else
    echo "All GQL Tests PASSED"
    exit 0
fi