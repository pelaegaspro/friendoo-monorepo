const https = require('https');
const { generateFriendooPenpotDesignCode } = require('./generate_penpot_friendoo.js');

const urlStr = 'https://design.penpot.app/mcp/stream?userToken=eyJhbGciOiJBMjU2S1ciLCJlbmMiOiJBMjU2R0NNIn0.58iMK5yBbuqoOq8qx7jyKjylAeuDVSbUlkLoyL_1lKtNZwZhGNjXzQ.kd_LWZELucIEi35Y.FC6nTK-W-PUSaqf2h332vcAfqwO7g5J72skLMVKzYOgLTZ3G5P9FfwOiJ5TO9ySgP1ixtcdxpdVlRklcXbu7KSQ57zej3YQMl6RAIf7otszibNNcIBtvXwxUhhji9B_5YFxytKOvYw6YLO1C90e0Spcncz-SEbb1gjC0lvr9FT6pcRLBSONgOydCKKa2CZctuXewzEs1roft.R8BuXp71j6NmSBVy_F82Jg';

function post(reqObj, sessionId) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(reqObj);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
      'Accept': 'application/json, text/event-stream'
    };
    if (sessionId) headers['mcp-session-id'] = sessionId;
    const req = https.request(urlStr, { method: 'POST', headers }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log("Initializing Penpot MCP session...");
  const init = await post({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'antigravity', version: '1.0' } }
  });
  const sessionId = init.headers['mcp-session-id'];
  console.log("Session ID obtained:", sessionId);

  await post({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }, sessionId);

  console.log("Sending 33-Screen Friendoo Penpot Design Code to Penpot MCP...");
  const callRes = await post({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'execute_code',
      arguments: { code: generateFriendooPenpotDesignCode }
    }
  }, sessionId);

  console.log("MCP Response Status:", callRes.status);
  console.log("MCP Execution Result:", callRes.body);
}

run().catch(console.error);
