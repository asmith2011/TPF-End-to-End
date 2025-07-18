import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var acceptingSedolRespTime = new Trend("acceptingSedol_response_time");
var acceptingSedolStats = new Rate("acceptingSedol_stats");

const gqlHeaders = {
    'Content-Type': 'application/json',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept': 'application/json',
    'Connection': 'keep-alive',
    'DNT': '1'
};

export const options = {
    thresholds: {
      checks: ['rate>=1']
    },
  };

export default function () {
    if (__ENV.ENDPOINT === undefined) {
        fail("Environment: ENDPOINT must be set");
    }

    if (__ENV.APIENDPOINT === undefined) {
        fail("Environment: API ENDPOINT must be set");
    }

    if (__ENV.IDENTIFIER === undefined) {
        fail("Environment: IDENTIFIER must be set");
    }

    var APIConfig = {
        search_instrument: `${__ENV.APIENDPOINT}/api/securities/search?search=`,
        device_token: 'YouInvestDeviceToken token=278bc838-b246-4fa7-b066-5e231ebc086e'
    };
    var APIResponse;
    var gqlRes;

    let tokenParams = {
        headers: {
            'x-auth-ajb': APIConfig.device_token,
        },
        redirects: 0,
        responseType: "text"
    };

    group('Accepting Sedol as an inbound parameter', function () {
        const query = `query {
        portfolio(identifier:"${__ENV.IDENTIFIER}") {
        top10Holdings{
				id
          isin
          name
          sedol
        }
      }
    }`;

        gqlRes = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
            headers: gqlHeaders,
        });

        var body = JSON.parse(gqlRes.body);

        check(gqlRes, {
            'is status 200': (r) => r.status === 200,
        });

        for (let i = 0; i < body.data.portfolio.top10Holdings.length; i++) {
            if (body.data.portfolio.top10Holdings[i].isin != null) {
                APIResponse = http.get(
                    APIConfig.search_instrument + body.data.portfolio.top10Holdings[i].isin,
                    tokenParams
                );
                var APIbody = JSON.parse(APIResponse.body);
                if (APIbody.data.results.length > 0) {
                    check(APIbody.data.results[0].marketCode, {
                        'has marketCode not null': (marketCodeValue) => marketCodeValue != null && marketCodeValue != ""
                    });
                }
            }
            if (body.data.portfolio.top10Holdings[i].isin == null && body.data.portfolio.top10Holdings[i].sedol != null) {
                APIResponse = http.get(
                    APIConfig.search_instrument + body.data.portfolio.top10Holdings[i].sedol,
                    tokenParams
                );
                var APIbody = JSON.parse(APIResponse.body);

                if (APIbody.data.results.length > 0) {
                    check(APIbody.data.results[0].marketCode, {
                        'has marketCode not null': (marketCodeValue) => marketCodeValue != null && marketCodeValue != ""
                    });
                }
            }
        }

        acceptingSedolRespTime.add(APIResponse.timings.duration);
        acceptingSedolStats.add(1);
    });
}

export function handleSummary(data) {
    return {
      "Reports/accepting-sedol.html": htmlReport(data),
       stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}