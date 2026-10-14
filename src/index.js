#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { tools,execute } from './network.js';
const server=new Server({name:'17nas-network-tools',version:'1.1.0'},{capabilities:{tools:{}}});
server.setRequestHandler(ListToolsRequestSchema,async()=>({tools}));
server.setRequestHandler(CallToolRequestSchema,async request=>{
 try {const result=await execute(request.params.name,request.params.arguments??{});return {content:[{type:'text',text:JSON.stringify(result,null,2)}],structuredContent:result};}
 catch(error){const code=error instanceof Error&&/^[A-Z_]+$/.test(error.message)?error.message:'NETWORK_ERROR';return {isError:true,content:[{type:'text',text:JSON.stringify({error:{code,message:'The network check could not be completed. Please retry or check the service status.'}})}]};}
});
await server.connect(new StdioServerTransport());
