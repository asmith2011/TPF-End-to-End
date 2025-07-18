import http from 'k6/http';
import { check } from 'k6';
import { sleep,group } from 'k6';
import {Trend, Rate} from 'k6/metrics'
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

export const options={

    stages: [
        { duration: '1s', target: 1 },
      ],
    thresholds:{
        //Service level objective required
        http_req_duration:['p(95)<3000'],
        http_req_failed:['rate<0.01'],
        checks: ['rate>=1']
    }
}

let fundScreenerRespTime = new Trend("drupal_fundScreener_response_time");
let fundScreenerStats = new Rate("drupal_fundScreener_stats");


export default function(){
    group("fundScreener page test",()=>{
        let res = http.get(`${__ENV.ENDPOINT}/investment/funds`);
        check(res,{
            "status is 200":(response)=> response.status === 200,
            "Fund screener":(response)=> response.body.includes("Funds")
        });
        if(res.status===200){
        fundScreenerRespTime.add(res.timings.duration)
        fundScreenerStats.add(1)
        }
        else{
            console.log(res.status)
            console.log(res.body)
        }
    })
}

export function handleSummary(data) {
    return {
      "Reports/drupalfundScreener.html": htmlReport(data),
       stdout: textSummary(data,{ indent: " ", enableColors: true }),
    };
}