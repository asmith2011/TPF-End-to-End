import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group } from 'k6';
import { getCSVData } from "../../commonUtil/DataParmetrisation.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var netProfitRespTime = new Trend("netProfit_response_time");
var netProfitStats = new Rate("netProfit_stats");
var incomeStRespTime = new Trend("incomeSt_response_time");
var incomeStStats = new Rate("incomeSt_stats");

const headers = {
  'Content-Type': 'application/json',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept': 'application/json',
  'Connection': 'keep-alive',
  'DNT': '1'
};

var res;
const instruments = JSON.parse(open("../../data/testData.json")).instrumentAllExchanges;
const instrumentStockholm = JSON.parse(open("../../data/testData.json")).instrumentAllExchanges;

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

  group('Net Profits Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isIncomeStatementEnabled = obj.isIncomeStatementEnabled;
      var startDate = obj.startDate;
      var endDate = obj.endDate;
      var statementType = obj.statementType;
      var dataType = obj.dataType;

      if (isIncomeStatementEnabled === 'true') {
        const query = `query {incomeStatement( startDate:"${startDate}", endDate:"${endDate}", identifier:"${identifier}", statementType:${statementType}, dataType:${dataType}) {
      incomePreTax
      tax
      netProfit
      operatingProfitAdjusted
      reportedEarningsPerShare
      } }  `;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });
        for (let i = 0; i < body.data.incomeStatement.length; i++) {
          check(body.data.incomeStatement[i], {
            'has incomePreTax not null': (incomeStatementValue) => incomeStatementValue.incomePreTax != null && incomeStatementValue.incomePreTax != ""
          });

          check(body.data.incomeStatement[i], {
            'has tax not null': (incomeStatementValue) => incomeStatementValue.tax != null && incomeStatementValue.tax != ""
          });

          if (body.data.incomeStatement[i].incomePreTax === 'n/a' || body.data.incomeStatement[i].tax === 'n/a') {
            check(body.data.incomeStatement[i], {
              'has netProfit="n/a"': (incomeStatementValue) => incomeStatementValue.netProfit === 'n/a'
            });
          }
          else {
            check(body.data.incomeStatement[i], {
              'has netProfit= incomePreTax- tax': (incomeStatementValue) => incomeStatementValue.incomePreTax - incomeStatementValue.tax == incomeStatementValue.netProfit
            });
          }

          check(body.data.incomeStatement[i], {
            'operatingProfitAdjusted is not empty': (incomeStatementValue) =>  incomeStatementValue.operatingProfitAdjusted != ""
          });

          check(body.data.incomeStatement[i], {
            'reportedEarningsPerShare is not empty': (incomeStatementValue) =>  incomeStatementValue.reportedEarningsPerShare != ""
          });
        }
      }
    }
    netProfitRespTime.add(res.timings.duration);
    netProfitStats.add(1);
  });

  group('Stockholm Exchange Instrument Datapoints Validation', function () {
        let instr = instrumentStockholm[Math.floor(Math.random() * instrumentStockholm.length)]         
        const query = `query {
          incomeStatement(identifier: "${instr}", statementType: ANNUAL, dataType: RESTATED) {
           yearEnd
           incomePreTax
             tax
             netProfit
             operatingProfitAdjusted
             reportedEarningsPerShare
         }
       }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });
        body.data.incomeStatement.forEach(function(incomeStatement){

          check(incomeStatement, {
            'stockholm instrument has yearEnd not null': (incomeStatementValue) => incomeStatementValue.yearEnd != null && incomeStatementValue.yearEnd != ""
          });
          check(incomeStatement, {
            'stockholm instrument has incomePreTax not null': (incomeStatementValue) => incomeStatementValue.incomePreTax != null && incomeStatementValue.incomePreTax != ""
          });
          check(incomeStatement, {
            'stockholm instrument has netProfit not null': (incomeStatementValue) => incomeStatementValue.netProfit != null && incomeStatementValue.netProfit != ""
          });
          check(incomeStatement, {
            'stockholm instrument has tax not null': (incomeStatementValue) => incomeStatementValue.tax != null && incomeStatementValue.tax != ""
          });
        })
    incomeStRespTime.add(res.timings.duration);
    incomeStStats.add(1);
  });

  instruments.forEach(function(instrument){
    group('Update income statement', function () {
       const query = `query {
        incomeStatement(identifier: "${instrument}", 
          statementType:ANNUAL,
          dataType:RESTATED
        ) {
            currencySymbol
             currencySymbolPosition
            yearEnd
            currency
            dividendPerShare
            normalisedEarningsPerShare
            reportedEarningsPerShare  
            dividendPerShareFormatted
            normalisedEarningsPerShareFormatted
            reportedEarningsPerShareFormatted
        }
    }  `;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);
        // console.log(`RESPONSE for instrument ${instrument}`);
        // console.log(body);
        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        check(body.data.incomeStatement[0].dividendPerShareFormatted.slice(0, -1), {
          'is dividend as expected': (div) => div>0,
        });
        check(body.data.incomeStatement[0].normalisedEarningsPerShareFormatted.slice(0, -1), {          
          'is normalised Earnings as expected': (div) => div>0,
        });
        check(body.data.incomeStatement[0].reportedEarningsPerShareFormatted.slice(0, -1), {
          'is reported Earnings Per Share as expected': (div) => div>0,
        });
        check(body.data.incomeStatement[0].dividendPerShareFormatted, {
          'is dividend having currency': (div) => div.includes('c')||div.includes('p'),
        });
        check(body.data.incomeStatement[0].normalisedEarningsPerShareFormatted, {
          'is normalised Earnings having currency': (div) => div.includes('c')||div.includes('p'),
        });
        check(body.data.incomeStatement[0].reportedEarningsPerShareFormatted, {
          'is reported Earnings Per Share having currency': (div) => div.includes('c')||div.includes('p'),
        });
        check(body.data.incomeStatement[0].currencySymbolPosition, {
          'is currency symbol position as expected ': (div) => div.includes('PRE')||div.includes('POST'),
        });
    
    incomeStRespTime.add(res.timings.duration);
    incomeStStats.add(1);
  });
  })
  
}

export function handleSummary(data) {
  return {
    "GQLReports/incomeStatementGQL Test.html": htmlReport(data),
     stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}