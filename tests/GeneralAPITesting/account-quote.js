import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group, fail, sleep } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var accountQuoteRespTime = new Trend("custom_accountQuote_response_time");
var createTokenRespTime = new Trend("custom_createTokenRespTime_response_time");
var loginRespTime = new Trend("custom_loginRespTime_response_time");
var logoutRespTime = new Trend("custom_logoutRespTime_response_time");

export const options = {
    stages: [
         { duration: '1m', target: 2 },
         { duration: '9m', target: 2 }
    ]
};

let users = JSON.parse(open("../../data/account-quote-deal.json"));
// const symbols = ['LSE%3ALLOY','LSE%3ASBRY','LSE%3AAJB','LSE%3ABARC','LSE%3AJDW','LSE%3A3IN','LSE%3AABDN','LSE%3AAMGO','LSE%3AAO.','LSE%3AAPAX','LSE%3AAGR','LSE%3AAML'];
const symbols = ['LSE%3ABARC','LSE%3ASBRY'];

export default function () {

    let user = users.accounts[Math.floor(Math.random() * users.accounts.length)]
    let password = users.password;

    if (__ENV.ENDPOINT === undefined) {
        fail("Environment: ENDPOINT must be set");
    }

    var config = {
        endpoint: `${__ENV.ENDPOINT}`,
        logout_endpoint: `${__ENV.ENDPOINT}/api/user/logout`,
        token_endpoint: `${__ENV.ENDPOINT}/api/user/wso2-tokens`,
        login_endpoint: `${__ENV.ENDPOINT}/api/user/wso2-login`,
        account_quoteQty: `${__ENV.ENDPOINT}/api/account/quote`,
        client: 'web',
        device_token: 'YouInvestDeviceToken token=278bc838-b246-4fa7-b066-5e231ebc086e'
    };

    var response_values = {};
    var response;

    group('Get access token', function () {
       
        let tokenParams = {
            headers: {
                'X-Auth-AJB': config.device_token,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            redirects: 1,
            tags: { name: config.token_endpoint },
            responseType: "text",
        };

        response = http.post(
            config.token_endpoint,
            `username=YI${user.user}&password=${password}&client=${config.client}`,
            tokenParams
        );

        check(response, {
            'is status 200': (r) => r.status === 200,
        });

        if (response.status === 200) {
            check(response.body, {
                'contains success:true': (body) => JSON.parse(body).success === true,
            });
        } else {
            console.error(`Unexpected response: ${response.status} - ${response.body}`);
        }

        var body = JSON.parse(response.body);

        response_values.access_token = body.data.access_token;
        response_values.id_token = body.data.id_token;

        check(response_values, {
            'is access_token returned': (r) => r.access_token,
        });

        createTokenRespTime.add(response.timings.duration);
    });

    group('WSo2 login', function () {
        let tokenParams = {
            headers: {
                'X-Auth-AJB': config.device_token,
                'X-Auth-WSO2': 'token=' + response_values.id_token
            },
            redirects: 1,
            tags: { name: config.token_endpoint },
            responseType: "text",
        };

        response = http.post(
            config.login_endpoint,
            null,
            tokenParams
        );

        check(response, {
            'is status 200': (r) => r.status === 200,
        });

        if (response.status === 200) {
            check(response.body, {
                'contains success:true': (body) => JSON.parse(body).success === true,
            });
        } else {
            console.error(`Unexpected response: ${response.status} - ${response.body}`);
        }

        loginRespTime.add(response.timings.duration);
    });
    
    if(Math.random()<0.5){
        group('Quote Quantity', function () {
            let tokenParams = {
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Auth-AJB': config.device_token,
                },
                redirects: 0,
                responseType: "text"
            };
    
            response = http.post(
                config.account_quoteQty,
                `account=${user.account}&marketCode=${symbols[Math.floor(Math.random() * symbols.length)]}&instruction=B&chargeCode=&chargeAmount=&amount=&quantity=1&includecharges=`,
                tokenParams
            );
            
            check(response, {
                'is status 200': (r) => r.status === 200,
            });

            if (response.status === 200) {
                check(response.body, {
                    'check the Success status': (body) => {
                        const parsedBody = JSON.parse(body);
                        return parsedBody.success === true && parsedBody.data.accountNo.length > 0 && parsedBody.data.quote.token.length > 0;
                    },
                });

                console.log("User", JSON.stringify(user)); // User
                console.log("Status", response.status); // Print status
                console.log("Quote Quantity Response Body:", response.body);

                accountQuoteRespTime.add(response.timings.duration);
            } else {
                console.error(`Unexpected response: ${response.status} - ${response.body}`);
                users.accounts = users.accounts.filter(account => account !== user.account);
                console.log(`User YI${user.user} - ${user.account} has been removed from the account-quote.json data.`);
            }           
        });
    }
    else{
        group('Quote Amount', function () {
            let tokenParams = {
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Auth-AJB': config.device_token,
                },
                redirects: 0,
                responseType: "text"
            };
    
            response = http.post(
                config.account_quoteQty,
                `account=${user.account}&marketCode=${symbols[Math.floor(Math.random() * symbols.length)]}&instruction=B&chargeCode=&chargeAmount=&amount=25&quantity=&includecharges=`,
                tokenParams
            );
            
            check(response, {
                'is status 200': (r) => r.status === 200,
            });

            if (response.status === 200) {
                check(response.body, {
                    'check the Success status': (body) => {
                        const parsedBody = JSON.parse(body);
                        return parsedBody.success === true && parsedBody.data.accountNo.length > 0 && parsedBody.data.quote.token.length > 0;
                    },
                });

                console.log("User", JSON.stringify(user)); // User
                console.log("Status", response.status); // Print status
                console.log("Quote Amount Response Body:", response.body); // Print response body

                accountQuoteRespTime.add(response.timings.duration);
            } else {
                console.error(`Unexpected response: ${response.status} - ${response.body}`);
                users.accounts = users.accounts.filter(account => account !== user.account);
                console.log(`User YI${user.user} - ${user.account} has been removed from the account-quote.json data.`);
            }       
        });
    }
    
    group('Log out', function () {

        let tokenParams = {
            headers: {
                'x-auth-ajb': config.device_token,
            },
            redirects: 0,
            responseType: "text"
        };

        response = http.del(
            config.logout_endpoint,
            null,
            tokenParams
        );

        check(response, {
            'is status 200': (r) => r.status === 200,
        });

        if (response.status !== 200) {
            console.error(`Unexpected response: ${response.status} - ${response.body}`);
        }

        logoutRespTime.add(response.timings.duration);
    });

    

}

export function handleSummary(data) {
    
    return {
      "GQLReports/Account_Quote_Test.html": htmlReport(data),
       stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}