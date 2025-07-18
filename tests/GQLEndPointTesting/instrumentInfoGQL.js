import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group } from 'k6';
import { getCSVData } from "../../commonUtil/DataParmetrisation.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var instrumentInfoRespTime = new Trend("instrumentInfo_response_time");
var instrumentInfostats = new Rate("instrumentInfo_stats");

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

  group('Instrument Info Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var IsinstrumentInfo = obj.IsinstrumentInfo;

      if (IsinstrumentInfo === 'true') {
        const query = `query {instrumentInfo( identifier:"${identifier}") {
          sidDocument,
          sidDocumentUrl
        }
        } `;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        check(body.data.instrumentInfo.sidDocument, {
          'has sidDocument': (value) => value === null
        });

        check(body.data.instrumentInfo.sidDocumentUrl, {
          'has sidDocumentUrl': (value) => value === null
        });
      }
    }
    instrumentInfoRespTime.add(res.timings.duration);
    instrumentInfostats.add(1);
  });
}

export function handleSummary(data) {
  return {
    "GQLReports/instrumentInfoGQL Test.html": htmlReport(data),
     stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}