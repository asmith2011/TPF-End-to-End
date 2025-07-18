import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group } from 'k6';
import { getCSVData } from "../../commonUtil/DataParmetrisation.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var directorDealRespTime = new Trend("directorDeal_response_time");
var directorDealStats = new Rate("directorDeal_stats");

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

  group('Director Deal Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var year=obj.year;
      var IsdirectorDealEnabled = obj.isDirectorDealsCEF;

      if (IsdirectorDealEnabled === 'true') {
        const query = `query {directorDeals( identifier:"${identifier}", year:${year}) {
          name
          isOfficer
          isDirector
          officerTitle
          ownershipType
          isCurrent
          sharesOwned
          sharesOwnedPct
          transactionDate
          transactionAmount
          transactionPrice
          transactionValue
          transactionADCode
          filingDate
          notificationDate
          isNew
          isExHolding
          transactionType
          notes
          status
          currency
        }
        } `;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        for (let i = 0; i < body.data.directorDeals.length; i++) {
          check(body.data.directorDeals[i].name, {
            'has name not null': (value) => value !== null && value !== "" && value!==undefined
          });
          check(body.data.directorDeals[i].isOfficer, {
            'has isOfficer ': (value) => (value ===true || value===false) && value!==null
          });
          check(body.data.directorDeals[i].isDirector, {
            'has isDirector ': (value) => (value ===true || value===false) && value!==null
          });
          check(body.data.directorDeals[i].isCurrent, {
            'has isCurrent ': (value) => value ===true || value===false || value!==undefined || value===null
          });
          check(body.data.directorDeals[i].isNew, {
            'has isNew ': (value) => value ===true || value===false || value!==undefined || value===null
          });
          check(body.data.directorDeals[i].isExHolding, {
            'has isExHolding ': (value) => value ===true || value===false || value!==undefined || value===null
          });
          check(body.data.directorDeals[i].officerTitle, {
            'has officerTitle not null': (value) => value !== "" || value!==undefined || value === null 
          });
          check(body.data.directorDeals[i].ownershipType, {
            'has ownershipType': (value) => value !== null && value !== "" && value!==undefined
          });
          check(body.data.directorDeals[i].sharesOwned, {
            'has sharesOwned': (value) => value !== null && value !== "" && value!==undefined
          });
          check(body.data.directorDeals[i].sharesOwnedPct, {
            'has sharesOwnedPct': (value) => value !== null && value !== "" && value!==undefined
          });
          check(body.data.directorDeals[i].transactionDate, {
            'has transactionDate': (value) => value !== "" || value!==undefined || value === null 
          });
          check(body.data.directorDeals[i].transactionAmount, {
            'has transactionAmount': (value) => value !== "" || value!==undefined || value === null 
          });
          check(body.data.directorDeals[i].transactionPrice, {
            'has transactionPrice': (value) => value !== "" || value!==undefined || value === null 
          });
          check(body.data.directorDeals[i].transactionValue, {
            'has transactionValue': (value) => value !== "" || value!==undefined || value === null 
          });
          check(body.data.directorDeals[i].transactionADCode, {
            'has transactionADCode': (value) => value !== null && value !== "" && value!==undefined
          });
          check(body.data.directorDeals[i].filingDate, {
            'has filingDate': (value) => value !== null && value !== "" && value!==undefined
          });
          check(body.data.directorDeals[i].notificationDate, {
            'has notificationDate': (value) => value !== "" || value!==undefined || value===null
          });
          check(body.data.directorDeals[i].transactionType, {
            'has transactionType': (value) => value !== "" || value!==undefined || value === null 
          });
          check(body.data.directorDeals[i].notes, {
            'has notes': (value) => value !== "" || value!==undefined || value === null 
          });
          check(body.data.directorDeals[i].status, {
            'has status not null': (value) => value !== null && value !== "" && value!==undefined
          });
          check(body.data.directorDeals[i].currency, {
            'has currency not null': (value) => value !== null && value !== "" && value!==undefined
          });
        }
      }
    }
    directorDealRespTime.add(res.timings.duration);
    directorDealStats.add(1);
  });
}

export function handleSummary(data) {
  return {
    "GQLReports/directorDealsGQL Test.html": htmlReport(data),
     stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}