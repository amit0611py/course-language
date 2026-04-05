import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { A } from "../theme";
import { Badge, Button, Input, Select, Card, Spinner, Toast } from "../components/ui";

type MainTab = "tier" | "plans" | "users" | "interviews" | "coding" | "videos";

// ── Tier badge ────────────────────────────────────────────────────────────────
function TierBadge({ tier }: { tier: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
      display: "inline-block",
      background: tier === "premium" ? "rgba(188,140,255,.15)" : "rgba(63,185,80,.1)",
      color:      tier === "premium" ? "#bc8cff" : "#3fb950",
      border:     `1px solid ${tier === "premium" ? "#bc8cff44" : "#3fb95044"}`,
    }}>
      {tier === "premium" ? "🔒 Premium" : "✓ Free"}
    </span>
  );
}

// ── Cascading Tier Manager ────────────────────────────────────────────────────
// Language → Section → Topic (depth 1) → Topic (depth 2) → Topic (depth 3)
// Each level shows a dropdown. Selecting a level lets you set the tier for
// that scope (and optionally cascade into children).

function TierManager() {
  const [langSlug,    setLangSlug]    = useState("");
  const [sectionSlug, setSectionSlug] = useState("");
  const [topicPath1,  setTopicPath1]  = useState(""); // depth 1
  const [topicPath2,  setTopicPath2]  = useState(""); // depth 2
  const [topicPath3,  setTopicPath3]  = useState(""); // depth 3
  const [targetTier,  setTargetTier]  = useState<"free"|"premium">("premium");
  const [cascade,     setCascade]     = useState(true);
  const [setLang,     setSetLang]     = useState(false); // also set the language row itself
  const [toast,       setToast]       = useState<{ msg: string; type: "success"|"error" }|null>(null);

  // Languages
  const langsQ = useQuery({
    queryKey: ["admin", "languages"],
    queryFn: () => api.get("/languages").then(r => r.data.languages),
  });

  // Sections for chosen language
  const sectionsQ = useQuery({
    queryKey: ["admin", "paid-sections", langSlug],
    queryFn: () => api.get(`/paid/sections/${langSlug}`).then(r => r.data.sections),
    enabled: !!langSlug,
  });

  // Topics depth-1 for chosen section
  const topics1Q = useQuery({
    queryKey: ["admin", "paid-topics1", langSlug, sectionSlug],
    queryFn: () => api.get(`/paid/topics-tree/${langSlug}`, { params: { sectionSlug } }).then(r => r.data.topics),
    enabled: !!langSlug && !!sectionSlug,
  });

  // Topics depth-2 under chosen depth-1 topic
  const topics2Q = useQuery({
    queryKey: ["admin", "paid-topics2", topicPath1],
    queryFn: () => api.get(`/paid/topics-tree/${langSlug}`, { params: { parentPath: topicPath1 } }).then(r => r.data.topics),
    enabled: !!topicPath1,
  });

  // Topics depth-3 under chosen depth-2 topic
  const topics3Q = useQuery({
    queryKey: ["admin", "paid-topics3", topicPath2],
    queryFn: () => api.get(`/paid/topics-tree/${langSlug}`, { params: { parentPath: topicPath2 } }).then(r => r.data.topics),
    enabled: !!topicPath2,
  });

  const applyMut = useMutation({
    mutationFn: (body: object) => api.post("/paid/tier-by-language", body).then(r => r.data),
  });

  // Reset downstream when parent changes
  useEffect(() => { setSectionSlug(""); setTopicPath1(""); setTopicPath2(""); setTopicPath3(""); }, [langSlug]);
  useEffect(() => { setTopicPath1(""); setTopicPath2(""); setTopicPath3(""); }, [sectionSlug]);
  useEffect(() => { setTopicPath2(""); setTopicPath3(""); }, [topicPath1]);
  useEffect(() => { setTopicPath3(""); }, [topicPath2]);

  const handleApply = async () => {
    // Most specific selected scope wins
    const topicPath = topicPath3 || topicPath2 || topicPath1 || "";
    try {
      await applyMut.mutateAsync({
        languageSlug: langSlug,
        sectionSlug: sectionSlug || undefined,
        topicPath: topicPath || undefined,
        tier: targetTier,
        setLanguage: !topicPath && !sectionSlug && setLang,
      });
      const scope = topicPath ? `topic "${topicPath}"` : sectionSlug ? `section "${sectionSlug}"` : `language "${langSlug}"`;
      setToast({ msg: `Set ${scope} → ${targetTier}`, type: "success" });
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, type: "error" });
    }
  };

  const langs    = (langsQ.data ?? []) as { slug: string; name: string; content_tier?: string }[];
  const sections = (sectionsQ.data ?? []) as { slug: string; title: string }[];
  const topics1  = (topics1Q.data ?? []) as { path: string; title: string; content_tier: string }[];
  const topics2  = (topics2Q.data ?? []) as { path: string; title: string; content_tier: string }[];
  const topics3  = (topics3Q.data ?? []) as { path: string; title: string; content_tier: string }[];

  const currentLang = langs.find(l => l.slug === langSlug);

  return (
    <div>
      <p style={{ color: A.muted, fontSize: 13, marginBottom: 20 }}>
        Select the scope you want to update. Each dropdown narrows the target.
        The most-specific selected level will be updated.
      </p>

      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Level 1 — Language */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: A.muted, letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Language
            </label>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Select value={langSlug} onChange={e => setLangSlug(e.target.value)}
                options={[{ value: "", label: "Select language…" }, ...langs.map(l => ({ value: l.slug, label: l.name }))]}
                style={{ flex: 1 }} />
              {currentLang && <TierBadge tier={currentLang.content_tier ?? "free"} />}
            </div>
          </div>

          {/* Level 2 — Section */}
          {langSlug && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: A.muted, letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Section <span style={{ color: A.dim, fontWeight: 400 }}>(optional — leave blank to target all sections)</span>
              </label>
              {sectionsQ.isLoading ? <Spinner size={16} /> : (
                <Select value={sectionSlug} onChange={e => setSectionSlug(e.target.value)}
                  options={[{ value: "", label: "All sections" }, ...sections.map(s => ({ value: s.slug, label: s.title }))]}
                  style={{ flex: 1 }} />
              )}
            </div>
          )}

          {/* Level 3 — Topic depth 1 */}
          {sectionSlug && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: A.muted, letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Topic <span style={{ color: A.dim, fontWeight: 400 }}>(optional)</span>
              </label>
              {topics1Q.isLoading ? <Spinner size={16} /> : (
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <Select value={topicPath1} onChange={e => setTopicPath1(e.target.value)}
                    options={[{ value: "", label: "All topics in section" }, ...topics1.map(t => ({ value: t.path, label: t.title }))]}
                    style={{ flex: 1 }} />
                  {topicPath1 && <TierBadge tier={topics1.find(t => t.path === topicPath1)?.content_tier ?? "free"} />}
                </div>
              )}
            </div>
          )}

          {/* Level 4 — Topic depth 2 */}
          {topicPath1 && topics2.length > 0 && (
            <div style={{ marginLeft: 24 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: A.muted, letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Sub-topic <span style={{ color: A.dim, fontWeight: 400 }}>(optional)</span>
              </label>
              {topics2Q.isLoading ? <Spinner size={16} /> : (
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <Select value={topicPath2} onChange={e => setTopicPath2(e.target.value)}
                    options={[{ value: "", label: "All sub-topics" }, ...topics2.map(t => ({ value: t.path, label: t.title }))]}
                    style={{ flex: 1 }} />
                  {topicPath2 && <TierBadge tier={topics2.find(t => t.path === topicPath2)?.content_tier ?? "free"} />}
                </div>
              )}
            </div>
          )}

          {/* Level 5 — Topic depth 3 */}
          {topicPath2 && topics3.length > 0 && (
            <div style={{ marginLeft: 48 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: A.muted, letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Deep dive <span style={{ color: A.dim, fontWeight: 400 }}>(optional)</span>
              </label>
              {topics3Q.isLoading ? <Spinner size={16} /> : (
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <Select value={topicPath3} onChange={e => setTopicPath3(e.target.value)}
                    options={[{ value: "", label: "All deep dives" }, ...topics3.map(t => ({ value: t.path, label: t.title }))]}
                    style={{ flex: 1 }} />
                  {topicPath3 && <TierBadge tier={topics3.find(t => t.path === topicPath3)?.content_tier ?? "free"} />}
                </div>
              )}
            </div>
          )}

          {/* Target tier */}
          {langSlug && (
            <>
              <div style={{ borderTop: `1px solid ${A.border}`, paddingTop: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: A.muted, letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                  Set to
                </label>
                <div style={{ display: "flex", gap: 10 }}>
                  {(["free", "premium"] as const).map(t => (
                    <button key={t} onClick={() => setTargetTier(t)} style={{
                      flex: 1, padding: "10px 0", borderRadius: 9, cursor: "pointer",
                      border: `1px solid ${targetTier === t ? (t==="premium"?"#bc8cff":"#3fb950") : A.border}`,
                      background: targetTier === t ? (t==="premium"?"rgba(188,140,255,.12)":"rgba(63,185,80,.1)") : "transparent",
                      color: targetTier === t ? (t==="premium"?"#bc8cff":"#3fb950") : A.muted,
                      fontWeight: 700, fontSize: 14, fontFamily: "inherit",
                    }}>
                      {t === "premium" ? "🔒 Premium" : "✓ Free"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div style={{ display: "flex", gap: 24 }}>
                {!sectionSlug && !topicPath1 && (
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: A.text }}>
                    <input type="checkbox" checked={setLang} onChange={e => setSetLang(e.target.checked)} />
                    Also set the language tier itself
                  </label>
                )}
              </div>

              {/* Scope summary */}
              <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ fontSize: 12, color: A.muted }}>
                  Will update: <span style={{ color: A.text, fontWeight: 600 }}>
                    {topicPath3 ? `topic "${topicPath3}" and its children` :
                     topicPath2 ? `topic "${topicPath2}" and its children` :
                     topicPath1 ? `topic "${topicPath1}" and its children` :
                     sectionSlug ? `all topics in section "${sectionSlug}"` :
                     `all topics in language "${langSlug}"`}
                    {!sectionSlug && !topicPath1 && setLang ? " + language itself" : ""}
                  </span>
                </div>
              </div>

              <Button variant="primary" onClick={handleApply} loading={applyMut.isPending} disabled={!langSlug}>
                Apply Tier Change
              </Button>
            </>
          )}
        </div>
      </Card>

      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}

// ── Plans Manager ─────────────────────────────────────────────────────────────
function PlansManager() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success"|"error" }|null>(null);
  const [form, setForm] = useState({
    name: "", plan_type: "monthly_all", languageSlug: "",
    price_inr: "", price_usd: "", duration_days: "", sort_order: "0",
  });
  const [tokenPlanId, setTokenPlanId] = useState("");
  const [tokenQty, setTokenQty] = useState("1");
  const [generatedTokens, setGeneratedTokens] = useState<string[]>([]);

  const plansQ = useQuery({ queryKey: ["admin","plans"], queryFn: () => api.get("/paid/plans").then(r => r.data.plans) });
  const langsQ = useQuery({ queryKey: ["admin","languages"], queryFn: () => api.get("/languages").then(r => r.data.languages) });

  const createMut = useMutation({
    mutationFn: (body: object) => api.post("/paid/plans", body).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin","plans"] }); setShowForm(false); setToast({ msg: "Plan created", type: "success" }); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/paid/plans/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin","plans"] }),
  });

  const handleCreate = () => createMut.mutate({
    ...form,
    price_inr: form.price_inr ? Number(form.price_inr) : null,
    price_usd: form.price_usd ? Number(form.price_usd) : null,
    duration_days: form.duration_days ? Number(form.duration_days) : null,
    sort_order: Number(form.sort_order),
  });

  const handleGenToken = async () => {
    const r = await api.post(`/paid/plans/${tokenPlanId}/generate-token`, { quantity: Number(tokenQty) });
    setGeneratedTokens(r.data.tokens);
  };

  const plans = (plansQ.data ?? []) as { id: string; name: string; plan_type: string; language_slug?: string; price_inr?: number; duration_days?: number; is_active: boolean }[];
  const langs = (langsQ.data ?? []) as { slug: string; name: string }[];
  const isLangPlan = (pt: string) => pt.includes("lang");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <p style={{ color: A.muted, fontSize: 13 }}>Define subscription plans. Generate activation tokens for manual delivery.</p>
        <Button variant="primary" onClick={() => setShowForm(true)}>+ New Plan</Button>
      </div>

      {/* Plan list */}
      <div style={{ background: A.card, border: `1px solid ${A.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
        {plansQ.isLoading ? <div style={{ padding: 40, textAlign: "center" }}><Spinner size={24} /></div> :
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${A.border}` }}>
              {["Name","Type","Language","Price (INR)","Duration","Tokens",""].map((h,i) => (
                <th key={i} style={{ padding:"10px 16px",textAlign:"left",fontSize:10,fontWeight:700,color:A.dim,letterSpacing:0.5,textTransform:"uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plans.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: i < plans.length-1 ? `1px solid ${A.border}` : "none" }}>
                <td style={{ padding:"10px 16px",color:A.text,fontSize:13,fontWeight:600 }}>{p.name}</td>
                <td style={{ padding:"10px 16px" }}><Badge color={A.purple}>{p.plan_type}</Badge></td>
                <td style={{ padding:"10px 16px",color:A.muted,fontSize:12 }}>{p.language_slug ?? "All"}</td>
                <td style={{ padding:"10px 16px",color:A.text,fontSize:13 }}>{p.price_inr ? `₹${p.price_inr}` : "—"}</td>
                <td style={{ padding:"10px 16px",color:A.muted,fontSize:12 }}>{p.duration_days ? `${p.duration_days}d` : "Lifetime"}</td>
                <td style={{ padding:"10px 16px" }}>
                  <button onClick={() => setTokenPlanId(p.id)}
                    style={{ fontSize:11,color:A.blue,background:"none",border:"none",cursor:"pointer" }}>
                    Generate
                  </button>
                </td>
                <td style={{ padding:"10px 16px" }}>
                  <Button size="sm" variant="danger" onClick={() => deleteMut.mutate(p.id)}>Deactivate</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>}
      </div>

      {/* Token generator */}
      {tokenPlanId && (
        <Card style={{ marginBottom: 24 }}>
          <div style={{ fontSize:13,fontWeight:700,color:A.text,marginBottom:12 }}>Generate Activation Tokens</div>
          <div style={{ display:"flex",gap:10,alignItems:"center",marginBottom:12 }}>
            <Input label="Quantity" type="number" value={tokenQty} onChange={e => setTokenQty(e.target.value)} style={{ width:100 }} />
            <Button variant="primary" onClick={handleGenToken} style={{ marginTop:18 }}>Generate</Button>
            <Button onClick={() => { setTokenPlanId(""); setGeneratedTokens([]); }} style={{ marginTop:18 }}>Cancel</Button>
          </div>
          {generatedTokens.length > 0 && (
            <div>
              <div style={{ fontSize:11,color:A.muted,marginBottom:6 }}>Share these tokens with users. Each can be used once.</div>
              {generatedTokens.map(t => (
                <div key={t} style={{ fontFamily:"monospace",fontSize:12,color:A.text,background:A.surface,padding:"6px 12px",borderRadius:6,border:`1px solid ${A.border}`,marginBottom:4 }}>{t}</div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Create plan modal */}
      {showForm && (
        <div style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
          <div style={{ background:A.card,border:`1px solid ${A.border}`,borderRadius:16,padding:"28px 32px",width:"100%",maxWidth:500 }}>
            <h2 style={{ color:A.text,fontSize:16,fontWeight:700,margin:"0 0 20px" }}>New Subscription Plan</h2>
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              <Input label="Plan name *" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
              <Select label="Plan type *" value={form.plan_type} onChange={e => setForm(f=>({...f,plan_type:e.target.value}))}
                options={[
                  {value:"monthly_all",label:"Monthly — All Languages"},
                  {value:"yearly_all",label:"Yearly — All Languages"},
                  {value:"lifetime_all",label:"Lifetime — All Languages"},
                  {value:"monthly_lang",label:"Monthly — Single Language"},
                  {value:"yearly_lang",label:"Yearly — Single Language"},
                ]} />
              {isLangPlan(form.plan_type) && (
                <Select label="Language *" value={form.languageSlug} onChange={e => setForm(f=>({...f,languageSlug:e.target.value}))}
                  options={[{value:"",label:"Select…"},...langs.map(l=>({value:l.slug,label:l.name}))]} />
              )}
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                <Input label="Price INR" type="number" value={form.price_inr} onChange={e => setForm(f=>({...f,price_inr:e.target.value}))} />
                <Input label="Price USD" type="number" value={form.price_usd} onChange={e => setForm(f=>({...f,price_usd:e.target.value}))} />
              </div>
              <Input label="Duration (days — blank = lifetime)" type="number" value={form.duration_days} onChange={e => setForm(f=>({...f,duration_days:e.target.value}))} />
            </div>
            <div style={{ display:"flex",gap:10,marginTop:20 }}>
              <Button style={{ flex:1 }} onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" style={{ flex:1 }} onClick={handleCreate} loading={createMut.isPending} disabled={!form.name}>Create Plan</Button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}

// ── Users Manager ─────────────────────────────────────────────────────────────
function UsersManager() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [premFilter, setPremFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<string|null>(null);
  const [grantPlanId, setGrantPlanId] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success"|"error" }|null>(null);

  const usersQ = useQuery({
    queryKey: ["admin","users",search,premFilter],
    queryFn: () => api.get("/paid/users", { params: { search: search||undefined, isPremium: premFilter||undefined, limit:50, offset:0 } }).then(r=>r.data),
  });

  const userDetailQ = useQuery({
    queryKey: ["admin","user",selectedUser],
    queryFn: () => api.get(`/paid/users/${selectedUser}`).then(r=>r.data),
    enabled: !!selectedUser,
  });

  const plansQ = useQuery({ queryKey: ["admin","plans"], queryFn: () => api.get("/paid/plans").then(r=>r.data.plans) });

  const grantMut = useMutation({
    mutationFn: ({ userId, planId }: { userId: string; planId: string }) =>
      api.post(`/paid/users/${userId}/grant-subscription`, { planId }).then(r=>r.data),
    onSuccess: () => { qc.invalidateQueries({queryKey:["admin","users"]}); qc.invalidateQueries({queryKey:["admin","user",selectedUser]}); setToast({msg:"Subscription granted",type:"success"}); },
  });

  const revokeMut = useMutation({
    mutationFn: ({ userId, subId }: { userId: string; subId: string }) =>
      api.delete(`/paid/users/${userId}/subscriptions/${subId}`).then(r=>r.data),
    onSuccess: () => { qc.invalidateQueries({queryKey:["admin","user",selectedUser]}); setToast({msg:"Subscription revoked",type:"success"}); },
  });

  const users = (usersQ.data?.users ?? []) as { id:string;customer_id?:string;email?:string;mobile_number?:string;full_name?:string;email_verified?:boolean;mobile_verified?:boolean;is_premium:boolean;premium_scope:string;is_active:boolean;created_at:string;active_subs:number }[];
  const plans = (plansQ.data ?? []) as { id:string;name:string;plan_type:string }[];
  const userDetail = userDetailQ.data as { user:{id:string;customer_id?:string;email?:string;mobile_number?:string;full_name?:string;email_verified?:boolean;mobile_verified?:boolean;is_premium:boolean;premium_scope:string;premium_language_slugs:string[];is_active:boolean}; subscriptions:{id:string;plan_name:string;plan_type:string;language_slug?:string;ends_at?:string;is_active:boolean;payment_status:string;created_at:string}[] }|undefined;

  return (
    <div style={{ display:"flex",gap:20 }}>
      {/* User list */}
      <div style={{ flex:2 }}>
        <div style={{ display:"flex",gap:10,marginBottom:14 }}>
          <Input placeholder="Search email, mobile, name, ID…" value={search} onChange={e=>setSearch(e.target.value)} style={{ flex:1 }} />
          <Select value={premFilter} onChange={e=>setPremFilter(e.target.value)}
            options={[{value:"",label:"All users"},{value:"true",label:"Premium only"},{value:"false",label:"Free only"}]}
            style={{ width:140 }} />
        </div>

        <div style={{ background:A.card,border:`1px solid ${A.border}`,borderRadius:12,overflow:"hidden" }}>
          {usersQ.isLoading ? <div style={{ padding:40,textAlign:"center" }}><Spinner size={24} /></div> :
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${A.border}` }}>
                {["Customer ID","Contact","Name","Status","Subs",""].map((h,i)=>(
                  <th key={i} style={{ padding:"10px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:A.dim,letterSpacing:0.5,textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u,i)=>(
                <tr key={u.id} style={{ borderBottom:i<users.length-1?`1px solid ${A.border}`:"none",background:selectedUser===u.id?"rgba(88,166,255,.05)":"transparent",cursor:"pointer" }}
                  onClick={()=>setSelectedUser(u.id)}>
                  <td style={{ padding:"10px 14px" }}><code style={{ fontSize:10,color:A.blue }}>{u.customer_id??"-"}</code></td>
                  <td style={{ padding:"10px 14px",fontSize:11,lineHeight:1.6 }}>
                    {u.email && (
                      <div style={{ color:A.blue }}>
                        {u.email}
                        {u.email_verified && <span style={{ color:A.green,marginLeft:4,fontSize:10 }} title="Email verified">✓</span>}
                      </div>
                    )}
                    {u.mobile_number && (
                      <div style={{ color:A.cyan }}>
                        {u.mobile_number}
                        {u.mobile_verified && <span style={{ color:A.green,marginLeft:4,fontSize:10 }} title="Mobile verified">✓</span>}
                      </div>
                    )}
                    {!u.email && !u.mobile_number && <span style={{ color:A.dim }}>—</span>}
                  </td>
                  <td style={{ padding:"10px 14px",color:A.muted,fontSize:12 }}>{u.full_name??"—"}</td>
                  <td style={{ padding:"10px 14px" }}>
                    <Badge color={u.is_premium?"#bc8cff":A.muted}>{u.is_premium?"Premium":"Free"}</Badge>
                  </td>
                  <td style={{ padding:"10px 14px",color:A.text,fontSize:13 }}>{u.active_subs}</td>
                  <td style={{ padding:"10px 14px" }}>
                    <Button size="sm" onClick={e=>{e.stopPropagation();setSelectedUser(u.id)}}>Details</Button>
                  </td>
                </tr>
              ))}
              {users.length===0 && <tr><td colSpan={6} style={{ padding:"32px",textAlign:"center",color:A.dim }}>No users found</td></tr>}
            </tbody>
          </table>}
        </div>
      </div>

      {/* User detail panel */}
      {selectedUser && (
        <div style={{ flex:1,minWidth:320 }}>
          <Card>
            {userDetailQ.isLoading ? <Spinner size={24} /> : userDetail ? (
              <div>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16 }}>
                  <div>
                    {userDetail.user.customer_id && (
                      <div style={{ color:A.dim,fontSize:10,marginBottom:4 }}>
                        <code style={{ color:A.blue }}>{userDetail.user.customer_id}</code>
                      </div>
                    )}
                    <div style={{ color:A.text,fontWeight:700,fontSize:14 }}>{userDetail.user.full_name??"—"}</div>
                    {userDetail.user.email && (
                      <div style={{ color:A.blue,fontSize:12,marginTop:2 }}>
                        {userDetail.user.email}
                        {userDetail.user.email_verified
                          ? <span style={{ color:A.green,marginLeft:6,fontSize:10 }}>✓ verified</span>
                          : <span style={{ color:A.yellow,marginLeft:6,fontSize:10 }}>unverified</span>}
                      </div>
                    )}
                    {userDetail.user.mobile_number && (
                      <div style={{ color:A.cyan,fontSize:12,marginTop:2 }}>
                        📱 {userDetail.user.mobile_number}
                        {userDetail.user.mobile_verified
                          ? <span style={{ color:A.green,marginLeft:6,fontSize:10 }}>✓ verified</span>
                          : <span style={{ color:A.yellow,marginLeft:6,fontSize:10 }}>unverified</span>}
                      </div>
                    )}
                  </div>
                  <button onClick={()=>setSelectedUser(null)} style={{ background:"none",border:"none",color:A.dim,cursor:"pointer",fontSize:18 }}>×</button>
                </div>

                <div style={{ display:"flex",gap:8,marginBottom:16,flexWrap:"wrap" }}>
                  <Badge color={userDetail.user.is_premium?"#bc8cff":A.muted}>{userDetail.user.is_premium?"Premium":"Free"}</Badge>
                  <Badge color={A.blue}>{userDetail.user.premium_scope}</Badge>
                  {userDetail.user.premium_language_slugs.map(s=><Badge key={s} color={A.cyan}>{s}</Badge>)}
                </div>

                {/* Subscriptions */}
                <div style={{ fontSize:12,fontWeight:700,color:A.text,marginBottom:8 }}>Subscriptions</div>
                {userDetail.subscriptions.map(s=>(
                  <div key={s.id} style={{ background:A.surface,border:`1px solid ${A.border}`,borderRadius:8,padding:"10px 12px",marginBottom:6 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                      <div>
                        <div style={{ color:A.text,fontSize:12,fontWeight:600 }}>{s.plan_name}</div>
                        <div style={{ color:A.dim,fontSize:10 }}>{s.language_slug??'All'} · {s.ends_at?`expires ${new Date(s.ends_at).toLocaleDateString()}`:"Lifetime"}</div>
                      </div>
                      <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                        <Badge color={s.is_active?A.green:A.red}>{s.is_active?"Active":"Inactive"}</Badge>
                        {s.is_active && (
                          <Button size="sm" variant="danger" onClick={()=>revokeMut.mutate({userId:selectedUser,subId:s.id})}>Revoke</Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Grant subscription */}
                <div style={{ marginTop:14,borderTop:`1px solid ${A.border}`,paddingTop:14 }}>
                  <div style={{ fontSize:12,fontWeight:700,color:A.text,marginBottom:8 }}>Grant Subscription</div>
                  <Select value={grantPlanId} onChange={e=>setGrantPlanId(e.target.value)}
                    options={[{value:"",label:"Select plan…"},...plans.map(p=>({value:p.id,label:p.name}))]} />
                  <Button variant="primary" style={{ width:"100%",marginTop:8 }}
                    onClick={()=>grantMut.mutate({userId:selectedUser,planId:grantPlanId})}
                    loading={grantMut.isPending} disabled={!grantPlanId}>
                    Grant
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}

// ── Main PaidContent page ─────────────────────────────────────────────────────
export default function PaidContent() {
  const [tab, setTab] = useState<MainTab>("tier");

  const tabs: { id: MainTab; icon: string; label: string }[] = [
    { id: "tier",       icon: "🔒", label: "Content Tiers"   },
    { id: "plans",      icon: "💳", label: "Plans & Tokens"  },
    { id: "users",      icon: "👤", label: "Users"           },
    { id: "interviews", icon: "🧠", label: "Interview Q&A"   },
    { id: "coding",     icon: "💻", label: "Coding"          },
    { id: "videos",     icon: "🎥", label: "Videos"          },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: A.text, margin: 0 }}>Paid Content</h1>
        <p style={{ fontSize: 13, color: A.muted, marginTop: 4 }}>
          Manage content tiers, subscriptions, users, and premium content
        </p>
      </div>

      <div style={{ display:"flex",gap:4,borderBottom:`1px solid ${A.border}`,marginBottom:24 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",
            padding:"8px 16px",fontSize:13,fontWeight:600,
            color: tab === t.id ? A.blue : A.muted,
            borderBottom: `2px solid ${tab === t.id ? A.blue : "transparent"}`,
            marginBottom:-1,
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "tier"       && <TierManager />}
      {tab === "plans"      && <PlansManager />}
      {tab === "users"      && <UsersManager />}
      {tab === "interviews" && <InterviewsTab />}
      {tab === "coding"     && <CodingTab />}
      {tab === "videos"     && <VideosTab />}
    </div>
  );
}

// ── Lightweight interview/coding/video tabs ───────────────────────────────────
function InterviewsTab() {
  const qc = useQueryClient();
  const [lang, setLang] = useState("java");
  const [toast, setToast] = useState<{ msg: string; type: "success"|"error" }|null>(null);
  const [form, setForm] = useState({ question:"",answer:"",answer_snippet:"",difficulty:"intermediate",category:"technical",tags:"",content_tier:"premium" });
  const [showForm, setShowForm] = useState(false);

  const q = useQuery({ queryKey:["admin","interviews",lang], queryFn: ()=>api.get("/paid/interviews",{params:{languageSlug:lang}}).then(r=>r.data) });
  const createMut = useMutation({
    mutationFn: (body: object) => api.post("/paid/interviews", body).then(r=>r.data),
    onSuccess: ()=>{ qc.invalidateQueries({queryKey:["admin","interviews"]}); setShowForm(false); setToast({msg:"Created",type:"success"}); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/paid/interviews/${id}`).then(r=>r.data),
    onSuccess: ()=>qc.invalidateQueries({queryKey:["admin","interviews"]}),
  });

  const questions = (q.data?.questions ?? []) as { id:string;question:string;difficulty:string;category:string;content_tier:string }[];

  return (
    <div>
      <div style={{ display:"flex",gap:10,marginBottom:16 }}>
        <Input placeholder="Language slug" value={lang} onChange={e=>setLang(e.target.value)} style={{ width:160 }} />
        <Button variant="primary" onClick={()=>setShowForm(true)}>+ Add Question</Button>
      </div>
      <div style={{ background:A.card,border:`1px solid ${A.border}`,borderRadius:12,overflow:"hidden" }}>
        {q.isLoading?<div style={{ padding:40,textAlign:"center" }}><Spinner size={24}/></div>:
        <table style={{ width:"100%",borderCollapse:"collapse" }}>
          <thead><tr style={{ borderBottom:`1px solid ${A.border}` }}>{["Question","Difficulty","Category","Tier",""].map((h,i)=><th key={i} style={{ padding:"10px 16px",textAlign:"left",fontSize:10,fontWeight:700,color:A.dim,letterSpacing:0.5,textTransform:"uppercase" }}>{h}</th>)}</tr></thead>
          <tbody>
            {questions.map((q,i)=>(
              <tr key={q.id} style={{ borderBottom:i<questions.length-1?`1px solid ${A.border}`:"none" }}>
                <td style={{ padding:"10px 16px",color:A.text,fontSize:12,maxWidth:300 }}>{q.question}</td>
                <td style={{ padding:"10px 16px" }}><Badge color={A.yellow}>{q.difficulty}</Badge></td>
                <td style={{ padding:"10px 16px",color:A.muted,fontSize:11 }}>{q.category}</td>
                <td style={{ padding:"10px 16px" }}><TierBadge tier={q.content_tier}/></td>
                <td style={{ padding:"10px 16px" }}><Button size="sm" variant="danger" onClick={()=>{if(confirm("Delete?"))deleteMut.mutate(q.id)}}>Delete</Button></td>
              </tr>
            ))}
            {questions.length===0&&<tr><td colSpan={5} style={{ padding:32,textAlign:"center",color:A.dim }}>No questions for "{lang}" yet</td></tr>}
          </tbody>
        </table>}
      </div>
      {showForm&&(
        <div style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
          <div style={{ background:A.card,border:`1px solid ${A.border}`,borderRadius:16,padding:"28px 32px",width:"100%",maxWidth:580,maxHeight:"90vh",overflowY:"auto" }}>
            <h2 style={{ color:A.text,fontSize:16,fontWeight:700,margin:"0 0 16px" }}>New Interview Question</h2>
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              <div><label style={{ fontSize:11,fontWeight:700,color:A.muted,letterSpacing:0.5,textTransform:"uppercase",display:"block",marginBottom:4 }}>Question *</label><textarea value={form.question} onChange={e=>setForm(f=>({...f,question:e.target.value}))} rows={2} style={{ width:"100%",background:A.surface,border:`1px solid ${A.border}`,borderRadius:8,color:A.text,fontSize:13,padding:"8px 12px",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit" }}/></div>
              <div><label style={{ fontSize:11,fontWeight:700,color:A.muted,letterSpacing:0.5,textTransform:"uppercase",display:"block",marginBottom:4 }}>Full Answer (Premium) *</label><textarea value={form.answer} onChange={e=>setForm(f=>({...f,answer:e.target.value}))} rows={5} style={{ width:"100%",background:A.surface,border:`1px solid ${A.border}`,borderRadius:8,color:A.text,fontSize:13,padding:"8px 12px",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit" }}/></div>
              <div><label style={{ fontSize:11,fontWeight:700,color:A.muted,letterSpacing:0.5,textTransform:"uppercase",display:"block",marginBottom:4 }}>Free Snippet (~100 words shown to non-premium)</label><textarea value={form.answer_snippet} onChange={e=>setForm(f=>({...f,answer_snippet:e.target.value}))} rows={2} style={{ width:"100%",background:A.surface,border:`1px solid ${A.border}`,borderRadius:8,color:A.text,fontSize:13,padding:"8px 12px",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit" }}/></div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                <Select label="Difficulty" value={form.difficulty} onChange={e=>setForm(f=>({...f,difficulty:e.target.value}))} options={["beginner","intermediate","advanced","expert"].map(d=>({value:d,label:d.charAt(0).toUpperCase()+d.slice(1)}))} />
                <Select label="Tier" value={form.content_tier} onChange={e=>setForm(f=>({...f,content_tier:e.target.value}))} options={[{value:"premium",label:"🔒 Premium"},{value:"free",label:"✓ Free"}]} />
              </div>
              <Input label="Tags (comma separated)" value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="java, oop, polymorphism" />
            </div>
            <div style={{ display:"flex",gap:10,marginTop:20 }}>
              <Button style={{ flex:1 }} onClick={()=>setShowForm(false)}>Cancel</Button>
              <Button variant="primary" style={{ flex:1 }} onClick={()=>createMut.mutate({languageSlug:lang,...form,tags:form.tags.split(",").map((t:string)=>t.trim()).filter(Boolean)})} loading={createMut.isPending} disabled={!form.question||!form.answer}>Create</Button>
            </div>
          </div>
        </div>
      )}
      {toast&&<Toast msg={toast.msg} type={toast.type} onDismiss={()=>setToast(null)}/>}
    </div>
  );
}

function CodingTab() {
  const qc = useQueryClient();
  const [lang, setLang] = useState("java");
  const [toast, setToast] = useState<{ msg: string; type: "success"|"error" }|null>(null);
  const q = useQuery({ queryKey:["admin","coding",lang], queryFn: ()=>api.get("/paid/coding",{params:{languageSlug:lang}}).then(r=>r.data) });
  const deleteMut = useMutation({
    mutationFn: (slug: string) => api.delete(`/paid/coding/${slug}`).then(r=>r.data),
    onSuccess: ()=>{ qc.invalidateQueries({queryKey:["admin","coding"]}); setToast({msg:"Deleted",type:"success"}); },
  });
  const challenges = (q.data?.challenges ?? []) as { id:string;slug:string;title:string;difficulty:string;content_tier:string }[];
  return (
    <div>
      <Input placeholder="Language slug" value={lang} onChange={e=>setLang(e.target.value)} style={{ width:160,marginBottom:16 }}/>
      <div style={{ background:A.card,border:`1px solid ${A.border}`,borderRadius:12,overflow:"hidden" }}>
        {q.isLoading?<div style={{ padding:40,textAlign:"center" }}><Spinner size={24}/></div>:
        <table style={{ width:"100%",borderCollapse:"collapse" }}>
          <thead><tr style={{ borderBottom:`1px solid ${A.border}` }}>{["Title","Slug","Difficulty","Tier",""].map((h,i)=><th key={i} style={{ padding:"10px 16px",textAlign:"left",fontSize:10,fontWeight:700,color:A.dim,letterSpacing:0.5,textTransform:"uppercase" }}>{h}</th>)}</tr></thead>
          <tbody>
            {challenges.map((c,i)=>(
              <tr key={c.id} style={{ borderBottom:i<challenges.length-1?`1px solid ${A.border}`:"none" }}>
                <td style={{ padding:"10px 16px",color:A.text,fontSize:13 }}>{c.title}</td>
                <td style={{ padding:"10px 16px" }}><code style={{ fontSize:11,color:A.blue }}>{c.slug}</code></td>
                <td style={{ padding:"10px 16px" }}><Badge color={A.yellow}>{c.difficulty}</Badge></td>
                <td style={{ padding:"10px 16px" }}><TierBadge tier={c.content_tier}/></td>
                <td style={{ padding:"10px 16px" }}><Button size="sm" variant="danger" onClick={()=>{if(confirm("Delete?"))deleteMut.mutate(c.slug)}}>Delete</Button></td>
              </tr>
            ))}
            {challenges.length===0&&<tr><td colSpan={5} style={{ padding:32,textAlign:"center",color:A.dim }}>No challenges yet</td></tr>}
          </tbody>
        </table>}
      </div>
      {toast&&<Toast msg={toast.msg} type={toast.type} onDismiss={()=>setToast(null)}/>}
    </div>
  );
}

function VideosTab() {
  const qc = useQueryClient();
  const [toast, setToast] = useState<{ msg: string; type: "success"|"error" }|null>(null);
  const [form, setForm] = useState({ content_id:"",content_type:"topic",title:"",cdn_url:"",thumbnail_url:"",duration_seconds:"",content_tier:"premium" });
  const [showForm, setShowForm] = useState(false);
  const q = useQuery({ queryKey:["admin","videos"], queryFn: ()=>api.get("/paid/videos").then(r=>r.data) });
  const createMut = useMutation({
    mutationFn: (body: object) => api.post("/paid/videos", body).then(r=>r.data),
    onSuccess: ()=>{ qc.invalidateQueries({queryKey:["admin","videos"]}); setShowForm(false); setToast({msg:"Video added",type:"success"}); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/paid/videos/${id}`).then(r=>r.data),
    onSuccess: ()=>{ qc.invalidateQueries({queryKey:["admin","videos"]}); setToast({msg:"Deleted",type:"success"}); },
  });
  const videos = (q.data?.videos ?? []) as { id:string;title:string;content_type:string;cdn_url:string;content_tier:string;duration_seconds?:number }[];
  return (
    <div>
      <div style={{ display:"flex",justifyContent:"flex-end",marginBottom:16 }}><Button variant="primary" onClick={()=>setShowForm(true)}>+ Add Video</Button></div>
      <div style={{ background:A.card,border:`1px solid ${A.border}`,borderRadius:12,overflow:"hidden" }}>
        {q.isLoading?<div style={{ padding:40,textAlign:"center" }}><Spinner size={24}/></div>:
        <table style={{ width:"100%",borderCollapse:"collapse" }}>
          <thead><tr style={{ borderBottom:`1px solid ${A.border}` }}>{["Title","Type","Duration","CDN URL","Tier",""].map((h,i)=><th key={i} style={{ padding:"10px 16px",textAlign:"left",fontSize:10,fontWeight:700,color:A.dim,letterSpacing:0.5,textTransform:"uppercase" }}>{h}</th>)}</tr></thead>
          <tbody>
            {videos.map((v,i)=>(
              <tr key={v.id} style={{ borderBottom:i<videos.length-1?`1px solid ${A.border}`:"none" }}>
                <td style={{ padding:"10px 16px",color:A.text,fontSize:13 }}>{v.title}</td>
                <td style={{ padding:"10px 16px" }}><Badge color={A.cyan}>{v.content_type}</Badge></td>
                <td style={{ padding:"10px 16px",color:A.muted,fontSize:11 }}>{v.duration_seconds?`${Math.floor(v.duration_seconds/60)}m`:"—"}</td>
                <td style={{ padding:"10px 16px",maxWidth:160 }}><code style={{ fontSize:10,color:A.muted,wordBreak:"break-all" }}>{v.cdn_url.slice(0,40)}…</code></td>
                <td style={{ padding:"10px 16px" }}><TierBadge tier={v.content_tier}/></td>
                <td style={{ padding:"10px 16px" }}><Button size="sm" variant="danger" onClick={()=>{if(confirm("Delete?"))deleteMut.mutate(v.id)}}>Delete</Button></td>
              </tr>
            ))}
            {videos.length===0&&<tr><td colSpan={6} style={{ padding:32,textAlign:"center",color:A.dim }}>No videos yet</td></tr>}
          </tbody>
        </table>}
      </div>
      {showForm&&(
        <div style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
          <div style={{ background:A.card,border:`1px solid ${A.border}`,borderRadius:16,padding:"28px 32px",width:"100%",maxWidth:500 }}>
            <h2 style={{ color:A.text,fontSize:16,fontWeight:700,margin:"0 0 16px" }}>Add Video (CDN URL)</h2>
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              <Input label="Content ID (UUID)" value={form.content_id} onChange={e=>setForm(f=>({...f,content_id:e.target.value}))} placeholder="topic or project UUID" />
              <Select label="Content Type" value={form.content_type} onChange={e=>setForm(f=>({...f,content_type:e.target.value}))} options={[{value:"topic",label:"Topic"},{value:"project",label:"Project"}]}/>
              <Input label="Title *" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
              <Input label="CDN URL * (from second app)" value={form.cdn_url} onChange={e=>setForm(f=>({...f,cdn_url:e.target.value}))} placeholder="https://cdn…"/>
              <Input label="Thumbnail URL" value={form.thumbnail_url} onChange={e=>setForm(f=>({...f,thumbnail_url:e.target.value}))}/>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                <Input label="Duration (seconds)" type="number" value={form.duration_seconds} onChange={e=>setForm(f=>({...f,duration_seconds:e.target.value}))}/>
                <Select label="Tier" value={form.content_tier} onChange={e=>setForm(f=>({...f,content_tier:e.target.value}))} options={[{value:"premium",label:"🔒 Premium"},{value:"free",label:"✓ Free"}]}/>
              </div>
            </div>
            <div style={{ display:"flex",gap:10,marginTop:20 }}>
              <Button style={{ flex:1 }} onClick={()=>setShowForm(false)}>Cancel</Button>
              <Button variant="primary" style={{ flex:1 }} onClick={()=>createMut.mutate({...form,duration_seconds:form.duration_seconds?Number(form.duration_seconds):null,thumbnail_url:form.thumbnail_url||null})} loading={createMut.isPending} disabled={!form.content_id||!form.title||!form.cdn_url}>Add Video</Button>
            </div>
          </div>
        </div>
      )}
      {toast&&<Toast msg={toast.msg} type={toast.type} onDismiss={()=>setToast(null)}/>}
    </div>
  );
}
