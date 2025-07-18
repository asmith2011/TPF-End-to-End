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

var transactionHistoryRespTime = new Trend("custom_transactionHistory_response_time");
var transactionHistoryStats = new Rate("custom_transactionHistory_stats");

export const options = {
    stages: [
        { duration: '1m', target: 1 },
        // { duration: '2m', target: 40 },
        // { duration: '5m', target: 60 },
        // { duration: '1m', target: 20 },
    ],
    thresholds: {
        checks: ['rate>=1']
      },
};

const users = JSON.parse(open("../../data/portfolio-load.json"));

export default function () {

    let user = users.accounts[Math.floor(Math.random() * users.accounts.length)]   
    let password = users.password;

    if (__ENV.ENDPOINT === undefined) {
        fail("Environment: ENDPOINT must be set");
    }

    var config = {
        endpoint: `${__ENV.ENDPOINT}`,
        transaction_history: `${__ENV.ENDPOINT}/api/account/transaction-history?account=${user.account}`,
        client: 'web',
        device_token: 'YouInvestDeviceToken token=278bc838-b246-4fa7-b066-5e231ebc086e'
    };

    var response_values = {};
    var response;
    initialise();
    
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1; // Months start at 0!
    let dd = today.getDate();
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    const formattedToday = dd + '-' + mm + '-' + yyyy;

    let idToken = getToken(user.user, password,config.client);
    login(user,idToken);
    
    group('Transaction History', function () {
        const now = Math.floor(Date.now() / 1000)
        const oneYear = now-30000000

        let tokenParams = {
            headers: {
                'x-auth-ajb': config.device_token,
            },
            redirects: 0,
            responseType: "text"
        };

        response = http.get(
            `${config.transaction_history}&dateFrom=${oneYear}&dateTo=${now}&include=price`,
            tokenParams
        );

        var body = JSON.parse(response.body);        
        checkStatus(response,200)  
        
        check(response, {
            'is status 200': (r) => r.status === 200,
        });

        check(body, {
            'has success in body': (r) => r.success == true,
        });        

        check(body, {
            'has todays date': (r) => r.data.toDate == formattedToday,
        });        
        transactionHistoryRespTime.add(response.timings.duration);
        transactionHistoryStats.add(1);
    });   

    logOut();

}
export function handleSummary(data) {
    return {
      "Transaction_History_Test.html": htmlReport(data),
       stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}