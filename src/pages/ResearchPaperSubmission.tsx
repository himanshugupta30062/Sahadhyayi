import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/authHelpers";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, FileUp, Loader2 } from "lucide-react";

export default function ResearchPaperSubmission(){
 const [params]=useSearchParams(); const kind=params.get("kind")==="publish"?"publish":"contribute";
 const {user}=useAuth(); const [busy,setBusy]=useState(false);
 const [form,setForm]=useState({title:"",authors:"",abstract:"",doi:"",source_url:"",publication_year:"",paper_type:"article"});
 const [file,setFile]=useState<File|null>(null);
 const change=(key:string,value:string)=>setForm(p=>({...p,[key]:value}));
 async function submit(e:React.FormEvent){
  e.preventDefault(); if(!user){toast({title:"Sign in to submit a research paper",variant:"destructive"});return;}
  if(kind==="publish"&&!file){toast({title:"Upload the manuscript PDF",variant:"destructive"});return;}
  setBusy(true);let filePath:string|undefined;
  try{
   if(file){
    if(file.type!=="application/pdf"||file.size>50*1024*1024)throw new Error("Upload a PDF up to 50 MB.");
    filePath=user.id+"/"+crypto.randomUUID()+"/"+file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
    const {error}=await supabase.storage.from("research-paper-quarantine").upload(filePath,file,{contentType:"application/pdf",upsert:false});
    if(error)throw error;
   }
   const {data,error}=await supabase.functions.invoke("submit-research-paper",{body:{...form,publication_year:form.publication_year||null,submission_kind:kind,file_path:filePath}});
   if(error)throw error; if(data?.error)throw new Error(data.error);
   toast({title:"Research paper submitted",description:"Your contribution is pending moderator review."});
   window.location.assign("/my-research-submissions");
  }catch(err){if(filePath)await supabase.storage.from("research-paper-quarantine").remove([filePath]);toast({title:"Submission failed",description:err instanceof Error?err.message:"Please try again.",variant:"destructive"});}
  finally{setBusy(false);}
 }
 return <main className="min-h-screen bg-background"><SEO title={kind==="publish"?"Publish Research Paper | Sahadhyayi":"Add Research Paper | Sahadhyayi"} description="Contribute research to Sahadhyayi's scholarly catalogue."/><div className="mx-auto max-w-2xl px-4 py-8">
 <Link to="/research-papers" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4"/>Back to Research Papers</Link>
 <h1 className="text-3xl font-semibold">{kind==="publish"?"Publish your research paper":"Add a research paper"}</h1><p className="mt-2 text-muted-foreground">{kind==="publish"?"Share your original work. Manuscripts remain private until reviewed.":"Recommend a paper from a journal or repository for inclusion."}</p>
 <form onSubmit={submit} className="mt-6 space-y-5 rounded-xl border bg-card p-5">
 <div className="space-y-2"><Label htmlFor="rp-title">Paper title *</Label><Input id="rp-title" required minLength={3} maxLength={300} value={form.title} onChange={e=>change("title",e.target.value)}/></div>
 <div className="space-y-2"><Label htmlFor="rp-authors">Authors *</Label><Input id="rp-authors" required value={form.authors} maxLength={2000} placeholder="Names separated by commas" onChange={e=>change("authors",e.target.value)}/></div>
 <div className="space-y-2"><Label htmlFor="rp-abstract">Abstract / summary</Label><Textarea id="rp-abstract" rows={5} maxLength={12000} value={form.abstract} onChange={e=>change("abstract",e.target.value)}/></div>
 <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="rp-doi">DOI</Label><Input id="rp-doi" placeholder="10.xxxx/..." value={form.doi} onChange={e=>change("doi",e.target.value)}/></div><div className="space-y-2"><Label htmlFor="rp-year">Publication year</Label><Input id="rp-year" type="number" min={1600} max={new Date().getFullYear()+1} value={form.publication_year} onChange={e=>change("publication_year",e.target.value)}/></div></div>
 <div className="space-y-2"><Label htmlFor="rp-url">Publisher / repository URL</Label><Input id="rp-url" type="url" placeholder="https://" value={form.source_url} onChange={e=>change("source_url",e.target.value)}/></div>
 <div className="space-y-2"><Label htmlFor="rp-type">Paper type</Label><select id="rp-type" className="h-10 w-full rounded-md border bg-background px-3" value={form.paper_type} onChange={e=>change("paper_type",e.target.value)}>{["article","review","preprint","conference-paper","book-chapter","other"].map(x=><option key={x} value={x}>{x.replace("-"," ")}</option>)}</select></div>
 {kind==="publish"&&<div className="space-y-2"><Label htmlFor="rp-file">Manuscript PDF * (max 50 MB)</Label><Input id="rp-file" type="file" accept="application/pdf" required onChange={e=>setFile(e.target.files?.[0]||null)}/><p className="text-xs text-muted-foreground">Stored privately in review quarantine; not publicly downloadable.</p></div>}
 <Button type="submit" disabled={busy} className="w-full">{busy?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<FileUp className="mr-2 h-4 w-4"/>}{busy?"Submitting…":"Submit for review"}</Button>
 <p className="text-xs text-muted-foreground">Submissions are reviewed before being listed. Submit only work you own or are authorized to share.</p>
 </form></div></main>;
}
