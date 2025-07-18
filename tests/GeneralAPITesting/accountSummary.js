import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group, fail, sleep } from 'k6';
import { initialise } from "../../commonUtil/common.js";
import { getToken } from "../../commonUtil/common.js";
import { login } from "../../commonUtil/common.js";
import { logOut } from "../../commonUtil/common.js";
import { checkStatus } from "../../commonUtil/common.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var accountSummaryRespTime = new Trend("custom_accountSummary_response_time");
var accountSummaryStats = new Rate("custom_accountSummary_stats");

export const options = {
    stages: [
        { duration: '1s', target: 1},
        // { duration: '2m', target: 40 },
        // { duration: '5m', target: 60 },
        // { duration: '1m', target: 20 },
    ],
    thresholds: {
        checks: ['rate>=1']
      },
};

const users = JSON.parse(open("../../data/env5.json"));

export default function () {

    let user = users.accounts[Math.floor(Math.random() * users.accounts.length)]   
    let password = users.password;

    if (__ENV.ENDPOINT === undefined) {
        fail("Environment: ENDPOINT must be set");
    }

    var config = {
        endpoint: `${__ENV.ENDPOINT}`,
        account_summary: `${__ENV.ENDPOINT}/api/account/account-summary?refreshOwned=true`,
        client: 'web',
        device_token: 'YouInvestDeviceToken token=278bc838-b246-4fa7-b066-5e231ebc086e'
    };
    var response;
    initialise();

    let idToken = getToken(user, password,config.client);
    login(user,idToken);
    
    group('Account Summary', function () {
        const now = Math.floor(Date.now() / 1000)
        const oneYear = now-30000000

        let tokenParams = {
            headers: {
                'x-auth-ajb': config.device_token,
            },
            redirects: 0,
            responseType: "text"
        };
        for (let retries = 1; retries < 3; retries++) {
            response = http.get(`${config.account_summary}`, tokenParams);
            if (response.status === 200) {
                // accountSummaryRespTime.add(response.timings.duration);
                // accountSummaryStats.add(1);
                // If need to exclude failing req response time from the stats enable above two lines
                break;
            } else {
                console.log(`ERROR---------------------------------------- ${response.status} given`);
                console.log(response.body);
                response = http.get(
                    `${__ENV.ENDPOINT}/api/account/account-summary-v2`,
                    tokenParams
                );
                console.log(response.body);
                console.log(`Retry count---------------------------------------- ${retries}`);
            }
        }
        accountSummaryRespTime.add(response.timings.duration);
        // accountSummaryStats.add(1);

        var body = JSON.parse(response.body);
        
        check(response, {
            'is status 200': (r) => r.status === 200,
        });

        check(body, {
            'has success in body': (r) => r.success == true,
        });   
    });   

    logOut();

}
export function handleSummary(data) {
    return {
      "Reports/account-summary.html": htmlReport(data),
       stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}