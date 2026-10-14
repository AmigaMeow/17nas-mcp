import { lookup } from 'node:dns/promises';
import { connect, isIP } from 'node:net';
export const APP_ORIGIN = 'https://app.17nas.com';
export const NAT_URL = 'https://17nas.com/nat-test.php';
export const tools = [
 {name:'get_ip_info',description:'Look up the public IP of the machine running this local MCP server, including protocol, country, location, and ASN. Sends a request to 17NAS.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'dns_lookup',description:'Query public DNS records through Cloudflare DNS over HTTPS. Supports A, AAAA, MX, TXT, NS, CNAME, SOA, and SRV.',inputSchema:{type:'object',properties:{hostname:{type:'string'},type:{type:'string',enum:['A','AAAA','MX','TXT','NS','CNAME','SOA','SRV'],default:'A'}},required:['hostname'],additionalProperties:false}},
 {name:'check_ipv6',description:'Check public hostname DNS and TCP port 443 connectivity over IPv6 and IPv4 from the machine running this MCP server. This is not a browser connectivity test.',inputSchema:{type:'object',properties:{hostname:{type:'string'}},required:['hostname'],additionalProperties:false}},
 {name:'get_ip_full',description:'Get public IP, protocol, country, city, ASN, and IPv6 connectivity in one call. NAT detection requires opening the returned browser test link.',inputSchema:{type:'object',properties:{hostname:{type:'string',default:'cloudflare.com'}},additionalProperties:false}},
 {name:'get_ipv6_stats',description:'Get separately sourced IPv6 statistics: APNIC Labs global rankings and 17NAS country samples. Countries with fewer than 300 own samples have no 17NAS rate. Optional ISO country code.',inputSchema:{type:'object',properties:{country:{type:'string',pattern:'^[A-Z]{2}$'}},additionalProperties:false}},
 {name:'get_my_rank',description:'Record an anonymous country query for the local MCP machine and return its UTC daily query ordinal and statistics. Repeat queries within one hour are deduplicated. This counts queries, not unique users.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'check_nat',description:'Return the 17NAS browser NAT test link. NAT type cannot be determined by this server-side tool.',inputSchema:{type:'object',properties:{},additionalProperties:false}}
];
export function hostname(value) {
 if(typeof value!=='string'||value.length>253||isIP(value)||!value.includes('.')||!/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$/i.test(value)||/\.(local|localhost|internal)$/i.test(value))throw new Error('INVALID_HOSTNAME');
 return value.toLowerCase();
}
function publicAddress(address) {
 if(isIP(address)===4){const [a,b]=address.split('.').map(Number);return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&b===168||a===100&&b>=64&&b<=127);}
 return /^[23][0-9a-f]{3}:/i.test(address)&&!/^2001:db8:/i.test(address);
}
async function reachable(host,family) {
 let resolved;try{resolved=await lookup(host,{family});}catch{return {hasAddress:false,connected:false};}
 if(!publicAddress(resolved.address))return {hasAddress:true,connected:false};
 const connected=await new Promise(resolve=>{
  const socket=connect({host:resolved.address,port:443,family});let done=false;
  const finish=ok=>{if(done)return;done=true;socket.destroy();resolve(ok);};
  socket.setTimeout(1500);socket.once('connect',()=>finish(true));socket.once('error',()=>finish(false));socket.once('timeout',()=>finish(false));
 });
 return {hasAddress:true,connected};
}
export async function ipv6(host) {host=hostname(host);const [v6,v4]=await Promise.all([reachable(host,6),reachable(host,4)]);return {hostname:host,hasAAAA:v6.hasAddress,ipv6Connectivity:v6.connected,ipv4Connectivity:v4.connected,checkedFrom:'mcp_host',checkedAt:new Date().toISOString()};}
async function json(url,init={}) {const response=await fetch(url,{...init,signal:AbortSignal.timeout(5000)});if(!response.ok)throw new Error(response.status===429?'RATE_LIMITED':'UPSTREAM_UNAVAILABLE');return response.json();}
export async function ipInfo() {const d=await json('https://ip.17nas.com/?format=json');return {ip:d.ip,protocol:d.protocol,country:d.country,asn:d.asn,location:d.location,priority:d.priority,region:d.region,city:d.city,datacenter:d.datacenter,timezone:d.timezone};}
export async function execute(name,args={}) {
 const spec=tools.find(t=>t.name===name);if(!spec)throw new Error('UNKNOWN_TOOL');
 if(!args||typeof args!=='object'||Array.isArray(args)||Object.keys(args).some(k=>!Object.hasOwn(spec.inputSchema.properties,k)))throw new Error('INVALID_ARGUMENTS');
 if(name==='get_ip_info')return ipInfo();
 if(name==='check_nat')return {natType:'unknown',detectionMethod:'browser_test_required',testUrl:NAT_URL};
 if(name==='check_ipv6')return ipv6(args.hostname);
 if(name==='get_ip_full'){const [ip,connectivity]=await Promise.all([ipInfo(),ipv6(args.hostname??'cloudflare.com')]);return {...ip,ipv6:connectivity,nat:{natType:'unknown',testUrl:NAT_URL}};}
 if(name==='dns_lookup') {const host=hostname(args.hostname),type=(args.type??'A').toUpperCase();if(!['A','AAAA','MX','TXT','NS','CNAME','SOA','SRV'].includes(type))throw new Error('INVALID_RECORD_TYPE');const d=await json(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`,{headers:{Accept:'application/dns-json'}});return {hostname:host,type,status:d.Status,records:d.Answer??[]};}
 if(name==='get_ipv6_stats'){if(args.country!==undefined&&!/^[A-Z]{2}$/.test(args.country))throw new Error('INVALID_COUNTRY');return json(`${APP_ORIGIN}/api/ipv6-rank${args.country?'?region='+args.country:''}`);}
 if(name==='get_my_rank')return json(`${APP_ORIGIN}/api/ipv6-query`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
}
