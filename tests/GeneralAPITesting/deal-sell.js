import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group, fail, sleep } from 'k6';
import { initialise, getToken, login, logOut } from "../../commonUtil/common.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

let accountportfolioRespTime = new Trend("custom_accountportfolioRespTime_response_time");
let accountQuoteSellRespTime = new Trend("custom_accountQuoteSellRespTime_response_time");
let tradeSellRespTime = new Trend("custom_tradeSellRespTime_response_time");
let cancelOrderRespTime = new Trend("custom_cancelOrderRespTime_response_time");

export const options = {
    stages: [
        // { duration: '1m', target: 50 },
        // { duration: '4m', target: 50 }
    ]
};

let users = JSON.parse(open("../../data/account-quoteEnv3.json"));
const symbols = ['LSE%3ABARC', 'LSE%3ASBRY'];

function postRequest(url, body, headers, responseType = "text") {
    return http.post(url, body, { headers, redirects: 0, responseType });
}

function handleResponse(response, user, successChecks, respTimeMetric) {
    if (response.status === 200) {
        const statusCheck = check(response, { 'is status 200': (r) => r.status === 200 });
        const bodyCheck = check(response, { 'has body': (r) => r.body });
        const successCheck = check(response.body, successChecks);

        respTimeMetric.add(response.timings.duration);

        if (!(statusCheck && bodyCheck && successCheck)) {
            console.log("Failed Response:", response.body); // Print response on failure
        }
        return statusCheck && bodyCheck && successCheck;
    } else {
        console.log("Failed Response:", response.body);
        users.accounts = users.accounts.filter(account => account !== user.account);
        console.log(`User YI${user.user} - ${user.account} has been removed from the account-quote.json data.`);
        return false;
    }
}

export default function () {
    let user = users.accounts[Math.floor(Math.random() * users.accounts.length)];
    let password = users.password;

    if (__ENV.ENDPOINT === undefined) {
        fail("Environment: ENDPOINT must be set");
    }

    let config = {
        endpoint: `${__ENV.ENDPOINT}`,
        account_portfolio: `${__ENV.ENDPOINT}/api/account/portfolio?account=${user.account}`,
        account_quote_sellAll: `${__ENV.ENDPOINT}/api/account/quote-limit-order`,
        account_deal: `${__ENV.ENDPOINT}/api/account/deal`,
        instrument_quote: `${__ENV.ENDPOINT}/api/securities/search?search=`,
        activeOrders: `${__ENV.ENDPOINT}/api/account/active-orders?account=`,
        client: 'web',
        device_token: 'YouInvestDeviceToken token=278bc838-b246-4fa7-b066-5e231ebc086e'
    };
    let tokenParams = {
        headers: {
            'x-auth-ajb': config.device_token,
        },
        redirects: 0,
        responseType: "text"
    };
    
    let tokenParams2 = {
        'accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Auth-AJB': config.device_token
    };

    let response_values = {};
    let response;
    let portfolioData = {};

    initialise();
    let idToken = getToken(`YI${user.user}`, password, 'web');
    login(`YI${user.user}`, idToken);

    group('Product Portfolio', function () {

        response = http.get(
            config.account_portfolio,
            tokenParams
        );
        check(response, {
            'is portfolio status 200': (r) => r.status === 200,
        });

        if (response.status === 200) {
            portfolioData = JSON.parse(response.body);
            accountportfolioRespTime.add(response.timings.duration);
        } else {
            console.log("Failed to fetch product portfolio:", response.body);
        }
    });

    if (portfolioData.data.items.length > 1) {
        let instrument = null;
        console.log('Portfolio has more than 1 item:', portfolioData.data.items.length);
        group('Sell all shares', function () {

            for (const item of portfolioData.data.items) {                
                const marketCode = item.instrument?.marketCode;
                if (marketCode.startsWith("LSE:")) {
                    const today = new Date().toISOString().split('T')[0];
                    let quote = http.get(
                        `${config.instrument_quote}${marketCode.replace(/:/g, "%3A")}&market=LSE&showPenelized=false&quote=true`,
                        tokenParams
                    );
                    const sellPrice = (quote.json().data.results[0].quote.price*1.15).toFixed(0); //Bump current price by 15% for Sell All
                    const accountNumber = portfolioData.data.accountNumber;
                    console.log(`[Iteration ${__ITER}] User:`, `YI${user.user}`, 'Account:', user.account);
                    console.log(`[Iteration ${__ITER}] Account Number:`, accountNumber);
                    console.log(`[Iteration ${__ITER}] Instrument:`, marketCode);
                    console.log(`[Iteration ${__ITER}] Sell Price:`, sellPrice);

                    let response2 = postRequest(
                        config.account_quote_sellAll,
                        `account=${accountNumber}&marketCode=${marketCode}&instruction=A&includecharges=false&limitPriceGBX=1&limitPrice=${sellPrice}&expiryDate=${today}`,
                        tokenParams2
                    );

                    let placeTrade = handleResponse(
                        response2,
                        user,
                        {
                            'check the Quote Success ': (body) => {
                                const parsedBody = JSON.parse(body);
                                return parsedBody.success === true && parsedBody.data.accountNo.length > 0 && parsedBody.data.quote.token.length > 0;
                            }
                        },
                        accountQuoteSellRespTime
                    );

                    if (placeTrade) {
                        const quoteData = JSON.parse(response2.body).data;
                        const quoteToken = quoteData.quote.token;
                        const accountNo = quoteData.accountNo;
                        console.log('Sell All Limit order for:', accountNo + ' and Quote Token:', quoteToken);

                        let tradeResponse = postRequest(
                            config.account_deal,
                            `limitPriceGBX=1&token=${quoteToken}&account=${accountNo}`,
                            tokenParams2
                        );

                        handleResponse(
                            tradeResponse,
                            user,
                            {
                                'check the Trade Success': (body) => {
                                    const parsedBody = JSON.parse(body);

                                    return (
                                        parsedBody.success === true &&
                                        parsedBody.data.trade.instrument.id.length > 0
                                    );
                                }
                            },
                            tradeSellRespTime
                        );
                    }
                    break;
                }
            }
        });

        console.log('Sell all shares completed');
        sleep(2);// Wait for 2 seconds before the cancellation of order
        group('Cancel order', function () {
            let activeOrdersResponse = http.get(
                `${config.activeOrders}${user.account}`,
                tokenParams
            );

            if (activeOrdersResponse.status === 200) {
                const activeOrdersData = JSON.parse(activeOrdersResponse.body);
                if (activeOrdersData.data.orders.items.length > 0) {
                    const contractReference = activeOrdersData.data.orders.items[0].contractReference;
                    console.log(`[Iteration ${__ITER}] Active Order Reference:`, contractReference);

                    let cancelOrderResponse = http.del(
                        `${config.activeOrders}${user.account}&ref=${contractReference}`,
                        null,
                        tokenParams
                    );

                    check(cancelOrderResponse, {
                        'cancel order status 200': (r) => r.status === 200,
                    });

                    if (cancelOrderResponse.status === 200) {
                        console.log(`[Iteration ${__ITER}] Successfully canceled order with contract reference:`, contractReference);
                        cancelOrderRespTime.add(cancelOrderResponse.timings.duration);
                    } else {
                        console.log(`[Iteration ${__ITER}] Failed to cancel order:`, cancelOrderResponse.body);
                    }
                } else {
                    console.log('No active orders found for account:', user.account);
                }
            } else {
                console.log('Failed to fetch active orders:', activeOrdersResponse.body);
            }
        });
    }
    else {
        console.log('Portfolio is empty');
    }

    logOut();
}

export function handleSummary(data) {
    return {
        "GQLReports/Deal_Test_sell.html": htmlReport(data),
        stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}