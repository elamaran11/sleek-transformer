import AWS from 'aws-sdk'
import { execSync } from 'child_process';
import { Octokit } from '@octokit/rest';

// Main function that executes the entire process
async function createAndSubmitPullRequest(inputParameters) {
  // AWS Secrets Manager configuration
  const sm = new AWS.SecretsManager({ region: inputParameters.aws_region });
  const secretName = 'github-access-token-secret';

  // GitHub repository and pull request configuration
  const addonName = inputParameters.addonName;
  const repoUrl = 'https://github.com/elamaran11/aws-sleek-transformer.git';
  const pullRequestTitle = `Adding ${addonName} Addon`;
  const pullRequestBody = `Adding ${addonName} Addon to the repository`;
  const baseBranch = 'main';
  const headBranch = `feature/${addonName}`;
  await cloneRepository(repoUrl);
  await addFileToRepo();
  await submitPullRequest(sm, secretName ,baseBranch, headBranch, pullRequestTitle, pullRequestBody);
}

// Function to retrieve the GitHub personal access token from AWS Secrets Manager
async function getGitHubAccessToken(sm, secretName) {
  const secret = await sm.getSecretValue({ SecretId: secretName }).promise();
  const secretString = secret.SecretString;
  if (typeof secretString === 'string') {
    return JSON.parse(secretString).accessToken;
  } else {
    throw new Error('SecretString is not a string.');
  }
}

// Function to clone the GitHub repository
async function cloneRepository(repoUrl) {
  execSync(`git clone ${repoUrl} && cd aws-sleek-transformer`);
}

// Function to add a file to the cloned repository
async function addFileToRepo() {
  execSync('pwd && touch new-file.txt');
  execSync('git add new-file.txt');
  execSync('git commit -m "Adding a new file"');
}

// Function to submit a pull request to the GitHub repository
async function submitPullRequest(sm, secretName, baseBranch,headBranch, pullRequestTitle, pullRequestBody) {
  execSync(`git push -u origin ${headBranch}`);
  const prUrl = `https://github.com/elamaran11/aws-sleek-transformer/pull/new/${baseBranch}...${headBranch}`;
  const accessToken = await getGitHubAccessToken(sm,secretName);
  const octokit = new Octokit({ auth: accessToken });
  await octokit.pulls.create({
    owner: 'elamaran11',
    repo: 'aws-sleek-transformer',
    title: pullRequestTitle,
    body: pullRequestBody,
    base: baseBranch,
    head: headBranch
  });
  execSync('cd .. && rm -rf aws-sleek-transformer');

}

export default createAndSubmitPullRequest