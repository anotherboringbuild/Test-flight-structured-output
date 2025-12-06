import { getUncachableGitHubClient } from './github-helper';

async function main() {
  try {
    console.log('🔐 Updating repository visibility...');
    
    const octokit = await getUncachableGitHubClient();
    
    const response = await octokit.repos.update({
      owner: 'anotherboringbuild',
      repo: 'objects-document-extraction',
      private: true
    });
    
    console.log('✅ Repository is now private!');
    console.log(`\nRepository: ${response.data.html_url}`);
    console.log(`Visibility: ${response.data.private ? 'Private 🔒' : 'Public'}`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Details:', error.response.data);
    }
    process.exit(1);
  }
}

main();
