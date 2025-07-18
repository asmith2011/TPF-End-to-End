import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group, fail } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var indexTime = new Trend("custom_indexTime_response_time");

export const options = {
    stages: [
        { duration: '1m', target: 8 }
    ],
    thresholds: {
        http_req_failed: ['rate<0.01'], // http errors should be less than 1%
        http_req_duration: ['p(95)<3000'], // 95% of requests should be below 3000ms
       },
};
    const headers = JSON.parse(open("../../data/headers.json"));
    const indicesSymbol = JSON.parse(open("../../data/testData.json")).indicesSymbol;
    
    export default function () {
    
    if (__ENV.ENDPOINT === undefined) {
        fail("Environment: ENDPOINT must be set");
    } 
    
    var res;
    
    indicesSymbol.forEach(index => {
          group('Returns on Indices', function () {
              console.log(`**Verify the performance of ${index} **`)
              const query = `query {
                quote(identifier: "${index}") {
                    __typename            
                    ...on Index {
                      dayChange
                      oneYearPerformance
                      yearToDatePerformance
                      dayLowPrice
                    }
                }
            }`
              res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
                headers: headers.header1,
              });
      
              var body = JSON.parse(res.body);
              check(res, {
                'is status 200': (r) => r.status === 200,
              })
              check(body.data.quote.dayChange, {
                'day change is not null': (p) => p != null,
              })
              check(body.data.quote.oneYearPerformance, {
                'one Year Performance is not null': (p) => p != null,
              })
              check(body.data.quote.yearToDatePerformance, {
                'year To Date Performance is not null': (p) => p != null,
              })
              check(body.data.quote.dayLowPrice, {
                'day Low Price is not null': (p) => p != null,
              })

              indexTime.add(res.timings.duration)
        })  
      })
}
export function handleSummary(data) {
    return {
      "GQLReports/indexReturnsGQL Test.html": htmlReport(data),
       stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}