import { createClient } from 'npm:@supabase/supabase-js@2.112.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Content-Type': 'application/json',
}

interface VisitData {
  event_id?: string; event_type?: string; event_name?: string | null;
  engaged_seconds?: number; visitor_id?: string; session_id?: string;
  utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null;
  userAgent?: string; page?: string; referrer?: string;
  screenResolution?: string; language?: string; timezone?: string;
}
interface ParsedUserAgent { browser:string; browserVersion:string; os:string; deviceType:string; deviceModel:string; }

function parseUserAgent(userAgent: string): ParsedUserAgent {
  let browser='Unknown', browserVersion='', os='Unknown', deviceType='Desktop', deviceModel='';
  if (userAgent.includes('Edg')) { browser='Edge'; browserVersion=userAgent.match(/Edg\/([0-9.]+)/)?.[1]??''; }
  else if (userAgent.includes('OPR')||userAgent.includes('Opera')) { browser='Opera'; browserVersion=userAgent.match(/(OPR|Opera)\/([0-9.]+)/)?.[2]??''; }
  else if (userAgent.includes('Chrome')) { browser='Chrome'; browserVersion=userAgent.match(/Chrome\/([0-9.]+)/)?.[1]??''; }
  else if (userAgent.includes('Firefox')) { browser='Firefox'; browserVersion=userAgent.match(/Firefox\/([0-9.]+)/)?.[1]??''; }
  else if (userAgent.includes('Safari')) { browser='Safari'; browserVersion=userAgent.match(/Version\/([0-9.]+)/)?.[1]??''; }
  if (userAgent.includes('iPhone')) { os='iOS'; deviceType='Mobile'; deviceModel='iPhone'; }
  else if (userAgent.includes('iPad')) { os='iPadOS'; deviceType='Tablet'; deviceModel='iPad'; }
  else if (userAgent.includes('Android')) { os='Android'; deviceType=/Mobile/i.test(userAgent)?'Mobile':'Tablet'; deviceModel=userAgent.match(/;\s*([^;)]+)\s*Build\//)?.[1]?.trim()??''; }
  else if (userAgent.includes('Windows NT 10.0')) os='Windows 10/11';
  else if (userAgent.includes('Windows')) os='Windows';
  else if (userAgent.includes('Mac OS X')) { const v=userAgent.match(/Mac OS X ([0-9_]+)/)?.[1]; os=v?'macOS '+v.replace(/_/g,'.'):'macOS'; if(userAgent.includes('Macintosh'))deviceModel='Mac'; }
  else if (userAgent.includes('CrOS')) os='Chrome OS';
  else if (userAgent.includes('Linux')) os='Linux';
  if (userAgent.includes('Mobile')&&!userAgent.includes('iPad'))deviceType='Mobile';
  return {browser,browserVersion,os,deviceType,deviceModel};
}
function clean(value: unknown, max:number): string|null {
  if(typeof value!=='string')return null; const v=value.trim(); return v?v.slice(0,max):null;
}
function isUuid(value:string|null): value is string {
  return typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function normalizeIp(value:string|null):string|null {
  const ip=clean(value,64);
  if(!ip || ip==='::1' || ip==='127.0.0.1')return null;
  if(ip.startsWith('10.')||ip.startsWith('192.168.')||ip.startsWith('169.254.')||/^172\.(1[6-9]|2\d|3[01])\./.test(ip))return null;
  return ip;
}
async function readGeo(req:Request):Promise<{ip:string|null;city:string|null;region:string|null;countryCode:string|null;geoSource:string|null}> {
  const edge = req as Request & { cf?: { city?: string; region?: string; country?: string } };
  const ip=normalizeIp(req.headers.get('cf-connecting-ip')||req.headers.get('x-real-ip'));
  let city=clean(edge.cf?.city,120) || clean(req.headers.get('cf-ipcity'),120);
  let region=clean(edge.cf?.region,120) || clean(req.headers.get('cf-region'),120);
  let countryCode=(clean(edge.cf?.country,2)||clean(req.headers.get('cf-ipcountry'),2))?.toUpperCase()??null;
  let geoSource=(city||region)?'edge_metadata':(countryCode?'cf-ipcountry':null);
  // Supabase logs expose city/region as metadata, not necessarily as request headers.
  // When edge metadata is unavailable, do a short, best-effort IP Geo lookup.
  if(ip && (!city || !region)) {
    try {
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),1200);
      const response=await fetch('https://ipwho.is/'+encodeURIComponent(ip),{signal:controller.signal,headers:{accept:'application/json'}});
      clearTimeout(timeout);
      if(response.ok) {
        const g=await response.json();
        if(g && g.success===true) {
          city=city||clean(g.city,120);
          region=region||clean(g.region,120);
          countryCode=countryCode||clean(g.country_code,2)?.toUpperCase()||null;
          if(city||region)geoSource='ipwho.is';
        }
      }
    } catch (err) {
      console.warn('IP geolocation enrichment unavailable', { name: err instanceof Error ? err.name : 'UnknownError' });
    }
  }
  return {ip,city,region,countryCode,geoSource};
}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:corsHeaders});
  if(req.method!=='POST')return new Response(JSON.stringify({error:'Method not allowed'}),{status:405,headers:corsHeaders});
  try {
    const supabaseUrl=Deno.env.get('SUPABASE_URL'), serviceRoleKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if(!supabaseUrl||!serviceRoleKey){console.error('Analytics ingest missing environment configuration');return new Response(JSON.stringify({error:'Analytics ingestion unavailable'}),{status:503,headers:corsHeaders});}
    const body=await req.json().catch(()=>null) as VisitData|null;
    if(!body||typeof body!=='object'||Array.isArray(body))return new Response(JSON.stringify({error:'Expected a JSON event body'}),{status:400,headers:corsHeaders});
    // Exclude configured site-owner/testing IPs before writing analytics. Configure
    // SITE_OWNER_EXCLUDED_IPS as a comma-separated list in the Edge Function secrets.
    // An unset value intentionally disables exclusions rather than hardcoding an IP.
    const clientIp=normalizeIp(req.headers.get('cf-connecting-ip')||req.headers.get('x-real-ip'));
    const excludedIps=(Deno.env.get('SITE_OWNER_EXCLUDED_IPS')||'')
      .split(',')
      .map((value)=>normalizeIp(value.trim()))
      .filter((value): value is string => value!==null);
    if(clientIp && excludedIps.includes(clientIp))return new Response(JSON.stringify({success:true,ignored:true,reason:'excluded_test_traffic'}),{status:200,headers:corsHeaders});
    const eventType=clean(body.event_type,40)||'pageview';
    if(!['pageview','page_view','activity','event','engagement'].includes(eventType))return new Response(JSON.stringify({error:'Unsupported event_type'}),{status:400,headers:corsHeaders});
    const page=(clean(body.page,300)?.split(/[?#]/,1)[0]||'/').slice(0,300);
    const referrer=clean(body.referrer,300), userAgent=clean(body.userAgent||req.headers.get('user-agent')||'',500)||'';
    const ua=parseUserAgent(userAgent), visitorId=clean(body.visitor_id,100), sessionId=clean(body.session_id,100);
    const visitorUuid=isUuid(visitorId)?visitorId:null, sessionUuid=isUuid(sessionId)?sessionId:null;
    const eventName=clean(body.event_name,100), screenResolution=clean(body.screenResolution,32);
    const language=clean(body.language,32), timezone=clean(body.timezone,64), eventId=clean(body.event_id,100);
    const supabase=createClient(supabaseUrl,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
    let authUserId:string|null=null;
    const authorization=req.headers.get('authorization');
    if(authorization?.startsWith('Bearer ')){const token=authorization.slice(7).trim();if(token&&token!==Deno.env.get('SUPABASE_ANON_KEY')){try{const {data}=await supabase.auth.getUser(token);authUserId=data.user?.id??null;}catch{authUserId=null;}}}
    if(eventType==='engagement'){
      const engagedSeconds=typeof body.engaged_seconds==='number'&&Number.isFinite(body.engaged_seconds)?Math.max(0,Math.min(15,Math.floor(body.engaged_seconds))):0;
      if(!sessionUuid||!visitorUuid||engagedSeconds<1)return new Response(JSON.stringify({success:true,ignored:true,reason:'invalid_engagement_sample'}),{status:200,headers:corsHeaders});
      const {error}=await supabase.from('website_engagement_events').upsert({event_id:isUuid(eventId)?eventId:crypto.randomUUID(),session_id:sessionUuid,visitor_id:visitorUuid,page_path:page,engaged_seconds:engagedSeconds,created_at:new Date().toISOString()},{onConflict:'event_id',ignoreDuplicates:true});
      if(error){console.error('Failed engagement insert',{code:error.code,message:error.message});return new Response(JSON.stringify({error:'Failed to record engagement'}),{status:500,headers:corsHeaders});}
      return new Response(JSON.stringify({success:true,recordedIn:'website_engagement_events'}),{status:200,headers:corsHeaders});
    }
    const validEventId=isUuid(eventId)?eventId:crypto.randomUUID(), normalizedEventType=['activity','event'].includes(eventType)?'activity':'pageview';
    const geo=await readGeo(req);
    const {error:rollingError}=await supabase.from('website_visit_events').upsert({
      id:validEventId,session_id:sessionId,visitor_id:visitorId,page_path:page,referrer,event_type:normalizedEventType,
      created_at:new Date().toISOString(),event_name:eventName,device_type:ua.deviceType,country_code:geo.countryCode
    },{onConflict:'id',ignoreDuplicates:true});
    if(rollingError){console.error('Failed rolling analytics insert',{code:rollingError.code,message:rollingError.message});return new Response(JSON.stringify({error:'Failed to record analytics event',stage:'rolling_write'}),{status:500,headers:corsHeaders});}
    const {error:legacyError}=await supabase.from('website_visits').upsert({
      event_id:validEventId,event_type:normalizedEventType,event_name:eventName,session_id:sessionUuid,visitor_id:visitorUuid,user_id:authUserId,
      utm_source:clean(body.utm_source,100),utm_medium:clean(body.utm_medium,100),utm_campaign:clean(body.utm_campaign,100),
      ip_address:geo.ip,user_agent:userAgent.slice(0,500)||'Unknown',page_url:page,country_code:geo.countryCode,city:geo.city,region:geo.region,
      browser:ua.browser,browser_version:ua.browserVersion||null,os:ua.os,device_type:ua.deviceType,device_model:ua.deviceModel||null,
      referrer,screen_resolution:screenResolution,language,timezone,metadata:{location_source:geo.geoSource}
    },{onConflict:'event_id',ignoreDuplicates:true});
    if(legacyError){console.error('Rolling analytics recorded but legacy mirror failed',{code:legacyError.code,message:legacyError.message});return new Response(JSON.stringify({success:true,partial:true,recordedIn:'website_visit_events'}),{status:200,headers:corsHeaders});}
    return new Response(JSON.stringify({success:true,eventId:validEventId,recordedIn:['website_visit_events','website_visits'],geoAvailable:Boolean(geo.ip||geo.countryCode||geo.city||geo.region),geoSource:geo.geoSource}),{status:200,headers:corsHeaders});
  } catch(error){console.error('website-visits ingestion error',error);return new Response(JSON.stringify({error:'Internal server error'}),{status:500,headers:corsHeaders});}
});