#!/usr/bin/env node
/**
 * MCP Server 手动测试脚本
 * 
 * 测试方式：通过 child_process 启动 MCP Server，发送 JSON-RPC 请求
 */

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, "dist", "server.js");

async function sendRequest(server, request) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Request timeout")), 10000);
    
    server.stdout.once("data", (data) => {
      clearTimeout(timeout);
      try {
        const response = JSON.parse(data.toString());
        resolve(response);
      } catch (err) {
        reject(err);
      }
    });
    
    server.stderr.on("data", (data) => {
      console.error("[Server Log]", data.toString());
    });
    
    server.stdin.write(JSON.stringify(request) + "\n");
  });
}

async function main() {
  console.log("=== SolarWire MCP Server 测试 ===\n");
  
  const server = spawn("node", [serverPath], {
    env: { ...process.env, LOG_LEVEL: "debug" },
  });
  
  server.on("error", (err) => {
    console.error("启动失败:", err.message);
    process.exit(1);
  });
  
  try {
    // 1. 测试初始化
    console.log("1. 测试 initialize...");
    const initResponse = await sendRequest(server, {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test-client", version: "1.0.0" },
      },
    });
    console.log("✅ initialize 成功:", initResponse.result.serverInfo);
    
    // 2. 测试列出 Tools
    console.log("\n2. 测试 tools/list...");
    const toolsResponse = await sendRequest(server, {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    });
    console.log("✅ 可用 Tools:", toolsResponse.result.tools.map(t => t.name).join(", "));
    
    // 3. 测试列出 Resources
    console.log("\n3. 测试 resources/list...");
    const resourcesResponse = await sendRequest(server, {
      jsonrpc: "2.0",
      id: 3,
      method: "resources/list",
      params: {},
    });
    console.log("✅ 可用 Resources:", resourcesResponse.result.resources.map(r => r.name).join(", "));
    
    // 4. 测试列出 Prompts
    console.log("\n4. 测试 prompts/list...");
    const promptsResponse = await sendRequest(server, {
      jsonrpc: "2.0",
      id: 4,
      method: "prompts/list",
      params: {},
    });
    console.log("✅ 可用 Prompts:", promptsResponse.result.prompts.map(p => p.name).join(", "));
    
    // 5. 测试 validate-solarwire-code
    console.log("\n5. 测试 validate-solarwire-code...");
    const validCode = `Dashboard @w=800 @h=600 @bg=#FFFFFF
  Header @(0,0) w=800 h=60 bg=#F5F5F5
    Title "仪表盘" @(20,15) w=200 h=30 @font-size=20`;
    
    const validateResponse = await sendRequest(server, {
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "validate-solarwire-code",
        arguments: {
          code: validCode,
          generateSvg: false,
        },
      },
    });
    console.log("✅ 校验结果:", validateResponse.result.content[0].text.substring(0, 200) + "...");
    
    console.log("\n=== 所有测试通过 ✅ ===");
  } catch (error) {
    console.error("\n❌ 测试失败:", error.message);
  } finally {
    server.kill();
  }
}

main();
