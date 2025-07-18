import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group, fail, sleep } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var drupalRespTime = new Trend("drupal_response_time");
var drupalStats = new Rate("drupal_stats");

const drupalPages = JSON.parse(open("../../data/drupal.json"));
// If need to test on all pages change the file in above line to drupalAllPages

export const options = {
    thresholds: {
      checks: ['rate>=1']
    },
  };

export default function () {
    var config = {        
        device_token: 'YouInvestDeviceToken token=278bc838-b246-4fa7-b066-5e231ebc086e'
    };
    var response;

    if (__ENV.ENDPOINT === undefined) {
        fail("Environment: ENDPOINT must be set");
    }

    drupalPages.forEach(page=>{
        group('Drupal page test', function () {

            let tokenParams = {
                headers: {
                    'x-auth-ajb': config.device_token,
                },
                redirects: 0,
                responseType: "text"
            };
            page=`${__ENV.ENDPOINT}${page}`            
            response = http.get(
                page,
                tokenParams
            );
            if(response.status!=200&&response.status!=403&&response.status!=301){
                console.log(`Error ${response.status} on page - ${page}`)
            }
            check(response, {
                'is status 200 or 403 or 301': (r) => r.status === 200 || r.status === 403 ||r.status===301,        
                'has body lenght > 0': (r) => r.body.length>0,        
            });
    
            drupalRespTime.add(response.timings.duration);
            drupalStats.add(1);
        });
    });
    
}


export function handleSummary(data) {
    return {
      "Reports/drupal.html": htmlReport(data),
       stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}