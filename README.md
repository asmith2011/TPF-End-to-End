# README #

Basic load testing using the K6 framework, designed to test API endpoints
https://k6.io/

Example Test run: 1 user running for 2 seconds
```
k6 run --out statsd .\tests\wso2-is.js -e ENDPOINT=https://env5-jl.yi-qa1.ajbbuild.uk --vus 1 --duration 2s
```

Example running predefined stage durations
```
stages: [
    { duration: '20s', target: 5},
    { duration: '30s', target: 10},
    { duration: '20s', target: 5},
]
```

or just run it with --vus defined
```
k6 run --out statsd .\tests\GeneralAPITesting\wso2-login.js -e ENDPOINT=https://env5-jl.yi-qa1.ajbbuild.uk --vus 1 --duration 2s
```

### What is this repository for? ###

* Basic load tests of lower evnvironment YouInvest APIs

### How do I get set up? ###

* Install K6: https://k6.io/docs/getting-started/installation/
* Check out the code
* Open terminal 
* Run: k6 run --out statsd .\tests\wso2-is.js -e ENDPOINT=https://env5-jl.yi-qa1.ajbbuild.uk --vus 1 --duration 2s
* ENV7 is the designated load Testing environment, thy this ENV first ENDPOINT=https://env7-jl.yi-qa1.ajbbuild.uk
* Be careful if you are loading lower environments as you may kill the fun for everyone :-)