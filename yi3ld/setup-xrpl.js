const xrpl = require('xrpl');

async function setupXRPL() {
  console.log('🌊 Setting up XRP Ledger\n');
  
  // Try multiple testnet servers
  const testnetServers = ['wss://testnet.xrpl-labs.com'];
  
  let client;
  let connected = false;
  
  for (const server of testnetServers) {
    try {
      console.log(`Trying ${server}...`);
      client = new xrpl.Client(server, {
        connectionTimeout: 10000 // 10 seconds
      });
      await client.connect();
      connected = true;
      console.log('✅ Connected to', server, '\n');
      break;
    } catch (error) {
      console.log('❌ Failed, trying next...\n');
    }
  }
  
  if (!connected || !client) {
    console.error('❌ Could not connect to any XRPL testnet');
    console.log('\n💡 For hackathon, you can:');
    console.log('1. Use mock XRPL (just simulate the conversion)');
    console.log('2. Try again later when testnet is up');
    console.log('3. Use mainnet with tiny amounts (0.000001 XRP)');
    process.exit(1);
  }
  
  // Generate new wallet
  const wallet = xrpl.Wallet.generate();
  console.log('📝 Save these credentials:\n');
  console.log('Address:', wallet.address);
  console.log('Secret:', wallet.seed);
  console.log('Public Key:', wallet.publicKey);
  
  // Fund the wallet from testnet faucet
  console.log('\n💰 Funding wallet from faucet...');
  try {
    const fundResult = await client.fundWallet(wallet);
    console.log('✅ Funded! Balance:', xrpl.dropsToXrp(fundResult.balance), 'XRP');
    
    // Check balance
    const balance = await client.getXrpBalance(wallet.address);
    console.log('✅ Current balance:', balance, 'XRP\n');
    
    console.log('🎉 XRPL setup complete!');
    console.log('\nAdd to your .env:');
    console.log(`XRPL_ADDRESS=${wallet.address}`);
    console.log(`XRPL_SECRET=${wallet.seed}`);
    
  } catch (fundError) {
    console.log('⚠️  Faucet failed (testnet might be down)');
    console.log('Wallet created, but not funded');
    console.log('\nAdd to your .env anyway:');
    console.log(`XRPL_ADDRESS=${wallet.address}`);
    console.log(`XRPL_SECRET=${wallet.seed}`);
    console.log('\nYou can fund it manually later or use mock mode');
  }
  
  await client.disconnect();
  process.exit(0);
}

setupXRPL().catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
});