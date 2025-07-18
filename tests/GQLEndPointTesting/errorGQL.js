import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";


const headers = JSON.parse(open("../../data/headers.json"));
var res;

export const options = {
  thresholds: {
    checks: ['rate>=1']
  },
};

export default function () {
  if (__ENV.ENDPOINT === undefined) {
    fail("Environment: ENDPOINT must be set");
  }  

  group('Non sentry error example', function () {
      const query = `query {
        quote(identifier: "LSE:YODA") {
            __typename
            name
            nameShort
            symbol
    
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
        console.log(body)

        check(body.errors[0].message, {
          'has message': (value) => value == "Instrument cannot be found by 'LSE:YODA'"
        });

        check(body.errors[0].extensions.code, {
          'has error code': (value) => value == "INSTRUMENT_NOT_FOUND"
        });        
  });

  group('Sentry error example', function () {
      const query = ` query { quotes(identifiers: null) { dayChange lastPrice marketCode name currency } }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers.header1,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });
        console.log(body)

        check(body.errors[0].message, {
          'has message': (value) => value == "Cannot read properties of null (reading 'length')"
        });

        check(body.errors[0].extensions.code, {
          'has error code': (value) => value == "INTERNAL_SERVER_ERROR"
        });        
  });

  group('Non sentry exception example', function () {
    const query = `query {
      quote(identifier: "LSE:LIVE") {
          __typename
          name
          nameShort
          symbol
  
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
      // console.log(body)

      check(body.errors[0].message, {
        'has message': (value) => value.includes("Calling the endpoint get: quote/cef with the following params failed")
      });

      check(body.errors[0].extensions.code, {
        'has error code': (value) => value == "API_CALL_FAILURE;"
      });    
      
      check(body.errors[0].message, {
        'has null username': (value) => value.includes("\"username\":null")
      });

      check(body.errors[0].message, {
        'has null password': (value) => value.includes("\"password\":null")
      });
});

}

export function handleSummary(data) {
  return {
    "GQLReports/errorGQL Test.html": htmlReport(data),
     stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}