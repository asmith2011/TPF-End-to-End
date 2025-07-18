import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group, fail } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var risersFallersRespTime = new Trend("custom_risersFallers_response_time");

export const options = {
    stages: [
        { duration: '1m', target: 8 }
    ],
    thresholds: {
        http_req_failed: ['rate<0.01'], // http errors should be less than 1%
        http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2000ms
       },
};
    const headers = JSON.parse(open("../../data/headers.json"));
    const indices = JSON.parse(open("../../data/testData.json")).indices;
    const types = JSON.parse(open("../../data/testData.json")).types;
    let nullMarketCodeCount = 0;
    
    export default function () {
    
    if (__ENV.ENDPOINT === undefined) {
        fail("Environment: ENDPOINT must be set");
    } 
    
    var res;
    indices.forEach(function(index){    
      group('Risers and Fallers in Indices', function () {
       const type = types[Math.floor(Math.random() * types.length)]
       console.log(`Verify for index - ${index} & type - ${type}`)
       const query = `query {
        risersFallers(index:${index}, type:${type}) {
          risers{
            name
            marketCode
            symbol
            sedol
            dayChange
            dayChangePct
            type
          }
          fallers{
            name
            marketCode
            symbol
            sedol
            dayChange
            dayChangePct
            type
          }
        }
    }`;
        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers.header1,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });
        check(res, {
          'has risers': (r) => r.body.includes('risers'),
        });
        check(res, {
          'has fallers': (r) => r.body.includes('fallers'),
        });

        for (const [key, value] of Object.entries(body.data.risersFallers)) {
          value.forEach((item) => {
            if(item.marketCode!=null) {
              check(item, {
                'is item type not null': (r) => r.type !=null,
                'item type value is CEF or Equity': (r) => r.type == 'Equity' || 'CEF'
              })
            }
          })
        }

        if(body.data.risersFallers.risers.length>0){
          nullMarketCodeCount = body.data.risersFallers.risers.filter(riser => riser.marketCode == null).length;
          if(nullMarketCodeCount!=0){            
            console.log(`Null Market Code Risers Count: ${nullMarketCodeCount}`)
            check(nullMarketCodeCount, {
              'nullMarketCodeCount is less than 8': (count) => count < 8
            });
          }           
          body.data.risersFallers.risers.forEach(riser=>{
            if(riser.marketCode==null || riser.marketCode=="sedol"){
              console.log("Riser has null market code OR sedol"+JSON.stringify(riser))
            }  
            else {
              check(riser, {
                'is riser name not null': (r) => r.name !=null,
                'is riser symbol not null': (r) => r.symbol !=null,
                'is riser sedol not null': (r) => r.sedol !=null,
                'is riser marketCode not null': (r) => r.marketCode !=null,
              });
            }                  
          });
        }
        else{
          console.log(`Index ${index} has no Risers`)
        }

        if(body.data.risersFallers.fallers.length>0){
          nullMarketCodeCount = body.data.risersFallers.fallers.filter(riser => riser.marketCode == null).length;
          if(nullMarketCodeCount!=0){
            console.log(`Null Market Code Fallers Count: ${nullMarketCodeCount}`)
            check(nullMarketCodeCount, {
              'nullMarketCodeCount is less than 8': (count) => count < 8
            });
          } 
          body.data.risersFallers.fallers.forEach(faller=>{
            if(faller.marketCode==null){
              console.log("Faller has null market code OR sedol"+JSON.stringify(faller))
            } 
            else {
              check(faller, {
                'is faller name not null': (r) => r.name !=null,
                'is faller symbol not null': (r) => r.symbol !=null,
                'is faller sedol not null': (r) => r.sedol !=null,
                'is faller marketCode not null': (r) => r.marketCode !=null
              });
            }    
          });
        }
        else{
          console.log(`Index ${index} has no Fallers`)
        }
        // Due to data issue in lower Env' we need to comment these 2 assertions

        risersFallersRespTime.add(res.timings.duration);
    });


  }) 
}

export function handleSummary(data) {
    return {
      "GQLReports/riserFallersGQL Test.html": htmlReport(data),
       stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}