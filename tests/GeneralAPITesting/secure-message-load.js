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

var secureMessageRespTime = new Trend("custom_secureMessage_response_time");
var secureMessageStats = new Rate("custom_secureMessage_stats");
var secureMessageAccRespTime = new Trend("custom_secureMessageAcc_response_time");
var secureMessageAccStats = new Rate("custom_secureMessageAcc_stats");

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
        secure_message: `${__ENV.ENDPOINT}/api/secure-messaging/secure-messages?`,
        client: 'web',
        device_token: 'YouInvestDeviceToken token=278bc838-b246-4fa7-b066-5e231ebc086e'
    };
    var response;
    initialise();

    let idToken = getToken(user.user, password,config.client);
    login(user,idToken);
    
    group('Secure Message', function () {
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
            `${config.secure_message}dateFrom=${oneYear}&dateTo=${now}&fromDate=${oneYear}&toDate=${now}&include=links&folder=Inbox`,
            tokenParams
        );

        var body = JSON.parse(response.body);        
        // console.log(JSON.stringify(body)) 
        
        check(response, {
            'is status 200': (r) => r.status === 200,
        });

        check(body, {
            'has success in body': (r) => r.success == true,
        });   

        secureMessageRespTime.add(response.timings.duration);
        secureMessageStats.add(1);
    });  
    
    group('Secure Message for an Account', function () {
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
            `${config.secure_message}dateFrom=${oneYear}&dateTo=${now}&fromDate=${oneYear}&toDate=${now}&include=links&folder=Inbox&account=${user.account}`,
            tokenParams
        );

        var body = JSON.parse(response.body);  
        check(response, {
            'is status 200': (r) => r.status === 200,
        });

        check(body, {
            'has success in body': (r) => r.success == true,
        });   

        secureMessageAccRespTime.add(response.timings.duration);
        secureMessageAccStats.add(1);
    });   

    logOut();

}

export function handleSummary(data) {
    return {
      "Secure-Message.html": htmlReport(data),
       stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}