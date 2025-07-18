import http from 'k6/http';
import { check } from 'k6';
import { sleep,group } from 'k6';
import {Trend, Rate} from 'k6/metrics'
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

export const options={

    stages: [
        { duration: '1s', target: 1 },
        // { duration: '1m', target: 100 },
        // { duration: '9m', target: 100 },
      ],
    thresholds:{
        //Service level objective required
        http_req_duration:['p(95)<3000'],
        http_req_failed:['rate<0.01'],
        checks: ['rate>=1']
    }
}

let starterPotfolioRespTime = new Trend("drupal_starterPotfolio_response_time");
let starterPotfolioStats = new Rate("drupal_starterPotfolio_stats");


export default function(){
    group("starterPotfolio page test",()=>{
        let res = http.get(`${__ENV.ENDPOINT}/investment/ideas/starter-portfolios`);
        check(res,{
            "status is 200":(response)=> response.status === 200,
            "starter portfolios":(response)=> response.body.includes("Starter portfolios")
        });
        if(res.status===200){
        starterPotfolioRespTime.add(res.timings.duration)
        starterPotfolioStats.add(1)
        }
        else{
            console.log(res.status)
            console.log(res.body)
        }
    })
}

export function handleSummary(data) {
    return {
      "Reports/drupalstarterPortfolio.html": htmlReport(data),
       stdout: textSummary(data,{ indent: " ", enableColors: true }),
    };
}