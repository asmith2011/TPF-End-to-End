import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group, fail, sleep } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var portfolioRespTime = new Trend("custom_portfolio_response_time");
var portfolioStats = new Rate("custom_portfolio_stats");

var productPortfolioRespTime = new Trend("custom_productPortfolio_response_time");
var productPortfolioStats = new Rate("custom_productPortfolio_stats");

export const options = {
    stages: [
        { duration: '2m', target: 30 },
    //     { duration: '2m', target: 40 },
    //     { duration: '5m', target: 60 },
    //     { duration: '1m', target: 20 },
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
        logout_endpoint: `${__ENV.ENDPOINT}/api/user/logout`,
        token_endpoint: `${__ENV.ENDPOINT}/api/user/wso2-tokens`,
        login_endpoint: `${__ENV.ENDPOINT}/api/user/wso2-login`,
        account_portfolio: `${__ENV.ENDPOINT}/api/account/consolidated-portfolio`,
        product_portfolio: `${__ENV.ENDPOINT}/api/account/portfolio?account=${user.account}&force=true`,
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
            `username=${user.user}&password=${password}&client=${config.client}`,
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
    });

    if(Math.random()<0.5){
        group('Consolidated Portfolio', function () {
            
            let tokenParams = {
                headers: {
                    'x-auth-ajb': config.device_token,
                },
                redirects: 0,
                responseType: "text"
            };

            response = http.get(
                config.account_portfolio,
                tokenParams
            );

            check(response, {
                'is status 200': (r) => r.status === 200,
            });

            check(response, {
                'has body': (r) => r.body,
            });
            // var body = JSON.parse(response.body);
            // if(body.data.hasOwnProperty('items')){
            //     if(body.data.items[0].instrument.quote){
            //         const lastQuote = Math.floor(new Date().getTime() / 1000)-(86400*3)//Timestamp should be less than 3 days old
            //         check(body, {
            //             'has recent quote time': (r) => r.data.items[0].instrument.quote.time > lastQuote,
            //         });
            //     }
            // }
            portfolioRespTime.add(response.timings.duration);
            portfolioStats.add(1);
        });
    }
    else{
        group('Product Portfolio', function () {  
            let tokenParams = {
                headers: {
                    'x-auth-ajb': config.device_token,
                },
                redirects: 0,
                responseType: "text"
            };

            response = http.get(
                config.product_portfolio,
                tokenParams
            );

            check(response, {
                'is status 200': (r) => r.status === 200,
            });
            check(response, {
                'has body': (r) => r.body,
            });
            productPortfolioRespTime.add(response.timings.duration);
            productPortfolioStats.add(1);
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
    });

}
export function handleSummary(data) {
    return {
      "Reports/Portfolio_Performance_Test.html": htmlReport(data),
       stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}