const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

describe('Online Library Management System - Selenium practical tests', function () {
  this.timeout(60000);
  let driver;
  before(async function () {
    const options = new chrome.Options().addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--window-size=1400,1000');
    const remote = process.env.SELENIUM_REMOTE_URL;
    const builder = new Builder().forBrowser('chrome').setChromeOptions(options);
    if (remote) builder.usingServer(remote);
    driver = await builder.build();
  });
  after(async function () { if (driver) await driver.quit(); });
  it('TC01 - Admin login', async function () {
    await driver.get(process.env.APP_URL || 'http://localhost:3000');
    await driver.findElement(By.id('username')).sendKeys('admin');
    await driver.findElement(By.id('password')).sendKeys('admin123');
    await driver.findElement(By.css('#loginForm button')).click();
    await driver.wait(until.elementIsVisible(await driver.findElement(By.id('dashboard'))), 10000);
    assert.strictEqual(await driver.findElement(By.css('#dashboard h2')).getText(), 'Admin Dashboard');
  });
  it('TC02 - Add a new book', async function () {
    const unique = 'Selenium Test Book ' + Date.now();
    await driver.findElement(By.id('bookTitle')).sendKeys(unique);
    await driver.findElement(By.id('bookAuthor')).sendKeys('Test Author');
    await driver.findElement(By.css('#bookForm button')).click();
    await driver.wait(until.elementTextContains(driver.findElement(By.id('message')), 'Book added'), 5000);
    assert.ok((await driver.findElement(By.id('booksBody')).getText()).includes(unique));
  });
  it('TC03 - Register a student', async function () {
    const email = `student${Date.now()}@example.com`;
    await driver.findElement(By.id('studentName')).sendKeys('Test Student');
    await driver.findElement(By.id('studentEmail')).sendKeys(email);
    await driver.findElement(By.css('#studentForm button')).click();
    await driver.wait(until.elementTextContains(driver.findElement(By.id('message')), 'Student registered'), 5000);
    assert.ok((await driver.findElement(By.id('issueStudent')).getText()).includes('Test Student'));
  });
  it('TC04 - Search for a book', async function () {
    await driver.findElement(By.id('search')).sendKeys('Operating System Concepts');
    await driver.wait(until.elementTextContains(driver.findElement(By.id('booksBody')), 'Operating System Concepts'), 5000);
    assert.ok((await driver.findElement(By.id('booksBody')).getText()).includes('Operating System Concepts'));
    await driver.findElement(By.id('search')).clear();
  });
});
