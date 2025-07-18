import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group } from 'k6';
import { getCSVData } from "../../commonUtil/DataParmetrisation.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var marketCodeRespTime = new Trend("marketCode_response_time");
var marketCodeStats = new Rate("marketCode_stats");

var sedolRespTime = new Trend("sedol_response_time");
var sedolStats = new Rate("sedol_stats");

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
const objective = JSON.parse(open("../../data/testData.json")).objective;
const fundType = JSON.parse(open("../../data/testData.json")).fundType;
const sector = JSON.parse(open("../../data/testData.json")).sector;
const filterMultiple = JSON.parse(open("../../data/testData.json")).filterMultiple;
export default function () {
  if (__ENV.ENDPOINT === undefined) {
    fail("Environment: ENDPOINT must be set");
  }
  var input = getCSVData();

  group('Favorites marketCode Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var type = obj.Type;
      var marketCode = obj.MarketCode;
      var sedol = obj.Sedol;

      if (sedol === 'false') {
        let query;
        if(type==='Optional')
        {
         query = `query {
          favorites(marketCode:"${marketCode}"){
            name
            isin
            sedol
            marketCode
            distribution
            country
            type
            belongsTo
          }
        } `;
      }
      else{
         query = `query {
          favorites(types:[${type}], marketCode:"${marketCode}"){
            name
            isin
            sedol
            marketCode
            distribution
            country
            type
            belongsTo
          }
        } `;
      }

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);
        
        for (let i = 0; i < body.data.favorites.length; i++) {
          check(body.data.favorites[i].name, {
            'has name  => not null': (value) => value != null && value != "" && value != undefined
          });
          check(body.data.favorites[i].isin, {
            'has isin  => not null': (value) => value != null && value != "" && value != undefined
          });
          check(body.data.favorites[i].sedol, {
            'has sedol => not null': (value) => value != null && value != "" && value != undefined
          });
          check(body.data.favorites[i].marketCode, {
            'has marketCode => not null': (value) => value != null && value != "" && value != undefined
          });
          check(body.data.favorites[i].distribution, {
            'has distribution => not null': (value) => value != null && value != "" && value != undefined
          });
          check(body.data.favorites[i].country, {
            'has country => not null': (value) => value != null && value != "" && value != undefined
          });
          check(body.data.favorites[i].type, {
            'has type => not null': (value) => value != null && value != "" && value != undefined
          });
          check(body.data.favorites[i].belongsTo, {
            'has belongsTo => not null': (value) => value != null && value != "" && value != undefined
          });
        }
      }
    }
    marketCodeRespTime.add(res.timings.duration);
    marketCodeStats.add(1);
  });

  group('Favorites Sedol Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var type = obj.Type;
      var marketCode = obj.MarketCode;
      var sedol = obj.Sedol;

      if (marketCode === 'false') {
        let query;
        if(type==='Optional')
        {
        query = `query {
          favorites(sedol:"${sedol}"){
            name
            isin
            sedol
            marketCode
            distribution
            country
            type
            belongsTo
          }
        } `;
      }
      else{
         query = `query {
          favorites(types:[${type}], sedol:"${sedol}"){
            name
            isin
            sedol
            marketCode
            distribution
            country
            type
            belongsTo
          }
        } `;
      }
        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);

        for (let i = 0; i < body.data.favorites.length; i++) {
          check(body.data.favorites[i].name, {
            'has name  => not null': (value) => value != null && value != "" && value != undefined
          });
          check(body.data.favorites[i].isin, {
            'has isin  => not null': (value) => value != null && value != "" && value != undefined
          });
          check(body.data.favorites[i].sedol, {
            'has sedol => not null': (value) => value != null && value != "" && value != undefined
          });
          check(body.data.favorites[i].marketCode, {
            'has marketCode => not null': (value) => value != null && value != "" && value != undefined
          });
          check(body.data.favorites[i].distribution, {
            'has distribution => not null': (value) => value != null && value != "" && value != undefined
          });
          check(body.data.favorites[i].country, {
            'has country => not null': (value) => value != null && value != "" && value != undefined
          });
          check(body.data.favorites[i].type, {
            'has type => not null': (value) => value != null && value != "" && value != undefined
          });
          check(body.data.favorites[i].belongsTo, {
            'has belongsTo => not null': (value) => value != null && value != "" && value != undefined
          });
        }
      }
    }
    sedolRespTime.add(res.timings.duration);
    sedolStats.add(1);
  });

  objective.forEach(function(obj){
    group('Filter Favorites on different objectives', function () {
      console.log(`Verify filtering by Objective - ${obj}`)
      let query;
       query = `query {
        favorites(
          sortOrder:DESC,
          objective: ${obj}
        ) {
          name
          sortOrder
          objective
          fundType
          sector
          fundSize,
          ocf,
          income,
        }
      }`;
    
      res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
        headers: headers,
      });

      var body = JSON.parse(res.body);

      for (let i = 0; i < body.data.favorites.length; i++) {
        //console.log(JSON.stringify(body.data.favorites[i]));
        check(body.data.favorites[i].name, {
          'has name  => not null': (value) => value != null && value != "" && value != undefined            
        });
        check(body.data.favorites[i].objective, {
          'has expected Objective': (value) => value.includes(obj.toLowerCase())
        });
      }
    
  
  sedolRespTime.add(res.timings.duration);
  sedolStats.add(1);
  });
  })

  fundType.forEach(function(type){
    group('Filter Favorites on different fund types', function () {
      console.log(`Verify filtering by FundType - ${type}`)
      let query;
       query = `query {
        favorites(
          sortOrder:DESC,
          objective: [GROWTH, RESPONSIBLE, INCOME],
          fundType: ${type}
        ) {
          name
          sortOrder
          objective
          fundType
          sector
          fundSize,
          ocf,
          income,
        }
      }`;
    
      res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
        headers: headers,
      });

      var body = JSON.parse(res.body);

      for (let i = 0; i < body.data.favorites.length; i++) {
        //console.log(JSON.stringify(body.data.favorites[i]));
        check(body.data.favorites[i].name, {
          'has name  => not null': (value) => value != null && value != "" && value != undefined            
        });
        check(body.data.favorites[i].fundType, {
          'has expected fundType': (value) => value == type.toLowerCase()
        });
      }
    
  
  sedolRespTime.add(res.timings.duration);
  sedolStats.add(1);
  });
  })

  sector.forEach(function(sector){
    group('Filter Favorites on different sectors', function () {
      console.log(`Verify filtering by Sector - ${sector}`)
      let query;
      if(sector=="UK_EQUITY"){
        query = `query {
          favorites(
            sortOrder:DESC,
            objective: [GROWTH, RESPONSIBLE, INCOME],
            fundType: ACTIVE,
            sector:${sector},
          ) {
            name
            sortOrder
            objective
            fundType
            sector
            fundSize,
            ocf,
            income,
          }
        }`;
      }
      else{
        query = `query {
          favorites(
            sortOrder:DESC,
            objective: [GROWTH, RESPONSIBLE, INCOME],
            fundType: TRACKER,
            sector:${sector},
          ) {
            name
            sortOrder
            objective
            fundType
            sector
            fundSize,
            ocf,
            income,
          }
        }`;
      }       
    
      res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
        headers: headers,
      });

      var body = JSON.parse(res.body);

      for (let i = 0; i < body.data.favorites.length; i++) {
        //console.log(JSON.stringify(body.data.favorites[i]));
        check(body.data.favorites[i].name, {
          'has name  => not null': (value) => value != null && value != "" && value != undefined            
        });
        check(body.data.favorites[i].sector, {
          'has expected sector': (value) => value == sector.toLowerCase()
        });
      }
    
  
  sedolRespTime.add(res.timings.duration);
  sedolStats.add(1);
  });
  })

  filterMultiple.forEach(function(multiFilter){
    group('Filter Favorites on multiple attributes', function () {
      console.log(`Verify filtering by - ${multiFilter}`)
      let query;
        query = `query {
          favorites(${multiFilter}) {
            name
            sortOrder
            objective
            fundType
            sector
            fundSize,
            ocf,
            income,
          }
        }`;
            
    
      res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
        headers: headers,
      });

      var body = JSON.parse(res.body);
      // console.log(JSON.stringify(body))
        check( body.data.favorites.length, {
          'has 1 or more search result': (value) => value > 0
        });
        check(body.data.favorites[0].name, {
          'has name  => not null': (value) => value != null && value != "" && value != undefined            
        });
        
      
    
  
  sedolRespTime.add(res.timings.duration);
  sedolStats.add(1);
  });
  })
}

export function handleSummary(data) {
  return {
    "GQLReports/FavouriteGQL Test.html": htmlReport(data),
     stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}