/**
 * @license
 * Copyright 2019 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { spawn } = require('child-process-promise');
const glob = require('glob');

// Get all karma.conf.js files that need to be run.
const testFiles = glob
  .sync(`{packages,integration}/*/karma.conf.js`)
  // Automated tests in integration/firestore are currently disabled.
  .filter(name => !name.includes('integration/firestore'));

/**
 * Runs a set of SauceLabs browser tests based on this karma config file.
 *
 * @param {string} testFile Path to karma.conf.js file that defines this test group.
 */
function runTest(testFile) {
  const promise = spawn('yarn', ['saucelabsSingle', `--testfile`, testFile]);
  const childProcess = promise.childProcess;

  childProcess.stdout.on('data', data => {
    console.log(`[${testFile}]:`, data.toString());
  });
  childProcess.stderr.on('data', data => {
    console.log(`[${testFile}]:`, data.toString());
  });

  return promise
    .then(() => console.log(`[${testFile}] ******* DONE *******`))
    .catch(err => {
      console.error(`[${testFile}] ERROR:`, err.message);
    });
}

/**
 * Runs next file in testFiles queue as long as there are files in the queue.
 */
async function runNextTest() {
  if (!testFiles.length) return;
  const nextFile = testFiles.shift();
  try {
    await runTest(nextFile);
  } catch (e) {
    console.error(`[${nextFile}] ERROR in runTest:`, e.message);
  }
  runNextTest();
}

runNextTest();
