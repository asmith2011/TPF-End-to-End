import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group } from 'k6';
import { getCSVData } from "../../commonUtil/DataParmetrisation.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var annualReturnRespTime = new Trend("annualReturn_response_time");
var annualReturnStats = new Rate("annualReturn_stats");

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

  group('Annual Return Category Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isAnnualReturnEnabled = obj.isAnnualReturnEnabled;
      var startYear = obj.startYear;
      var endYear = obj.endYear;

      if (isAnnualReturnEnabled === 'true') {
        const query = `query {
      annualReturn( startYear:"${startYear}", endYear:"${endYear}", identifier: "${identifier}") {
      reportDate
      totalAnnualReturn
      } }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        for (let i = 0; i < body.data.annualReturn.length; i++) {
          let reportDate = body.data.annualReturn[i].reportDate;
          let totalAnnualReturn = body.data.annualReturn[i].totalAnnualReturn;

          check(reportDate, {
            'has reportDate  => not null': (reportDateValue) => reportDateValue != "" && reportDateValue != null
          });
          check(totalAnnualReturn, {
            'has totalAnnualReturn  => not null': (totalAnnualReturnValue) => totalAnnualReturnValue != undefined && totalAnnualReturnValue != null
          });
        }
      }
    }
    annualReturnRespTime.add(res.timings.duration);
    annualReturnStats.add(1);
  });
}

export function handleSummary(data) {
  return {
    "GQLReports/annualReturnGQL Test.html": htmlReport(data),
     stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}