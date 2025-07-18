import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group, fail, sleep } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var researchRespTime = new Trend("custom_research_response_time");
var researchStats = new Rate("custom_research_stats");

export const options = {
    stages: [
        { duration: '2m', target: 5 },
        // { duration: '2m', target: 500 },
        // { duration: '1m', target: 1000 },
        // { duration: '2m', target: 2000 },
        // { duration: '2m', target: 200 },
        // { duration: '2m', target: 1 },
    ],
    thresholds: {
        checks: ['rate>=1']
      },
};

const codes = JSON.parse(open("../../data/marketcodes.json"));
const funds = JSON.parse(open("../../data/marketcodes_fund.json"));

export default function () {

    let code = codes[Math.floor(Math.random() * codes.length)]
    let fund = funds[Math.floor(Math.random() * funds.length)]

    if (__ENV.ENDPOINT === undefined) {
        fail("Environment: ENDPOINT must be set");
    }

    var config = {
        endpoint: `${__ENV.ENDPOINT}`,
        research: `${__ENV.ENDPOINT}market-research/${code}`,
        researchFund: `${__ENV.ENDPOINT}research/sub/${fund}/portfolio`,
        client: 'web',
        device_token: 'YouInvestDeviceToken token=278bc838-b246-4fa7-b066-5e231ebc086e'
    };

    var response;
    if(Math.random()<0.5){
        group('Research Instruments', function () {
        
            let tokenParams = {
                headers: {
                    'x-auth-ajb': config.device_token,
                },
                redirects: 0,
                responseType: "text"
            };
    
            response = http.get(
                config.research,
                tokenParams
            );
            if (response.status != 200) { 
                console.error(`status: ${JSON.stringify(response.status)} & Error url - ${response.url}`);
            }

            check(response, {
                'is status 200': (r) => r.status === 200,
            });
            check(response, {
                'has body': (r) => r.body,
            });
            researchRespTime.add(response.timings.duration);
            researchStats.add(1);
        });
    }
    else{
        group('Research Funds', function () {
        
            let tokenParams = {
                headers: {
                    'x-auth-ajb': config.device_token,
                },
                redirects: 0,
                responseType: "text"
            };
    
            response = http.get(
                config.research,
                tokenParams
            );
            if (response.status != 200) { 
                console.error(`status: ${JSON.stringify(response.status)} & Error url - ${response.url}`);
            }
            check(response, {
                'is status 200': (r) => r.status === 200,
            });
            check(response, {
                'has body': (r) => r.body,
            });                  
            researchRespTime.add(response.timings.duration);
            researchStats.add(1);
        });
    }
}
export function handleSummary(data) {
    return {
      "Research_Performance_Test.html": htmlReport(data),
       stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}