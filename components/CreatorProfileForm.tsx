"use client";

import { useMemo, useState } from "react";
import { buildProfileSigningMessage, createPayloadHash } from "@/lib/creator-profile-signing";
import { CREATOR_ROLES, validateCreatorProfilePayload, type CreatorPortfolioItem, type CreatorProfile, type CreatorProfilePayload, type CreatorRole, type CreatorSocialLink, type SocialPlatform, type PortfolioType } from "@/lib/creator-profile";
import { saveRemoteProfile } from "@/lib/creator-profile-remote";
import { resolveBrowserProvider } from "@/lib/browser-wallet";
import { ApplicationProfilePreview } from "./ApplicationProfilePreview";

const platforms: SocialPlatform[] = ["telegram", "x", "youtube", "instagram", "tiktok", "linkedin", "github", "website"];
const portfolioTypes: PortfolioType[] = ["article", "x-thread", "video", "project", "community", "event", "other"];

type FormState = CreatorProfilePayload;

function blank(walletAddress: string): FormState {
  return { walletAddress, displayName: "", headline: "", bio: "", countryCode: "", languages: ["English"], roles: ["Content Creator"], skills: [], preferredCampaigns: [], availability: "available", typicalTurnaroundDays: 7, socialLinks: [{ platform: "website", url: "", handle: "" }], portfolioItems: [], isPublic: true };
}

function fromProfile(walletAddress: string, profile?: CreatorProfile): FormState {
  if (!profile) return blank(walletAddress);
  return { walletAddress, displayName: profile.displayName, headline: profile.headline, bio: profile.bio, avatarUrl: profile.avatarUrl, countryCode: profile.countryCode, languages: profile.languages, roles: profile.roles, skills: profile.skills, preferredCampaigns: profile.preferredCampaigns, availability: profile.availability, typicalTurnaroundDays: profile.typicalTurnaroundDays, socialLinks: profile.socialLinks, portfolioItems: profile.portfolioItems, isPublic: profile.isPublic };
}

export function ProfileFieldError({ error }: { error?: string }) {
  return error ? <span role="alert" className="text-sm font-semibold text-red-600">{error}</span> : null;
}

export function CreatorProfileForm({ walletAddress, initialProfile, onSaved }: { walletAddress: string; initialProfile?: CreatorProfile; onSaved: (profile: CreatorProfile) => void }) {
  const [state, setState] = useState<FormState>(() => fromProfile(walletAddress, initialProfile));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<FormState>();
  const [feedback, setFeedback] = useState<string>();
  const [busy, setBusy] = useState(false);
  const version = (initialProfile?.profileVersion ?? 0) + 1;
  const roles = useMemo(() => new Set(state.roles), [state.roles]);
  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };
  const setList = (key: "languages" | "skills" | "preferredCampaigns", value: string) => setField(key, value.split(",").map((item) => item.trim()).filter(Boolean));

  function validateForPreview() {
    const result = validateCreatorProfilePayload(state);
    if (!result.ok) { setErrors(result.errors); setFeedback("Please fix the highlighted fields before signing."); return; }
    setErrors({}); setFeedback(undefined); setPending(result.value);
  }

  async function signAndSave() {
    if (!pending || busy) return;
    setBusy(true); setFeedback(undefined);
    try {
      const stored = JSON.parse(localStorage.getItem("arc-browser-wallet") ?? "null") as { name?: "metamask" | "okx" | "rabby" | "coinbase" } | null;
      if (!stored?.name) throw new Error("Profile editing currently requires a browser wallet signature.");
      const provider = resolveBrowserProvider(stored.name);
      const issuedAt = new Date().toISOString();
      const payloadHash = await createPayloadHash(pending);
      const message = buildProfileSigningMessage({ walletAddress, profileVersion: version, issuedAt, payloadHash });
      const signature = await provider.request({ method: "personal_sign", params: [message, walletAddress] });
      const result = await saveRemoteProfile({ walletAddress, profile: pending, profileVersion: version, issuedAt, signature });
      localStorage.setItem(`arc-creator-profile:${walletAddress.toLowerCase()}`, JSON.stringify(result.profile));
      setPending(undefined); setFeedback("Creator Passport saved successfully."); onSaved(result.profile);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Profile save failed. No changes were saved.");
    } finally { setBusy(false); }
  }

  function toggleRole(role: CreatorRole) { setField("roles", roles.has(role) ? state.roles.filter((value) => value !== role) : [...state.roles, role]); }
  function updateSocial(index: number, patch: Partial<CreatorSocialLink>) { setField("socialLinks", state.socialLinks.map((link, itemIndex) => itemIndex === index ? { ...link, ...patch } : link)); }
  function updatePortfolio(index: number, patch: Partial<CreatorPortfolioItem>) { setField("portfolioItems", state.portfolioItems.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)); }

  const hasValidationErrors = Object.keys(errors).length > 0;

  return <form noValidate className="space-y-6" onSubmit={(event) => { event.preventDefault(); validateForPreview(); }}>
    {feedback ? <p role={hasValidationErrors ? "alert" : "status"} className={`rounded-2xl p-3 text-sm font-semibold ${hasValidationErrors ? "border border-red-200 bg-red-50 text-red-700" : "bg-arc-bg text-arc-muted"}`}>{feedback}</p> : null}
    <section className="rounded-3xl border border-arc-line bg-white/80 p-5"><h2 className="text-xl font-black">1. Basic identity</h2><div className="mt-4 grid gap-4"><label className="grid gap-2 text-sm font-bold">Display name<input required maxLength={80} value={state.displayName} onChange={(event) => setField("displayName", event.target.value)} className="min-h-11 rounded-xl border border-arc-line px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-arc-purple" /><ProfileFieldError error={errors.displayName} /></label><label className="grid gap-2 text-sm font-bold">Headline<input maxLength={140} value={state.headline ?? ""} onChange={(event) => setField("headline", event.target.value)} className="min-h-11 rounded-xl border border-arc-line px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-arc-purple" /><ProfileFieldError error={errors.headline} /></label><label className="grid gap-2 text-sm font-bold">Bio<textarea required minLength={40} maxLength={1000} rows={5} value={state.bio} onChange={(event) => setField("bio", event.target.value)} className="rounded-xl border border-arc-line p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-arc-purple" /><ProfileFieldError error={errors.bio} /></label><label className="grid gap-2 text-sm font-bold">Avatar HTTPS URL<input value={state.avatarUrl ?? ""} onChange={(event) => setField("avatarUrl", event.target.value)} className="min-h-11 rounded-xl border border-arc-line px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-arc-purple" /><ProfileFieldError error={errors.avatarUrl} /></label></div></section>
    <section className="rounded-3xl border border-arc-line bg-white/80 p-5"><h2 className="text-xl font-black">2. Roles and skills</h2><div className="mt-4 flex flex-wrap gap-2">{CREATOR_ROLES.map((role) => <button type="button" key={role} aria-pressed={roles.has(role)} onClick={() => toggleRole(role)} className={`min-h-11 rounded-full border px-3 py-2 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-arc-purple ${roles.has(role) ? "border-arc-ink bg-arc-ink text-white" : "border-arc-line"}`}>{role}</button>)}</div><div className="mt-2"><ProfileFieldError error={errors.roles} /></div><label className="mt-4 grid gap-2 text-sm font-bold">Skills <input value={state.skills.join(", ")} onChange={(event) => setList("skills", event.target.value)} placeholder="Writing, editing, Solidity" className="min-h-11 rounded-xl border border-arc-line px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-arc-purple" /><ProfileFieldError error={errors.skills} /></label></section>
    <section className="rounded-3xl border border-arc-line bg-white/80 p-5"><h2 className="text-xl font-black">3. Languages and region</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Languages <input value={state.languages.join(", ")} onChange={(event) => setList("languages", event.target.value)} placeholder="English, Korean" className="min-h-11 rounded-xl border border-arc-line px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-arc-purple" /><ProfileFieldError error={errors.languages} /></label><label className="grid gap-2 text-sm font-bold">Country code <input maxLength={2} value={state.countryCode ?? ""} onChange={(event) => setField("countryCode", event.target.value.toUpperCase())} placeholder="KR" className="min-h-11 rounded-xl border border-arc-line px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-arc-purple" /><ProfileFieldError error={errors.countryCode} /></label></div></section>
    <section className="rounded-3xl border border-arc-line bg-white/80 p-5"><h2 className="text-xl font-black">4. Social channels</h2><div className="mt-4 space-y-3">{state.socialLinks.map((link, index) => <div key={index} className="grid gap-2 rounded-2xl border border-arc-line p-3 sm:grid-cols-[10rem_1fr_auto]"><label className="grid gap-1 text-xs font-bold">Platform<select value={link.platform} onChange={(event) => updateSocial(index, { platform: event.target.value as SocialPlatform })} className="min-h-11 rounded-xl border border-arc-line px-2"><option value="website">Website</option>{platforms.filter((platform) => platform !== "website").map((platform) => <option key={platform} value={platform}>{platform}</option>)}</select></label><label className="grid gap-1 text-xs font-bold">HTTPS URL<input value={link.url} onChange={(event) => updateSocial(index, { url: event.target.value })} className="min-h-11 rounded-xl border border-arc-line px-2" /></label><button type="button" className="min-h-11 self-end rounded-full border border-red-200 px-3 text-xs font-black text-red-600" onClick={() => setField("socialLinks", state.socialLinks.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></div>)}</div><div className="mt-2"><ProfileFieldError error={errors.socialLinks} /></div><button type="button" disabled={state.socialLinks.length >= 10} onClick={() => setField("socialLinks", [...state.socialLinks, { platform: "website", url: "" }])} className="mt-3 min-h-11 rounded-full border border-arc-line px-4 text-sm font-black">Add channel</button><p className="mt-2 text-xs font-bold text-arc-muted">Follower counts are always Self-reported.</p></section>
    <section className="rounded-3xl border border-arc-line bg-white/80 p-5"><h2 className="text-xl font-black">5. Portfolio</h2><div className="mt-4 space-y-3">{state.portfolioItems.map((item, index) => <div key={item.id} className="grid gap-2 rounded-2xl border border-arc-line p-3"><label className="grid gap-1 text-xs font-bold">Title<input value={item.title} onChange={(event) => updatePortfolio(index, { title: event.target.value })} className="min-h-11 rounded-xl border border-arc-line px-2" /></label><label className="grid gap-1 text-xs font-bold">HTTPS URL<input value={item.url} onChange={(event) => updatePortfolio(index, { url: event.target.value })} className="min-h-11 rounded-xl border border-arc-line px-2" /></label><label className="grid gap-1 text-xs font-bold">Type<select value={item.type} onChange={(event) => updatePortfolio(index, { type: event.target.value as PortfolioType })} className="min-h-11 rounded-xl border border-arc-line px-2">{portfolioTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label><button type="button" className="min-h-11 w-fit rounded-full border border-red-200 px-3 text-xs font-black text-red-600" onClick={() => setField("portfolioItems", state.portfolioItems.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></div>)}</div><div className="mt-2"><ProfileFieldError error={errors.portfolioItems} /></div><button type="button" disabled={state.portfolioItems.length >= 6} onClick={() => setField("portfolioItems", [...state.portfolioItems, { id: crypto.randomUUID(), title: "", url: "", type: "other" }])} className="mt-3 min-h-11 rounded-full border border-arc-line px-4 text-sm font-black">Add portfolio item</button></section>
    <section className="rounded-3xl border border-arc-line bg-white/80 p-5"><h2 className="text-xl font-black">6. Work preferences</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Availability<select value={state.availability} onChange={(event) => setField("availability", event.target.value as FormState["availability"])} className="min-h-11 rounded-xl border border-arc-line px-3"><option value="available">Available</option><option value="limited">Limited</option><option value="unavailable">Unavailable</option></select><ProfileFieldError error={errors.availability} /></label><label className="grid gap-2 text-sm font-bold">Typical turnaround days<input type="number" min={1} max={365} value={state.typicalTurnaroundDays ?? ""} onChange={(event) => setField("typicalTurnaroundDays", event.target.value ? Number(event.target.value) : undefined)} className="min-h-11 rounded-xl border border-arc-line px-3" /><ProfileFieldError error={errors.typicalTurnaroundDays} /></label></div></section>
    <section className="rounded-3xl border border-arc-line bg-white/80 p-5"><h2 className="text-xl font-black">7. Visibility and wallet signature</h2><label className="mt-4 flex min-h-11 items-center gap-3 text-sm font-bold"><input type="checkbox" checked={state.isPublic} onChange={(event) => setField("isPublic", event.target.checked)} className="h-5 w-5" /> Make this profile public</label><ProfileFieldError error={errors.isPublic} /><p className="mt-3 text-sm text-arc-muted">Profile editing currently requires a browser wallet signature. Circle Wallet can still use Arc contracts and view public profiles.</p>{pending ? <div className="mt-4 space-y-3"><ApplicationProfilePreview profile={{ ...pending, profileVersion: version, createdAt: "", updatedAt: "" }} verification={{ walletSigned: false, arcSettlementVerified: false, completedPayouts: 0, distinctEscrows: 0, totalPaidUsdc: "0.00" }} /><div className="flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={signAndSave} className="min-h-11 rounded-full bg-arc-ink px-5 py-3 text-sm font-black text-white hover:bg-arc-purple">{busy ? "Waiting for signature…" : "Sign and save profile"}</button><button type="button" disabled={busy} onClick={() => setPending(undefined)} className="min-h-11 rounded-full border border-arc-line px-5 py-3 text-sm font-black">Edit preview</button></div></div> : <button type="submit" className="mt-4 min-h-11 rounded-full bg-arc-ink px-5 py-3 text-sm font-black text-white hover:bg-arc-purple focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arc-purple">Review profile</button>}</section>
  </form>;
}
