import { createRepository, getAuthenticatedUser } from './github-helper';

async function main() {
  try {
    // Get user info
    const user = await getAuthenticatedUser();
    console.log(`✓ Authenticated as: ${user.login}`);
    
    // Create repository
    const repo = await createRepository(
      'objects-document-extraction',
      'Objects - AI-powered document extraction application with GPT-4o and Gemini validation',
      false
    );
    
    console.log(`✓ Repository created successfully!`);
    console.log(`\nRepository URL: ${repo.html_url}`);
    console.log(`Clone URL (HTTPS): ${repo.clone_url}`);
    console.log(`Clone URL (SSH): ${repo.ssh_url}`);
    console.log(`\nOwner: ${repo.owner.login}`);
    console.log(`Full name: ${repo.full_name}`);
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

main();
