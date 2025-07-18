import http from 'k6/http';
import { check } from 'k6';
import { sleep,group } from 'k6';
import {Trend, Rate} from 'k6/metrics'
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

export const options={
      //Load test
      //stages:[{duration:'5s', target: 10},{duration:'50s', target: 10},{duration:'5s', target: 0}],

      //Spike test
      //stages:[{duration:'2m', target: 4000},{duration:'1m', target: 0}],
  
      //Stress test
      //stages:[{duration:'5s', target: 1000},{duration:'50s', target: 1000},{duration:'5s', target: 0}],
   

      stages: [
        { duration: '1s', target: 1 },
      ],
    thresholds:{
        //Service level objective required
        // http_req_duration:['p(95)<3000'],
        http_req_failed:['rate<0.01'],
        checks: ['rate>=1']
    }
}

let isaChargesRespTime = new Trend("drupal_isaCharges_response_time");
let isaChargesStats = new Rate("drupal_isaCharges_stats");

export default function(){
    let res;
    group("ISA charges and rates",()=>{
        let res = http.get(`${__ENV.ENDPOINT}/isa/stocks-shares-isa/charges`);
        check(res,{
            "status is 200":(response)=> response.status === 200,
            // "page is home page":(response)=> response.body.includes("Stocks and shares ISA charges")
        });
        if(res.status===200){
    isaChargesRespTime.add(res.timings.duration)
    isaChargesStats.add(1)
        }
        else{
            console.log(res.status)
            console.log(res.body)
        }
    })

}

export function handleSummary(data) {
    return {
      "Reports/drupalisaCharges.html": htmlReport(data),
       stdout: textSummary(data,{ indent: " ", enableColors: true }),
    };
}