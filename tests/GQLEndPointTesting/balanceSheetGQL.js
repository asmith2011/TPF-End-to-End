import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group } from 'k6';
import { getCSVData } from "../../commonUtil/DataParmetrisation.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var AssetsRespTime = new Trend("Assets_response_time");
var AssetsStats = new Rate("Assets_stats");
var shareCapitalSheetRespTime = new Trend("shareCapital_response_time");
var shareCapitalSheetStats = new Rate("shareCapital_stats");

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

  group('totalCurrentAssets Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {      
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isBalanceSheetEnabled = obj.IsBalanceSheetEnabled;
      var startDate = obj.startDate;
      var endDate = obj.endDate;
      var statementType = obj.statementType;
      var dataType = obj.dataType;

      if (isBalanceSheetEnabled === 'true') {
        const query = `query {balanceSheet( startDate:"${startDate}", endDate:"${endDate}", identifier:"${identifier}", statementType:${statementType}, dataType:${dataType}) {
        assets{
        currentAssets
        heldForDisposal
        totalFixedAssets
        intangibleAssets
        tangibleAssets
        investments
        otherAssets
        totalCurrentAssets
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

        for (let i = 0; i < body.data.balanceSheet.length; i++) {
          check(body.data.balanceSheet[i], {
            'has currentAssets not null': (balanceSheetcurrentAssets) => balanceSheetcurrentAssets.assets.currentAssets != null && balanceSheetcurrentAssets.assets.currentAssets != ""
          });
          check(body.data.balanceSheet[i], {
            'has helForDisposal not null': (balanceSheethelForDisposal) => balanceSheethelForDisposal.assets.heldForDisposal != null && balanceSheethelForDisposal.assets.heldForDisposal != ""
          });
          if (body.data.balanceSheet[i].assets.heldForDisposal == 'n/a' || body.data.balanceSheet[i].assets.currentAssets == 'n/a') {
            check(body.data.balanceSheet[i], {
              'has totalCurrentassets = n/a': (totalCurrentassetsValue) => totalCurrentassetsValue.assets.totalCurrentAssets == 'n/a'
            });
          } else {
            check(body.data.balanceSheet[i], {
              'has (totalCurrentassets = currentAssets – heldForDisposal)': (balanceSheettotalCurrentAssets) => balanceSheettotalCurrentAssets.assets.currentAssets - balanceSheettotalCurrentAssets.assets.heldForDisposal == balanceSheettotalCurrentAssets.assets.totalCurrentAssets
            });
          }
          if (body.data.balanceSheet[i].assets.totalFixedAssets == 'n/a' || body.data.balanceSheet[i].assets.intangibleAssets == 'n/a' || body.data.balanceSheet[i].assets.tangibleAssets == 'n/a' || body.data.balanceSheet[i].assets.otherAssets == 'n/a') {
            check(body.data.balanceSheet[i], {
              'has otherAssets = n/a': (balanceSheetOtherAssets) => balanceSheetOtherAssets.assets.otherAssets == 'n/a'
            });
          } else {
            check(body.data.balanceSheet[i], {
              'has otherAssets = totalfixedAssets-intangibleAssets-tangilbleAssets-investments': (balanceSheetOtherAssets) => balanceSheetOtherAssets.assets.totalFixedAssets - balanceSheetOtherAssets.assets.intangibleAssets - balanceSheetOtherAssets.assets.tangibleAssets - balanceSheetOtherAssets.assets.investments == balanceSheetOtherAssets.assets.otherAssets
            });
          }
        }
      }
    }
    AssetsRespTime.add(res.timings.duration);
    AssetsStats.add(1);
  });
  group('shareCapital Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isBalanceSheetEnabled = obj.IsBalanceSheetEnabled;
      var startDate = obj.startDate;
      var endDate = obj.endDate;
      var statementType = obj.statementType;
      var dataType = obj.dataType;

      if (isBalanceSheetEnabled === 'true') {
        const query = `query {balanceSheet(startDate:"${startDate}", endDate:"${endDate}", identifier:"${identifier}", statementType:${statementType}, dataType:${dataType}) {
      equity{
        stock
        sharePremium
        shareCapital
        treasuryStock
        retainedEarnings
        otherReserves
        totalReserves
        }}} `;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        for (let i = 0; i < body.data.balanceSheet.length; i++) {

          check(body.data.balanceSheet[i], {
            'has stock not null': (balanceSheetStock) => balanceSheetStock.equity.stock != null && balanceSheetStock.equity.stock != ""
          });
          check(body.data.balanceSheet[i], {
            'has sharePremium not null': (balanceSheetSharePremium) => balanceSheetSharePremium.equity.sharePremium != null && balanceSheetSharePremium.equity.sharePremium != ""
          });
          if (body.data.balanceSheet[i].equity.stock == 'n/a' || body.data.balanceSheet[i].equity.sharePremium == 'n/a') {
            check(body.data.balanceSheet[i], {
              'has shareCapital = n/a': (balanceSheetShareCapital) => balanceSheetShareCapital.equity.shareCapital == 'n/a'
            });
          }
          else {
            check(body.data.balanceSheet[i], {
              'has (shareCapital = stock + sharePremium)': (balanceSheetShareCapital) => Number(balanceSheetShareCapital.equity.stock) + Number(balanceSheetShareCapital.equity.sharePremium) == balanceSheetShareCapital.equity.shareCapital
            });
          }
          check(body.data.balanceSheet[i], {
            'has treasury stock not null': (balanceSheetTreasuryStock) => balanceSheetTreasuryStock.equity.treasuryStock != null && balanceSheetTreasuryStock.equity.treasuryStock != ""
          });
          check(body.data.balanceSheet[i], {
            'has retained earnings not null': (balanceSheetTreasuryRetainedEarnings) => balanceSheetTreasuryRetainedEarnings.equity.retainedEarnings != null && balanceSheetTreasuryRetainedEarnings.equity.retainedEarnings != ""
          });
          check(body.data.balanceSheet[i], {
            'has other reserves not null': (balanceSheetOtherReserves) => balanceSheetOtherReserves.equity.otherReserves != null && balanceSheetOtherReserves.equity.otherReserves != ""
          });
          if (body.data.balanceSheet[i].equity.treasuryStock == 'n/a' && body.data.balanceSheet[i].equity.retainedEarnings != 'n/a' && body.data.balanceSheet[i].equity.otherReserves != 'n/a') {
            check(body.data.balanceSheet[i], {
              'has totalReserves = retainedEarnings + otherReserves and treasuryStock=n/a': (balanceSheetTotalReserves) => Number(balanceSheetTotalReserves.equity.retainedEarnings) + Number(balanceSheetTotalReserves.equity.otherReserves) == balanceSheetTotalReserves.equity.totalReserves
            });
          }
          else if (body.data.balanceSheet[i].equity.retainedEarnings == 'n/a' && body.data.balanceSheet[i].equity.treasuryStock != 'n/a' && body.data.balanceSheet[i].equity.otherReserves != 'n/a') {
            check(body.data.balanceSheet[i], {
              'has totalReserves = treasuryStock + otherReserves and retainedEarnings=n/a': (balanceSheetTotalReserves) => Number(balanceSheetTotalReserves.equity.treasuryStock) + Number(balanceSheetTotalReserves.equity.otherReserves) == balanceSheetTotalReserves.equity.totalReserves
            });
          }
          else if (body.data.balanceSheet[i].equity.otherReserves == 'n/a' && body.data.balanceSheet[i].equity.retainedEarnings != 'n/a' && body.data.balanceSheet[i].equity.treasuryStock != 'n/a') {
            check(body.data.balanceSheet[i], {
              'has totalReserves = treasuryStock + retainedEarnings and otherReseves=n/a': (balanceSheetTotalReserves) => Number(balanceSheetTotalReserves.equity.treasuryStock) + Number(balanceSheetTotalReserves.equity.retainedEarnings) == balanceSheetTotalReserves.equity.totalReserves
            });
          }
          else if (body.data.balanceSheet[i].equity.retainedEarnings == 'n/a' && body.data.balanceSheet[i].equity.otherReserves == 'n/a' && body.data.balanceSheet[i].equity.treasuryStock != 'n/a') {
            check(body.data.balanceSheet[i], {
              'has totalReserves = treasuryStock ,retainedEarnings = n/a and otherReseves = n/a': (balanceSheetTotalReserves) => Number(balanceSheetTotalReserves.equity.treasuryStock)
            });
          }
          else if (body.data.balanceSheet[i].equity.retainedEarnings == 'n/a' && body.data.balanceSheet[i].equity.treasuryStock == 'n/a' && body.data.balanceSheet[i].equity.otherReserves != 'n/a') {
            check(body.data.balanceSheet[i], {
              'has totalReserves = otherReserves ,retainedEarnings = n/a and treasuryStock = n/a': (balanceSheetTotalReserves) => Number(balanceSheetTotalReserves.equity.otherReserves)
            });
          }
          else if (body.data.balanceSheet[i].equity.otherReserves == 'n/a' && body.data.balanceSheet[i].equity.treasuryStock == 'n/a' && body.data.balanceSheet[i].equity.retainedEarnings != 'n/a') {
            check(body.data.balanceSheet[i], {
              'has totalReserves = retainedEarnings ,otherReserves = n/a and treasuryStock = n/a': (balanceSheetTotalReserves) => Number(balanceSheetTotalReserves.equity.retainedEarnings)
            });
          }
          else {
            check(body.data.balanceSheet[i], {
              'has (totalReserves = treasuryStock + retainedEarnings + otherReserves )': (balanceSheetTotalReserves) => Number(balanceSheetTotalReserves.equity.treasuryStock) + Number(balanceSheetTotalReserves.equity.retainedEarnings) + Number(balanceSheetTotalReserves.equity.otherReserves) == balanceSheetTotalReserves.equity.totalReserves
            });
          }
        }
      }
    }
    shareCapitalSheetRespTime.add(res.timings.duration);
    shareCapitalSheetStats.add(1);
  });
}
export function handleSummary(data) {
  return {
    "GQLReports/balanceSheetGQL Test.html": htmlReport(data),
     stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}