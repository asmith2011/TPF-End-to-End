import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group } from 'k6';
import { getCSVData } from "../../commonUtil/DataParmetrisation.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var operatingCashFlowRespTime = new Trend("operatingCashFlow_response_time");
var operatingCashFlowStats = new Rate("operatingCashFlow_stats");

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

  group('OperatingCashFlow Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isCashFlowEnabled = obj.isCashFlowEnabled;
      var startDate = obj.startDate;
      var endDate = obj.endDate;
      var statementType = obj.statementType;
      var dataType = obj.dataType;

      if (isCashFlowEnabled === 'true') {
        const query = `query {cashFlow( startDate:"${startDate}", endDate:"${endDate}", identifier:"${identifier}", statementType:${statementType}, dataType:${dataType}) {
      operatingCashFlow
      }
      } `;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);
        console.log('EXAMPLE & response')
        console.log(JSON.stringify(input[i]))
        console.log(body)
        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        for (let i = 0; i < body.data.cashFlow.length; i++) {
          check(body.data.cashFlow[i].operatingCashFlow, {
            'has operatingCashFlow  => not null': (value) => value != undefined && value != null
          });
        }
      }
    }
    operatingCashFlowRespTime.add(res.timings.duration);
    operatingCashFlowStats.add(1);
  });
}
export function handleSummary(data) {
  return {
    "GQLReports/cashFlowGQL Test.html": htmlReport(data),
     stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}