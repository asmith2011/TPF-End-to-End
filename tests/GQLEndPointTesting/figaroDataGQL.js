import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group, fail } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var figaroDataRespTime = new Trend("custom_figaroData_response_time");

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
    const instruments = ["LSE:BARC","EURONEXT:HEIO","LSE:RST","XSTO:VOLV A","LSE:TSL3"] //Update to pull from JSON / CSV if there are more combinations 

    export default function () {
    
    if (__ENV.ENDPOINT === undefined) {
        fail("Environment: ENDPOINT must be set");
    } 
    
    var res;
    instruments.forEach(function(name){    
       group('Figaro Datapoints Validation', function () {
       const query = `query {quote(identifier: "${name}",includeFigaroData:true) {
        symbol
            
        figaroData{
          sippEligibility
          isaEligibility
        }

        ...on Equity {
            isin
            sedol
            askPrice
            bidPrice
        }
      }
    }`;
        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers.header1,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });
        // console.log(`${name}--${body.data.quote.figaroData.isaEligibility}--${body.data.quote.figaroData.sippEligibility}--`)
        if(name=='LSE:TSL3'){
          check(body.data.quote.figaroData.sippEligibility, {
                      'sippEligibility is false': (s) => s == false,
                    });
          check(body.data.quote.figaroData.isaEligibility, {
                      'isaEligibility is true': (s) => s == true,
                    });
        }
        else {
          check(body.data.quote.figaroData.sippEligibility, {
                      'sippEligibility is true': (s) => s == true,
                    });

          check(body.data.quote.figaroData.isaEligibility, {
                      'isaEligibility is true': (s) => s == true,
                    });
        }
        figaroDataRespTime.add(res.timings.duration);
    });

  }) 
}
export function handleSummary(data) {
    return {
      "GQLReports/FigaroDataGQL Test.html": htmlReport(data),
       stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}