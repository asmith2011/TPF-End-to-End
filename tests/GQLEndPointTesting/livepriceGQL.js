import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group, fail } from 'k6';
import { SharedArray } from 'k6/data';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";


var livePriceRespTime = new Trend("custom_livePrice_response_time");
var delayedPriceRespTime = new Trend("custom_delayedPrice_response_time");

export const options = {
    stages: [
        { duration: '1m', target: 8 },  
        // { duration: '26m', target: 20 }, 
        // { duration: '2m', target: 0 }, 
    ],
    thresholds: {
        http_req_failed: ['rate<0.01'], // http errors should be less than 1%
        http_req_duration: ['p(95)<700'], // 95% of requests should be below 700ms
       },
};
    const headers = JSON.parse(open("../../data/headers.json"));
    const instruments = new SharedArray('List of Instruments', function () {
        return JSON.parse(open("../../data/testData.json")).instruments;
    });

    export default function () {
    
    if (__ENV.ENDPOINT === undefined) {
        fail("Environment: ENDPOINT must be set");
    } 
    
    var res;
    instruments.forEach(function(sym){   

        group('Delayed Price for Instruments in UTC', function () {
          const query = `query {
              quotes(identifiers:
                "${sym}"
              ){ 
                marketCode
                exchangeTimezoneOriginal
                updateTimeOriginal
                exchangeTimezone
                  updateTime
                priceQuality
              }
            }`;
    
            res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
              headers: headers.header1,
            });
    
            var body = JSON.parse(res.body);

            check(res, {
              'is status 200': (r) => r.status === 200,
            });
            check(body.data.quotes[0].exchangeTimezone, {
              'is timezone UTC': (value) => value === "UTC"
            });
            check(body.data.quotes[0].priceQuality, {
              'is Price quality delayed': (value) => value === "EOD"
            });
         
          delayedPriceRespTime.add(res.timings.duration);
      });

  }) 
}
export function handleSummary(data) {
    return {
      "GQLReports/LivePrices.html": htmlReport(data),
       stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}