import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const cors={ "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods":"POST, OPTIONS" };
const respond=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async req=>{
 if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
 if(req.method!=="POST") return respond({error:"Method not allowed"},405);
 const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_ANON_KEY");
 if(!url||!key) return respond({error:"Service unavailable"},500);
 const auth=req.headers.get("Authorization"); if(!auth) return respond({error:"Sign in required"},401);
 const db=createClient(url,key,{global:{headers:{Authorization:auth}}});
 const {data:{user},error:userError}=await db.auth.getUser(); if(userError||!user) return respond({error:"Invalid session"},401);
 try{
  const body=await req.json(); if(!body||typeof body!=="object") return respond({error:"Invalid body"},400);
  const title=String(body.title??"").trim(),authors=String(body.authors??"").trim(),abstract=String(body.abstract??"").trim();
  const rawDoi=String(body.doi??"").trim().toLowerCase();
  const doiPrefixes=["https://doi.org/","http://doi.org/","https://dx.doi.org/","http://dx.doi.org/"];
  const doi=doiPrefixes.reduce((value,prefix)=>value.startsWith(prefix)?value.slice(prefix.length):value,rawDoi);
  const sourceUrl=String(body.source_url??"").trim(),kind=body.submission_kind==="publish"?"publish":"contribute";
  if(title.length<3||title.length>300||authors.length<2||authors.length>2000||abstract.length>12000) return respond({error:"Title, authors or abstract are invalid."},400);
  const doiSeparator=doi.indexOf("/");
  const doiRegistrant=doi.slice(0,doiSeparator);
  const doiSuffix=doi.slice(doiSeparator+1);
  const validDoi=!doi||(doiSeparator>0&&doiRegistrant.startsWith("10.")&&/^\d{4,9}$/.test(doiRegistrant.slice(3))&&doiSuffix.length>0&&/^[\w.();:+-]+$/i.test(doiSuffix));
  if(!validDoi) return respond({error:"Please enter a valid DOI."},400);
  if(sourceUrl){try{const u=new URL(sourceUrl);if(!["https:","http:"].includes(u.protocol))throw 0;}catch{return respond({error:"Source URL must be a valid http(s) link."},400);}}
  const year=body.publication_year==null||body.publication_year===""?null:Number(body.publication_year);
  if(year!==null&&(!Number.isInteger(year)||year<1600||year>new Date().getFullYear()+1)) return respond({error:"Publication year is invalid."},400);
  const {data:existing}=await db.from("research_paper_submissions").select("id,status").eq("doi",doi||"__none__").maybeSingle();
  if(existing) return respond({error:"A submission with this DOI already exists.",duplicate:true},409);
  const type=String(body.paper_type||"article");
  if(!["article","review","preprint","conference-paper","book-chapter","other"].includes(type)) return respond({error:"Invalid paper type."},400);
  const {data,error}=await db.from("research_paper_submissions").insert({submitter_id:user.id,submission_kind:kind,title,authors,abstract:abstract||null,doi:doi||null,source_url:sourceUrl||null,publication_year:year,paper_type:type,file_path:body.file_path||null}).select("id,title,status,created_at").single();
  if(error){if(error.code==="23505")return respond({error:"This DOI has already been submitted."},409);console.error(error);return respond({error:"Could not save submission."},500);}
  return respond({submission:data},201);
 }catch(e){console.error(e);return respond({error:"Invalid request."},400);}
});
