import http from 'k6/http';
import { check,group,sleep } from 'k6';
import {Trend, Rate} from 'k6/metrics'
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

export const options={

    stages: [
        // { duration: '10s', target: 10 },
        // { duration: '50s', target: 10 }
      ],
    thresholds:{
        http_req_duration:['p(95)<3000']
    }
}

let searchRespTime = new Trend("drupal_search_response_time");
let searchRespTime2 = new Trend("drupal_search_response2_time");
let searchStats = new Rate("drupal_search_stats");
const searchTerms = JSON.parse(open("../../data/searchTerms.json"));


export default function(){
    group("Search perf test",()=>{
        let randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        console.log(`randomTerm: ${randomTerm}`);
        let res = http.get(`${__ENV.ENDPOINT}/investment/search/all?search=${randomTerm}`);
        check(res, {
            "status is 200": (response) => response.status === 200,
            "response is HTML": (response) => response.body.includes('<html lang="en" dir="ltr">') && response.body.includes('</html>'),
            "response has title": (response) => response.body.includes('<title>Search | AJ Bell</title>'),
            "response has itemList": (response) => response.body.includes('itemListElement')
        }) || console.log(`Checks failed for randomTerm: ${randomTerm}. Response status: ${res.status}, body: ${res.body}`);
        if(res.status===200){
            searchRespTime.add(res.timings.duration)
            searchStats.add(1)
        }
        sleep(1);// Adding sleep so that it doesnt create a lot of load on the server as these calls dont need Authentication
        // // Check if the response time is lower on second call of same term
        // let res2 = http.get(`${__ENV.ENDPOINT}/investment/search/all?search=${randomTerm}`);
        // check(res2, {
        //     "status is 200": (response) => response.status === 200,
        //     "response is HTML": (response) => response.body.includes('<html lang="en" dir="ltr">') && response.body.includes('</html>'),
        //     "response has title": (response) => response.body.includes('<title>Search | AJ Bell</title>'),
        //     "response has itemList": (response) => response.body.includes('itemListElement')
        // }) || console.log(`Checks failed for randomTerm second call: ${randomTerm}. Response status: ${res2.status}, body: ${res2.body}`);
        // if(res2.status===200){
        //     searchRespTime2.add(res2.timings.duration)
        // }        
    })
}

export function handleSummary(data) {
    return {
      "GQLReports/drupalSearch.html": htmlReport(data),
       stdout: textSummary(data,{ indent: " ", enableColors: true }),
    };
}