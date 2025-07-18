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

let shareScreenerRespTime = new Trend("drupal_shareScreener_response_time");
let shareScreenerStats = new Rate("drupal_shareScreener_stats");


export default function(){
    group("shareScreener page test",()=>{
        let res = http.get(`${__ENV.ENDPOINT}/investment/shares`);
        check(res,{
            "status is 200":(response)=> response.status === 200,
            "share screener":(response)=> response.body.includes("Shares")
        });
        if(res.status===200){
        shareScreenerRespTime.add(res.timings.duration)
        shareScreenerStats.add(1)
        }
        else{
            console.log(res.status)
            console.log(res.body)
        }
    })
}

export function handleSummary(data) {
    return {
      "Reports/drupalshareScreener.html": htmlReport(data),
       stdout: textSummary(data,{ indent: " ", enableColors: true }),
    };
}