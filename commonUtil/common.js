import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group, fail, sleep } from 'k6';

var tokenRespTime = new Trend("custom_token_response_time");
var tokenStats = new Rate("custom_token_stats");

var loginRespTime = new Trend("custom_login_response_time");
var loginStats = new Rate("custom_login_stats");

var accRespTime = new Trend("custom_accsummary_response_time");
var accStats = new Rate("custom_accsummary_stats");

var usrRespTime = new Trend("custom_usrdetails_response_time");
var usrStats = new Rate("custom_usrdetails_stats");

var logoutRespTime = new Trend("custom_logout_response_time");
var logoutStats = new Rate("custom_logout_stats");

let config;
var response_values = {};
var response;

export function initialise() {
    config = {
        endpoint: `${__ENV.ENDPOINT}`,
        logout_endpoint: `${__ENV.ENDPOINT}/api/user/logout`,
        token_endpoint: `${__ENV.ENDPOINT}/api/user/wso2-tokens`,
        login_endpoint: `${__ENV.ENDPOINT}/api/user/wso2-login`,
        user_details: `${__ENV.ENDPOINT}/api/user/details`,
        account_summary: `${__ENV.ENDPOINT}/api/account/account-summary?include=memo-accounts,raisin-accounts&force=1`,
        device_token: 'YouInvestDeviceToken token=278bc838-b246-4fa7-b066-5e231ebc086e'
    };

};

export function getToken(user, password,client) {
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
            `username=${user}&password=${password}&client=${client}`,
            tokenParams
        );

        check(response, {
            'is status 200': (r) => r.status === 200,
        });

        check(response, {
            'has body': (r) => r.body,
        });

        try {
            var body = JSON.parse(response.body);
            response_values.access_token = body.data.access_token;
            response_values.id_token = body.data.id_token;
          }
          catch(err) {
            console.log(`Error in generating token for ${user}`)
            console.log(err)
            console.log(JSON.stringify(response.body))
          } 
   

        check(response_values, {
            'is access_token returned': (r) => r.access_token,
        });

        check(response_values, {
            'is id_token returned': (r) => r.id_token,
        });

        tokenRespTime.add(response.timings.duration);
        // tokenStats.add(1);
    });
    return response_values.id_token;
}

export function login(user,idToken) {
    group('WSo2 login', function () {
        let tokenParams = {
            headers: {
                'X-Auth-AJB': config.device_token,
                'X-Auth-WSO2': 'token=' + idToken
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

        if(response.status!=200){    
            console.log(`Account failing in WS02--------------- ${user}`);
            console.log(`Token failing in WS02--------------- ${idToken}`);
        }

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
        // loginStats.add(1);
    });
}

export function accountSummary() {
    let accountsArray = new Array();
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

        for (let i = 0; i < body.data.accounts.length; i++) {
            accountsArray[i] = body.data.accounts[i].number;
        }
    });
    sleep(2);
    accRespTime.add(response.timings.duration);
    accStats.add(1);
    return accountsArray;
};

export function userDetails() { 

    group('User Details', function () {

        let tokenParams = {
            headers: {
                'x-auth-ajb': config.device_token,
            },
            redirects: 0,
            responseType: "text"
        };

        response = http.get(
            config.user_details,
            tokenParams
        );

        check(response, {
            'is status 200': (r) => r.status === 200,
        });

        check(response, {
            'has body': (r) => r.body,
        });
    });
    sleep(2);
    usrRespTime.add(response.timings.duration);
    usrStats.add(1);
    return response.body;
};

export function logOut() {
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
        checkStatus(response,200)

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

export function checkStatus(response,statusCode) {
    if(response.status!=statusCode){
        console.log(`Status ${response.status} given`)
        console.log(`Response body --${response.body}`) 
    }
}