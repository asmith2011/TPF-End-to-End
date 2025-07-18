pipeline {
  agent none
  triggers {
    cron('0 10 * * 1-5')
  }
  options{
    buildDiscarder(logRotator(numToKeepStr: '50'))
  }
  stages {    
    stage('GQL tests') {
    agent {   label 'ecs-k6' }
    when {
        beforeAgent true
        branch 'master'
    }
    steps {
        checkout scm
        sh 'chmod +x ./GQLRun.sh && ./GQLRun.sh'
    }
    post {
        always {
            archiveArtifacts artifacts: 'raw-data*.csv'
            script {
                  publishHTML(target: [
                    allowMissing: false, 
                    alwaysLinkToLastBuild: true, 
                    keepAll: true, 
                    includes: '**/*',
                    reportDir: 'GQLReports/', 
                    reportFiles: '*.html', 
                    reportName: "GQL Tests Report"
                  ])
              }
        }
    }
    }
  }
}