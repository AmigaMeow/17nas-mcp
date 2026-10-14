import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { tools, execute, hostname } from '../src/network.js';
test('stdio advertises all seven tools and returns browser-only NAT result',async()=>{
 const client=new Client({name:'17nas-test',version:'1.0.0'});
 const transport=new StdioClientTransport({command:process.execPath,args:['src/index.js'],stderr:'pipe'});
 try {await client.connect(transport);const listed=await client.listTools();assert.equal(listed.tools.length,7);assert.deepEqual(listed.tools.map(t=>t.name),tools.map(t=>t.name));const result=await client.callTool({name:'check_nat',arguments:{}});assert.equal(result.structuredContent.natType,'unknown');assert.equal(result.structuredContent.testUrl,'https://17nas.com/nat-test.php');const invalid=await client.callTool({name:'get_ip_info',arguments:{ip:'1.2.3.4'}});assert.equal(invalid.isError,true);assert.ok(!JSON.stringify(invalid).includes('1.2.3.4'));}finally{await client.close();}
});
test('validates hostnames and rejects unknown arguments',async()=>{
 for(const value of ['127.0.0.1','localhost','private.internal','https://example.com','example.com/path'])assert.throws(()=>hostname(value));
 assert.equal(hostname('Example.COM'),'example.com');
 await assert.rejects(execute('get_ipv6_stats',{country:'us'}),/INVALID_COUNTRY/);
 await assert.rejects(execute('get_my_rank',{ip:'1.2.3.4'}),/INVALID_ARGUMENTS/);
});
test('uses separate App aggregate endpoints and preserves IP API fields',async()=>{
 const original=globalThis.fetch;const calls=[];
 globalThis.fetch=async(url,init)=>{calls.push({url:String(url),init});return Response.json(String(url).includes('ip.17nas.com')?{ip:'192.0.2.1',protocol:'IPv4',country:{en:'Example'},asn:'AS0',location:{en:'Example'},priority:{en:'Example'},region:'Example',city:'Example',datacenter:false,timezone:'UTC'}:{region:'US',todayQueries:4,myRank:4});};
 try{const ip=await execute('get_ip_info');assert.equal(Object.keys(ip).length,10);assert.equal(ip.protocol,'IPv4');await execute('get_ipv6_stats',{country:'US'});await execute('get_my_rank');assert.equal(calls[1].url,'https://app.17nas.com/api/ipv6-rank?region=US');assert.equal(calls[2].init.method,'POST');assert.equal(calls[2].init.body,'{}');}finally{globalThis.fetch=original;}
});
test('DNS result format and upstream errors are predictable',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>Response.json({Status:0,Answer:[{name:'example.com',type:28,data:'2001:db8::1'}]});
 try{const result=await execute('dns_lookup',{hostname:'example.com',type:'AAAA'});assert.equal(result.records.length,1);assert.equal(result.status,0);globalThis.fetch=async()=>new Response('',{status:429});await assert.rejects(execute('get_ip_info'),/RATE_LIMITED/);}finally{globalThis.fetch=original;}
});
