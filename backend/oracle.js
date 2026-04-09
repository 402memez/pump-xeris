const express = require('express');
const { XerisClient, XerisKeypair } = require("xeris-sdk");

const app = express();
app.use(express.json());

// Connect to the public testnet
const client = XerisClient.testnet();

// For production, load your saved vault keypair here:
// const vault = XerisKeypair.fromJsonFile("vault-keypair.json");
const vault = XerisKeypair.generate();
console.log("========================================");
console.log("🏦 XERIS ORACLE VAULT INITIALIZED");
console.log("Vault Address:", vault.publicKey);
console.log("========================================");

// Internal endpoint that ONLY the Python server can call
app.post('/payout', async (req, res) => {
    const { winner_address, amount_xrs, secret } = req.body;

    // Hardcoded security check so only your Python server can trigger this
    if (secret !== "SUPER_SECRET_ORACLE_KEY_2026") {
        return res.status(403).json({ error: "Unauthorized" });
    }

    try {
        console.log(`💸 Oracle processing payout: ${amount_xrs} XRS to ${winner_address}`);
        
        // Execute the on-chain transfer
        const tx = await client.transferXrs(vault, winner_address, amount_xrs);
        
        console.log("✅ Payout Confirmed! Signature:", tx.signature);
        res.json({ status: "success", signature: tx.signature });
    } catch (err) {
        console.error("❌ Payout Failed:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Bind only to localhost so the outside internet cannot access it
app.listen(3000, '127.0.0.1', () => {
    console.log("🔗 Oracle listening for Python signals on port 3000");
});
