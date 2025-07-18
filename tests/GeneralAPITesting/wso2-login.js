import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group, fail, sleep } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

const myTrend = new Trend('my_trend');

// var tokenRespTime = new Trend("custom_token_response_time");
// var tokenStats = new Rate("custom_token_stats");

var loginRespTime = new Trend("custom_login_response_time");
var loginStats = new Rate("custom_login_stats");

var accRespTime = new Trend("custom_accsummary_response_time");
var accStats = new Rate("custom_accsummary_stats");

var logoutRespTime = new Trend("custom_logout_response_time");
var logoutStats = new Rate("custom_logout_stats");

export const options = {
    stages: [
        { duration: '1m', target: 15 },
        // { duration: '2m', target: 40 },
        // { duration: '5m', target: 60 },
        // { duration: '1m', target: 20 },
    ],
    thresholds: {
        checks: ['rate>=1']
      },
};

const users = JSON.parse(open("../../data/wso2-login.json"));

export default function () {

    let user = users.users[__VU - 1];
    let password = users.password;

    if (__ENV.ENDPOINT === undefined) {
        fail("Environment: ENDPOINT must be set");
    }

    var config = {
        endpoint: `${__ENV.ENDPOINT}`,
        logout_endpoint: `${__ENV.ENDPOINT}/api/user/logout`,
        token_endpoint: `${__ENV.ENDPOINT}/api/user/wso2-tokens`,
        login_endpoint: `${__ENV.ENDPOINT}/api/user/wso2-login`,
        account_summary: `${__ENV.ENDPOINT}/api/account/account-summary?include=memo-accounts,raisin-accounts&force=1`,
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
            `username=${user}&password=${password}&client=${config.client}`,
            tokenParams
        );

        check(response, {
            'is status 200': (r) => r.status === 200,
        });

        check(response, {
            'has body': (r) => r.body,
        });

        var body = JSON.parse(response.body);

        response_values.access_token = body.data.access_token;
        response_values.id_token = body.data.id_token;

        check(response_values, {
            'is access_token returned': (r) => r.access_token,
        });

        check(response_values, {
            'is id_token returned': (r) => r.id_token,
        });

        tokenRespTime.add(response.timings.duration);
        tokenStats.add(1);
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

        check(response, {
            'has body': (r) => r.body,
        });

        var body = JSON.parse(response.body);

        try {
            response_values.fullName = body.data.user.fullName;
        } catch (ex) {
            response_values.fullName = null;
        }

        check(response_values, {
            'has user\'s fullname': (r) => r.fullName,
        });

        loginRespTime.add(response.timings.duration);
        loginStats.add(1);
    });

    group('Account Summary', function () {

        let tokenParams = {
            headers: {
                'x-auth-ajb': config.device_token,
            },
            redirects: 0,
            responseType: "text"
        };

        response = http.get(
            config.account_summary,
            tokenParams
        );

        check(response, {
            'is status 200': (r) => r.status === 200,
        });

        check(response, {
            'has body': (r) => r.body,
        });

        var body = JSON.parse(response.body);

        try {
            response_values.totalValuation = body.data.accounts[0].totalValuation;
        } catch (ex) {
            response_values.fullName = null;
        }

        check(response_values, {
            'has user\'s Account totalValuation': (r) => r.totalValuation,
        });

        sleep(2);
        accRespTime.add(response.timings.duration);
        accStats.add(1);
    });

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

        check(response, {
            'has body': (r) => r.body,
        });

        logoutRespTime.add(response.timings.duration);
        logoutStats.add(1);
    });

}

export function handleSummary(data) {    
    return {
      "Reports/WS02_AccountSummary_Test.html": htmlReport(data),
       stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}