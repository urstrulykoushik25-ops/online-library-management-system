# Online Library Management System (DevOps Practical)

A beginner-friendly demonstration project with admin login, book CRUD/search, student registration, book issue/return and overdue fine calculation. It includes Docker, Jenkins and Selenium test files.

## Demo credentials
- Username: `admin`
- Password: `admin123`

Change these demo credentials and the session secret before any real deployment. This is an educational practical project, not a production-ready library system.

## 1. Install prerequisites (Windows)
Install Node.js 20 LTS, Git, Docker Desktop (with Linux containers enabled), and a GitHub account. For the Jenkins section, run Jenkins locally or use an existing Jenkins server with Docker access.

Open PowerShell in the extracted project folder.

## 2. Run the application without Docker
```powershell
npm install
npm start
```
Open `http://localhost:3000` in Chrome. Login with `admin` / `admin123`.

## 3. Upload source code to your GitHub account
Create a new empty repository on GitHub named `online-library-management-system` (do not add README or .gitignore if these files already exist locally). In PowerShell, from this folder:
```powershell
git init
git add .
git commit -m "Initial commit - Online Library Management System"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/online-library-management-system.git
git push -u origin main
```
Replace `YOUR-USERNAME` with your GitHub username. If Git asks you to authenticate, complete the browser sign-in or use a GitHub-supported credential method. Never put a password or token inside the repository URL.

For later changes:
```powershell
git add .
git commit -m "Update library application"
git push
```

## 4. Build and run the Docker image
Make sure Docker Desktop is running. From the project folder:
```powershell
docker build -t online-library:1.0 .
docker run -d --name online-library -p 3000:3000 -v library-data:/app/data online-library:1.0
docker ps
docker logs online-library
```
Open `http://localhost:3000`. Stop and remove the container when finished:
```powershell
docker stop online-library
docker rm online-library
```

## 5. Run Selenium tests
The Selenium test suite uses a Chrome browser in a Docker container. Start both services:
```powershell
docker compose up -d --build library-app selenium
```
Install development dependencies on your laptop:
```powershell
npm install
```
Run the tests from PowerShell:
```powershell
$env:APP_URL="http://localhost:3000"
$env:SELENIUM_REMOTE_URL="http://localhost:4444/wd/hub"
npm test
```
Expected test cases: TC01 admin login, TC02 add a book, TC03 register a student, TC04 search for a book. The test output should show passing tests. Stop services:
```powershell
docker compose down
```

## 6. Integrate GitHub with Jenkins
1. Start Jenkins and open `http://localhost:8080` (or your Jenkins server URL).
2. Complete the first-time setup and install suggested plugins. Ensure **Pipeline**, **Git**, and **GitHub** plugins are installed.
3. Push this project to GitHub using section 3.
4. In Jenkins select **New Item** > enter `Online-Library-Pipeline` > choose **Pipeline** > **OK**.
5. Under **Pipeline**, choose **Pipeline script from SCM**.
6. SCM: **Git**. Repository URL: `https://github.com/YOUR-USERNAME/online-library-management-system.git`.
7. Branch: `*/main`. Script Path: `Jenkinsfile`. Save, then click **Build Now**.
8. Open **Console Output** and check each stage. Jenkins must have Docker Engine access and the `docker` and `docker compose` commands available to its build agent. The Jenkinsfile is written for a Linux Jenkins agent with Docker access; a Windows-only Jenkins agent needs equivalent PowerShell steps or a Linux agent.

For automatic builds after each GitHub push, configure a GitHub webhook pointing to `http://YOUR-JENKINS-ADDRESS/github-webhook/` and enable the GitHub hook trigger in the Jenkins job. Your Jenkins server must be reachable by GitHub.

## 7. Complete application workflow for practical demonstration
1. Open the app and login as admin.
2. Add a book by entering its title and author.
3. Register a student with name and email.
4. Search for the book using its title or author.
5. Issue the book by selecting the available book and registered student. Choose a due date if needed.
6. Confirm the book status changes to Issued.
7. Return the book using the Return button.
8. The app calculates overdue fine at ₹5 per day after the due date (the due date is stored with each issue).
9. Edit or delete a book using the action buttons. A book with an active issue cannot be deleted.
10. Run Selenium tests, build the Docker image, and run the Jenkins pipeline.

## Test case summary
| Test ID | Test case | Expected result |
|---|---|---|
| TC01 | Admin login | Admin dashboard appears |
| TC02 | Add a new book | New book appears in book list |
| TC03 | Register a student | Student appears in issue dropdown |
| TC04 | Search for a book | Matching book is displayed |

## Troubleshooting
- **Port 3000 is busy:** stop the other app using port 3000, or change the port mapping in `docker-compose.yml` and `APP_URL` consistently.
- **Docker command not found:** start Docker Desktop, wait until it says running, then reopen PowerShell.
- **Selenium cannot connect:** run `docker compose ps` and check that `library-selenium` is healthy; wait a little and retry the test.
- **Jenkins cannot run Docker:** configure Docker access for the Jenkins agent. Installing Jenkins plugins alone does not grant Docker permissions.
- **Git push rejected:** confirm the remote repository exists and that you are authenticated to the correct GitHub account.

## Important
This project uses simple demo admin authentication and JSON-file storage to keep the practical setup easy. Do not expose it to the public internet or use real student data without adding secure authentication, authorization, validation, database backups and other production controls.
