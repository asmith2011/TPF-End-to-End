import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group, fail, sleep } from 'k6';
import { initialise, getToken,login,logOut } from "../../commonUtil/common.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var accountQuoteQtyRespTime = new Trend("custom_accountQuoteQty_response_time");
var accountQuoteAmtRespTime = new Trend("custom_accountQuoteAmt_response_time");
var tradeQtyRespTime = new Trend("custom_tradeQty_response_time");
var tradeAmtRespTime = new Trend("custom_tradeAmt_response_time");

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
            console.log(`[Iteration ${__ITER}] Failed Response:`, response.body); // Print response if checks fail
        }
        return statusCheck && bodyCheck && successCheck;
    } else {
        console.log(`[Iteration ${__ITER}] Failed Response:`, response.body); 
        users.accounts = users.accounts.filter(account => account !== user.account);
        console.log(`[Iteration ${__ITER}] User YI${user.user} - ${user.account} has been removed from the account-quote.json data.`);
        return false;
    }
}

export default function () {
    let user = users.accounts[Math.floor(Math.random() * users.accounts.length)];
    let password = users.password;

    if (__ENV.ENDPOINT === undefined) {
        fail("Environment: ENDPOINT must be set");
    }

    var config = {
        endpoint: `${__ENV.ENDPOINT}`,
        account_quote: `${__ENV.ENDPOINT}/api/account/quote`,
        account_deal: `${__ENV.ENDPOINT}/api/account/deal`,
        client: 'web',
        device_token: 'YouInvestDeviceToken token=278bc838-b246-4fa7-b066-5e231ebc086e'
    };

    var response_values = {};
    var response;

    initialise();
    let idToken = getToken(`YI${user.user}`, password,'web');
    login(`YI${user.user}`,idToken);

    if (__VU % 2 === 0) {
        group('Deal Buy Quantity', function () {
            let tokenParams = {
                'accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Auth-AJB': config.device_token
            };

            response = postRequest(
                config.account_quote,
                `account=${user.account}&marketCode=${symbols[Math.floor(Math.random() * symbols.length)]}&instruction=B&chargeCode=&chargeAmount=&amount=&quantity=1&includecharges=`,
                tokenParams
            );

            let placeTrade = handleResponse(
                response,
                user,
                {
                    'check the Quote Success ': (body) => {
                        const parsedBody = JSON.parse(body);
                        return parsedBody.success === true && parsedBody.data.accountNo.length > 0 && parsedBody.data.quote.token.length > 0;
                    }
                },
                accountQuoteQtyRespTime
            );

            if (placeTrade) {
                sleep(1);
                const quoteData = JSON.parse(response.body).data;
                const quoteToken = quoteData.quote.token;
                const accountNo = quoteData.accountNo;
                console.log(`[Iteration ${__ITER}] Deal by Quantity for Account No:`, accountNo + ' and Quote Token:', quoteToken);

                let tradeResponse = postRequest(
                    config.account_deal,
                    `limitPriceGBX=1&token=${quoteToken}&account=${accountNo}`,
                    tokenParams
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
                    tradeQtyRespTime 
                );
            }
        });
    } else {
        group('Deal Buy Amount', function () {
            let tokenParams = {
                'accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Auth-AJB': config.device_token
            };

            response = postRequest(
                config.account_quote,
                `account=${user.account}&marketCode=${symbols[Math.floor(Math.random() * symbols.length)]}&instruction=B&chargeCode=&chargeAmount=&amount=25&quantity=&includecharges=`,
                tokenParams
            );

            let placeTrade = handleResponse(
                response,
                user,
                {
                    'check the Quote Success ': (body) => {
                        const parsedBody = JSON.parse(body);
                        return parsedBody.success === true && parsedBody.data.accountNo.length > 0 && parsedBody.data.quote.token.length > 0;
                    }
                },
                accountQuoteAmtRespTime
            );

            if (placeTrade) {
                sleep(1);
                const quoteData = JSON.parse(response.body).data;
                const accountNo = quoteData.accountNo;
                const quoteToken = quoteData.quote.token;
                console.log(`[Iteration ${__ITER}] Deal by Amount for Account No:`, accountNo + ' and Quote Token:', quoteToken);

                let tradeResponse = postRequest(
                    config.account_deal,
                    `limitPriceGBX=1&token=${quoteToken}&account=${accountNo}`,
                    tokenParams
                );

                handleResponse(
                    tradeResponse,
                    user,
                    {
                        'check the Trade Success ': (body) => {
                            const parsedBody = JSON.parse(body);

                            return (
                                parsedBody.success === true &&
                                parsedBody.data.trade.instrument.id.length > 0 
                            );
                        }
                    },
                    tradeAmtRespTime 
                );
            }
        });
    }

    logOut();
}

export function handleSummary(data) {
    return {
        "GQLReports/Deal_Buy_Test.html": htmlReport(data),
        stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}