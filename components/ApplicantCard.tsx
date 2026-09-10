"use client";

import Link from "next/link";
import type { CreatorRole } from "@/lib/creator-profile";
import type { RemoteCreatorProfile } from "@/lib/creator-profile-remote";
import type { RemoteApplication } from "@/lib/marketplace-remote";
import { CreatorVerificationBadges } from "./CreatorVerificationBadges";
import { CreatorSelectionButton } from "./CreatorSelectionButton";

function short(wallet: string) { return `${wallet.slice(0, 6)}…${wallet.slice(-4)}`; }

export function ApplicantCard({ application, profile, advertiser, selectionContractId, onSelected }: { application: RemoteApplication; profile?: RemoteCreatorProfile; advertiser: string; selectionContractId?: string; onSelected: (application: RemoteApplication) => void }) {
  const title = profile?.displayName ?? short(application.applicant);
  return <article className="flex min-h-[20rem] min-w-0 flex-col rounded-3xl border border-arc-line bg-white p-5 shadow-sm"><div className="flex min-w-0 items-start gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-arc-ink font-black text-arc-lime">{profile?.avatarUrl ? <img src={profile.avatarUrl} alt={`${title} avatar`} className="h-full w-full object-cover" /> : title.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><h3 className="break-words text-lg font-black">{title}</h3>{profile?.headline ? <p className="break-words text-sm text-arc-muted">{profile.headline}</p> : null}<p className="mt-1 break-all text-xs font-bold text-arc-muted">{short(application.applicant)}</p></div></div>{profile ? <><div className="mt-4 flex flex-wrap gap-2">{profile.roles.map((role: CreatorRole) => <span key={role} className="rounded-full bg-arc-bg px-2 py-1 text-xs font-bold">{role}</span>)}{profile.countryCode ? <span className="rounded-full border border-arc-line px-2 py-1 text-xs font-bold">{profile.countryCode}</span> : null}</div><p className="mt-3 break-words text-sm text-arc-muted">Languages: {profile.languages.join(", ")}</p><p className="mt-1 break-words text-sm text-arc-muted">Skills: {profile.skills.slice(0, 4).join(", ") || "Not listed"}</p><p className="mt-1 text-sm text-arc-muted">{profile.socialLinks.length} channel{profile.socialLinks.length === 1 ? "" : "s"} · {profile.portfolioItems.length} portfolio item{profile.portfolioItems.length === 1 ? "" : "s"} · {profile.availability}</p><CreatorVerificationBadges verification={profile.verification} />{profile.verification.arcSettlementVerified ? <p className="mt-2 text-xs font-bold text-arc-muted">{profile.verification.completedPayouts} payouts · {profile.verification.totalPaidUsdc} USDC paid</p> : null}{application.profileVersion && application.profileVersion !== profile.profileVersion ? <p className="mt-2 text-xs font-bold text-arc-purple">Profile updated since application</p> : null}</> : <p className="mt-5 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">Limited profile information is available for this applicant.</p>}<div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5"><p className="text-xs font-bold text-arc-muted">{new Date(application.appliedAt).toLocaleDateString()} · {application.status}</p><div className="flex flex-wrap gap-2">{profile ? <Link href={`/creators/${application.applicant}`} className="inline-flex min-h-11 items-center rounded-full border border-arc-line px-3 py-2 text-xs font-black hover:border-arc-purple focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arc-purple">View profile</Link> : null}<CreatorSelectionButton contractId={selectionContractId ?? application.contractId} applicant={application} advertiser={advertiser} onSelected={onSelected} /></div></div></article>;
}

type ContractApplicantsProps = {
  applications: RemoteApplication[];
  profiles: Record<string, RemoteCreatorProfile>;
  advertiser: string;
  selectionContractId: string;
  loading: boolean;
  error?: string;
  onSelected: (application: RemoteApplication) => void;
};

export function ContractApplicants({ applications, profiles, advertiser, selectionContractId, loading, error, onSelected }: ContractApplicantsProps) {
  return <section className="mt-6 rounded-3xl border border-arc-line bg-white p-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs font-black uppercase tracking-[0.18em] text-arc-muted">Advertiser review</p><h2 className="mt-1 text-2xl font-black">Applications received</h2></div>
      <p className="text-sm font-bold text-arc-muted">{applications.length} applicant{applications.length === 1 ? "" : "s"}</p>
    </div>
    {loading ? <p className="mt-4 rounded-2xl bg-arc-bg p-4 text-sm font-semibold text-arc-muted">Loading applications…</p> : error ? <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : applications.length === 0 ? <p className="mt-4 rounded-2xl bg-arc-bg p-4 text-sm text-arc-muted">No applications have been submitted for this job yet.</p> : <div className="mt-5 grid gap-4 lg:grid-cols-2">{applications.map((application) => <ApplicantCard key={application.id} application={application} profile={profiles[application.applicant.toLowerCase()]} advertiser={advertiser} selectionContractId={selectionContractId} onSelected={onSelected} />)}</div>}
  </section>;
}
