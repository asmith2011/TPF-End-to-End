import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group } from 'k6';
import { getCSVData } from "../../commonUtil/DataParmetrisation.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var quoteRespTime = new Trend("quote_response_time");
var quoteStats = new Rate("quote_stats");
var quotesRespTime = new Trend("quote_response_time");
var quotesStats = new Rate("quote_stats");

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
  var input = getCSVData();

  group('Quote Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var type = obj.Type;
      var name = obj.Name;
      let query;

      if (type === 'Fund') {
        query = `query {
      quote(identifier: "${name}") {
        ...on Fund {
          currency
        currencySymbol
        currencySymbolPosition
      }
      }
    }`;
      }
      else if (type === 'ETF') {
        query = `query {
      quote(identifier: "${name}") {
        ...on ETF {
          currency
        currencySymbol
        currencySymbolPosition
      }
      }
    }`;
      } else if (type === 'CEF') {
        query = `query {
      quote(identifier: "${name}") {
        ...on CEF {
          currency
        currencySymbol
        currencySymbolPosition
      }
      }
    }`;
      } else if (type === 'Equity') {
        query = `query {
      quote(identifier: "${name}") {
        ...on Equity {
          currency
        currencySymbol
        currencySymbolPosition
      }
      }
    }`;
      }

      res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
        headers: headers.header1,
      });

      var body = JSON.parse(res.body);

      check(res, {
        'is status 200': (r) => r.status === 200,
      });

      switch (body.data.quote.currency) {
        case 'GBX':
          check(body.data.quote.currencySymbol, {
            'has currencySymbol': (s) => s == 'p',
          });
          check(body.data.quote.currencySymbolPosition, {
            'has currencySymbolPosition': (s) => s == 'POST',
          });
          break;
        case 'GBP':
          check(body.data.quote.currencySymbol, {
            'has currencySymbol': (s) => s == '£',
          });
          check(body.data.quote.currencySymbolPosition, {
            'has currencySymbolPosition': (s) => s == 'PRE',
          });
          break;
        case 'USD':
          check(body.data.quote.currencySymbol, {
            'has currencySymbol': (s) => s == '$',
          });
          check(body.data.quote.currencySymbolPosition, {
            'has currencySymbolPosition': (s) => s == 'PRE',
          });
          break;
        case 'CHF':
          check(body.data.quote.currencySymbol, {
            'has currencySymbol': (s) => s == 'Fr.',
          });
          check(body.data.quote.currencySymbolPosition, {
            'has currencySymbolPosition': (s) => s == 'PRE',
          });
          break;
        case 'EUR':
          check(body.data.quote.currencySymbol, {
            'has currencySymbol': (s) => s == '€',
          });
          check(body.data.quote.currencySymbolPosition, {
            'has currencySymbolPosition': (s) => s == 'PRE',
          });
          break;
        case 'CAD':
          check(body.data.quote.currencySymbol, {
            'has currencySymbol': (s) => s == '$',
          });
          check(body.data.quote.currencySymbolPosition, {
            'has currencySymbolPosition': (s) => s == 'PRE',
          });
          break;
        case 'AUD':
          check(body.data.quote.currencySymbol, {
            'has currencySymbol': (s) => s == '$',
          });
          check(body.data.quote.currencySymbolPosition, {
            'has currencySymbolPosition': (s) => s == 'PRE',
          });
          break;
        case 'JPY':
          check(body.data.quote.currencySymbol, {
            'has currencySymbol': (s) => s == '¥',
          });
          check(body.data.quote.currencySymbolPosition, {
            'has currencySymbolPosition': (s) => s == 'PRE',
          });
          break;
        default:
          check(body.data.quote.currencySymbol, {
            'has currencySymbol': (s) => s == '',
          });
          break;
      }
      quoteRespTime.add(res.timings.duration);
      quoteStats.add(1);
    }
  });

  group('Quotes isin and sedol', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var type = obj.Type;
      var name = obj.Name;
      let query;

    if (name.includes('LSE:')) {

      query = `query {
        quotes(identifiers: ["${name}"]) {
            isin
          sedol
        }
    }`;
      res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
        headers: headers.header1,
      });

      var body = JSON.parse(res.body);

      check(res, {
        'is status 200': (r) => r.status === 200,
      });

      check(body.data.quotes[0].isin, {
        'has isin': (isin) => isin.length>2,
      });
      check(body.data.quotes[0].sedol, {
        'has sedol': (s) => s.length>2,
      });
      
      quotesRespTime.add(res.timings.duration);
      quotesStats.add(1);
    }
   }
  });
}


export function handleSummary(data) {
  return {
    "GQLReports/quoteCurrencyGQL Test.html": htmlReport(data),
     stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}