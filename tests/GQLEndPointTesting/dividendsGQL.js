import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group, fail } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var dividendsRespTime = new Trend("custom_dividends_response_time");

export const options = {
    stages: [
        { duration: '1m', target: 8 }
    ],
    thresholds: {
        http_req_failed: ['rate<0.01'], // http errors should be less than 1%
        http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2000ms
       },
};
    const headers = JSON.parse(open("../../data/headers.json"));
    const instruments = JSON.parse(open("../../data/testData.json")).instrumentAllExchanges;
    
    export default function () {
    
    if (__ENV.ENDPOINT === undefined) {
        fail("Environment: ENDPOINT must be set");
    } 
    
    var res;
    instruments.forEach(function(instrument){    
      group('Dividends of instruments', function () {
       console.log(`Verify dividend of instrument - ${instrument}`)
        const query = `query {
          dividends(identifier: "${instrument}",
            exDividendFrom: "01/2017",
            exDividendTo: "05/2023") {
              declarationDate
              recordDate
              payDate
              amount
              currency
            amountFormatted
          }
        }`
        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers.header1,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });
        if(JSON.stringify(body).length >25){ // Further tests on instrument that have declared dividends
          console.log(`${instrument} - has dividend -- ${body.data.dividends[0].amountFormatted}`)

          check(body.data.dividends[0].amountFormatted.slice(0, -1), {
            'is dividend more than 0': (div) => div>0,
          });

          check(body.data.dividends[0].amountFormatted, {
            'is dividend having currency': (div) => div.includes('c')||div.includes('p'),
          });
        }
    
        dividendsRespTime.add(res.timings.duration);
    });


  }) 
}

export function handleSummary(data) {
    return {
      "GQLReports/DividendsGQL Test.html": htmlReport(data),
       stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}