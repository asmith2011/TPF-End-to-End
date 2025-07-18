import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group } from 'k6';
import { getCSVData } from "../../commonUtil/DataParmetrisation.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var shareHolderInformationRespTime = new Trend("shareHolderInformation_response_time");
var shareHolderInformationstats = new Rate("shareHolderInformation_stats");

const headers = {
  'Content-Type': 'application/json',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept': 'application/json',
  'Connection': 'keep-alive',
  'DNT': '1'
};

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
  var input = getCSVData();

  group('Share Holder Information Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var IsShareHolderInformationCEF = obj.isShareHolderInformationCEF;

      if (IsShareHolderInformationCEF === 'true') {
        const query = `query {shareholderInformation( identifier:"${identifier}") {
        insiders{
        name
        isActive
        }
        }
        } `;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        for (let i = 0; i < body.data.shareholderInformation.insiders.length; i++) {
          check(body.data.shareholderInformation.insiders[i].name, {
            'has name not null': (value) => value !== null && value !== "" && value !== undefined
          });

          check(body.data.shareholderInformation.insiders[i].isActive, {
            'has isActive with value true or false': (value) => value === true || value===false
          });
        }
      }
    }
    shareHolderInformationRespTime.add(res.timings.duration);
    shareHolderInformationstats.add(1);
  });
}

export function handleSummary(data) {
  return {
    "GQLReports/shareHolderGQL Test.html": htmlReport(data),
     stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}