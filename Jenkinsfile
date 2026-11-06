pipeline {
  agent any
  stages {
    stage('Checkout') { steps { checkout scm } }
    stage('Install Dependencies') { steps { sh 'npm install' } }
    stage('Start Application and Selenium') {
      steps {
        sh 'docker compose up -d --build library-app selenium'
        sh 'for i in $(seq 1 30); do curl -fsS http://localhost:3000/api/health && break || sleep 2; done'
        sh 'for i in $(seq 1 30); do curl -fsS http://localhost:4444/wd/hub/status && break || sleep 2; done'
      }
    }
    stage('Selenium Tests') {
      steps { sh 'APP_URL=http://localhost:3000 SELENIUM_REMOTE_URL=http://localhost:4444/wd/hub npm test' }
    }
  }
  post { always { sh 'docker compose down' } }
}
