"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { getCircleSession } from "@/lib/circle-wallet-client";
import { deleteLocalContract, getApplications, getContractsForWallet, getHiddenContractsForWallet, getSavedContractsForWallet, hideContractForWallet, isContractHidden, isWalletCreator, isWalletOwner, restoreContractForWallet, unsaveContractForWallet, type JobApplication, type LocalContract } from "@/lib/marketplace-store";
import { loadPublicMarketplaceContracts, mergeMarketplaceContracts } from "@/lib/marketplace-chain";
import { listRemoteApplications, type RemoteApplication } from "@/lib/marketplace-remote";
import { getRemoteProfile, listRemoteProfiles, type RemoteCreatorProfile } from "@/lib/creator-profile-remote";
import { CreatorPassportSummary } from "@/components/CreatorPassportSummary";
import { ApplicantCard } from "@/components/ApplicantCard";
// ApplicantCard delegates the existing CreatorSelectionButton onchain flow.

const WALLET_KEY = "arc-browser-wallet";

function short(address: string) { return `${address.slice(0, 6)}…${address.slice(-4)}`; }
function contractKey(contract: LocalContract) { return (contract.escrowAddress ?? contract.id).toLowerCase(); }
function isDeployedContract(contract: LocalContract) { return Boolean(contract.escrowAddress || /^0x[a-fA-F0-9]{40}$/.test(contract.id)); }

export default function ProfilePage() {
  const [wallet, setWallet] = useState("");
  const [allContracts, setAllContracts] = useState<LocalContract[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [receivedApplications, setReceivedApplications] = useState<RemoteApplication[]>([]);
  const [applicantProfiles, setApplicantProfiles] = useState<Record<string, RemoteCreatorProfile>>({});
  const [passportProfile, setPassportProfile] = useState<RemoteCreatorProfile>();
  const [applicantSort, setApplicantSort] = useState<"Newest" | "Arc verified first" | "Available first">("Newest");
  const [roleFilter, setRoleFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");

  useEffect(() => {
    const circle = getCircleSession();
    let address = circle?.address ?? "";
    const saved = localStorage.getItem(WALLET_KEY);
    if (!address && saved) {
      try { address = (JSON.parse(saved) as { address?: string }).address ?? ""; } catch { /* ignore malformed session */ }
    }
    setWallet(address);
    if (!address) return;
    void getRemoteProfile(address).then((result) => setPassportProfile({ ...result.profile, verification: result.verification })).catch(() => setPassportProfile(undefined));

    const localContracts = getContractsForWallet(address);
    setAllContracts(localContracts);
    setApplications(getApplications().filter((application) => application.applicant.trim().toLowerCase() === address.trim().toLowerCase()));
    void listRemoteApplications({ applicant: address })
      .then((result) => {
        if (result.applications.length) setApplications((current) => {
          const merged = new Map(current.map((application) => [application.id, application]));
          result.applications.forEach((application) => merged.set(application.id, application));
          return [...merged.values()];
        });
      })
      .catch(() => undefined);

    async function loadReceived(contractList: LocalContract[]) {
      const createdIds = contractList.filter((contract) => isWalletOwner(address, contract)).map((contract) => contract.escrowAddress ?? contract.id);
      if (!createdIds.length) return;
      try {
        const result = await listRemoteApplications({ contractIds: createdIds });
        setReceivedApplications(result.applications);
        const profiles = await listRemoteProfiles(result.applications.map((application) => application.applicant));
        setApplicantProfiles(Object.fromEntries(profiles.map((profile) => [profile.walletAddress.toLowerCase(), profile])));
      } catch { /* preserve empty state when shared storage is unavailable */ }
    }
    loadReceived(localContracts.filter((contract) => !isContractHidden(address, contract)));

    let cancelled = false;
    void loadPublicMarketplaceContracts()
      .then((publicContracts) => {
        if (!cancelled) {
          const mergedContracts = mergeMarketplaceContracts(publicContracts, localContracts);
          const visibleContracts = mergedContracts.filter((contract) => !isContractHidden(address, contract));
          setAllContracts(mergedContracts);
          void loadReceived(visibleContracts);
        }
      })
      .catch(() => {
        // Keep locally-created jobs visible when the public RPC is temporarily unavailable.
      });
    return () => { cancelled = true; };
  }, []);

  function removeContract(contract: LocalContract) {
    const deployed = isDeployedContract(contract);
    const message = deployed
      ? "This escrow is already on Arc and cannot be deleted from the blockchain. Hide it from My Page?"
      : "Delete this local contract record?";
    if (!window.confirm(message)) return;
    const changed = deployed ? hideContractForWallet(wallet, contract) : deleteLocalContract(contract);
    if (changed) setAllContracts((current) => deployed
      ? [...current]
      : current.filter((candidate) => contractKey(candidate) !== contractKey(contract)));
  }

  function restoreContract(contract: LocalContract) {
    if (restoreContractForWallet(wallet, contract)) setAllContracts((current) => [...current]);
  }

  function removeSavedContract(contract: LocalContract) {
    if (unsaveContractForWallet(wallet, contract)) setAllContracts((current) => [...current]);
  }

  function markCreatorSelected(application: RemoteApplication) {
    setReceivedApplications((current) => current.map((candidate) => candidate.id === application.id ? application : candidate));
  }

  const filteredReceivedApplications = useMemo(() => {
    const filtered = receivedApplications.filter((application) => {
      const profile = applicantProfiles[application.applicant.toLowerCase()];
      const matchesRole = !roleFilter || profile?.roles.includes(roleFilter as never);
      const matchesLanguage = !languageFilter || profile?.languages.includes(languageFilter);
      return matchesRole && matchesLanguage;
    });
    return filtered.sort((left, right) => {
      const leftProfile = applicantProfiles[left.applicant.toLowerCase()];
      const rightProfile = applicantProfiles[right.applicant.toLowerCase()];
      if (applicantSort === "Arc verified first") return Number(Boolean(rightProfile?.verification.arcSettlementVerified)) - Number(Boolean(leftProfile?.verification.arcSettlementVerified));
      if (applicantSort === "Available first") return Number(rightProfile?.availability === "available") - Number(leftProfile?.availability === "available");
      return new Date(right.appliedAt).getTime() - new Date(left.appliedAt).getTime();
    });
  }, [applicantProfiles, applicantSort, languageFilter, receivedApplications, roleFilter]);

  const availableRoles = useMemo(() => [...new Set(Object.values(applicantProfiles).flatMap((profile) => profile.roles))].sort(), [applicantProfiles]);
  const availableLanguages = useMemo(() => [...new Set(Object.values(applicantProfiles).flatMap((profile) => profile.languages))].sort(), [applicantProfiles]);

  const active = useMemo(() => applications.filter((application) => application.status === "Selected" || application.status === "Completed"), [applications]);
  const visibleContracts = useMemo(() => allContracts.filter((contract) => !isContractHidden(wallet, contract)), [allContracts, wallet]);
  const archivedContracts = useMemo(() => getHiddenContractsForWallet(wallet, allContracts), [allContracts, wallet]);
  const savedContracts = useMemo(() => getSavedContractsForWallet(wallet, allContracts), [allContracts, wallet]);
  const createdContracts = useMemo(() => visibleContracts.filter((contract) => isWalletOwner(wallet, contract)), [visibleContracts, wallet]);
  const assignedContracts = useMemo(() => visibleContracts.filter((contract) => isWalletCreator(wallet, contract)), [visibleContracts, wallet]);
  if (!wallet) return <Shell><section className="rounded-[2rem] border border-arc-line bg-white/75 p-8 shadow-sm"><p className="text-sm font-bold uppercase tracking-[0.22em] text-arc-muted">My Page</p><h1 className="mt-2 text-4xl font-black">Connect a wallet to view your work.</h1><p className="mt-3 text-arc-muted">Your created jobs and applications will appear here.</p></section></Shell>;

  const cards = [
    ["Created jobs", createdContracts.length],
    ["Applications", applications.length],
    ["Active work", active.length],
    ["Wallet", short(wallet)],
  ];
  return <Shell>
    <div className="mb-8"><p className="text-sm font-bold uppercase tracking-[0.22em] text-arc-muted">My Page</p><h1 className="mt-2 text-5xl font-black tracking-tight">Your Arc workspace</h1><p className="mt-3 text-arc-muted">One wallet, two roles: advertise work and contribute as a creator.</p></div>
    <section className="grid gap-4 md:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="rounded-3xl border border-arc-line bg-white/80 p-5"><p className="text-sm text-arc-muted">{label}</p><p className="mt-2 break-all text-2xl font-black">{value}</p></div>)}</section>
    <div className="mt-8"><CreatorPassportSummary profile={passportProfile} verification={passportProfile?.verification} wallet={wallet} /></div>
    <section className="mt-8 grid gap-6 lg:grid-cols-3">
      <div className="rounded-[2rem] border border-arc-line bg-white/80 p-6 lg:col-span-2"><h2 className="text-2xl font-black">Created Jobs</h2><p className="mt-2 text-sm text-arc-muted">Delete local drafts or hide deployed escrows from this workspace. Onchain records remain verifiable on Arc.</p>{createdContracts.length ? <div className="mt-5 grid gap-3">{createdContracts.map((contract) => { const count = receivedApplications.filter((application) => application.contractId.toLowerCase() === (contract.escrowAddress ?? contract.id).toLowerCase()).length; return <article key={contract.id} className="flex items-center gap-3 rounded-2xl border border-arc-line p-4 hover:bg-arc-bg"><Link href={`/contracts/${contract.escrowAddress ?? contract.id}`} className="min-w-0 flex-1"><p className="font-black">{contract.title}</p><p className="mt-2 text-sm text-arc-muted">{contract.status} · {count || contract.applications?.length || 0} applications</p></Link><div className="flex shrink-0 items-center gap-3"><span className="text-sm font-bold text-arc-muted">{contract.totalUsdc} USDC</span><button type="button" className="rounded-full border border-red-200 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-50" onClick={() => removeContract(contract)}>{isDeployedContract(contract) ? "Hide" : "Delete"}</button></div></article>; })}</div> : <p className="mt-4 text-sm text-arc-muted">No jobs created yet. <Link className="font-black text-arc-purple" href="/contracts/create">Create a contract →</Link></p>}</div>
      <div className="rounded-[2rem] bg-arc-ink p-6 text-white"><h2 className="text-2xl font-black">My Applications</h2>{applications.length ? <div className="mt-5 space-y-3">{applications.map((application) => <Link key={application.id} href={`/contracts/${application.contractId}`} className="block rounded-2xl bg-white/10 p-4 hover:bg-white/15"><p className="font-black">{application.contractId.slice(0, 10)}…</p><span className="mt-2 inline-flex rounded-full bg-arc-lime px-3 py-1 text-xs font-black text-arc-ink">{application.status}</span></Link>)}</div> : <p className="mt-4 text-sm text-white/65">No applications yet. Explore a job and apply as a creator.</p>}</div>
    </section>
    <section className="mt-6 rounded-[2rem] border border-arc-line bg-white/80 p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-black">Archived Jobs</h2><p className="mt-2 text-sm text-arc-muted">Hidden deployed jobs stay here so you can restore them later.</p></div><span className="rounded-full bg-arc-bg px-3 py-1 text-xs font-black">{archivedContracts.length}</span></div>{archivedContracts.length ? <div className="mt-5 grid gap-3">{archivedContracts.map((contract) => <article key={contract.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-arc-line p-4"><Link href={`/contracts/${contract.escrowAddress ?? contract.id}`} className="min-w-0 flex-1"><p className="font-black">{contract.title}</p><p className="mt-2 text-sm text-arc-muted">{contract.status} · {contract.totalUsdc} USDC</p></Link><button type="button" className="rounded-full border border-arc-line px-3 py-2 text-xs font-black hover:border-arc-purple" onClick={() => restoreContract(contract)}>Restore</button></article>)}</div> : <p className="mt-4 text-sm text-arc-muted">No archived jobs.</p>}</section>
    <section className="mt-6 rounded-[2rem] border border-arc-line bg-white/80 p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-black">Saved Jobs</h2><p className="mt-2 text-sm text-arc-muted">Keep interesting opportunities in one place for later.</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">{savedContracts.length}</span></div>{savedContracts.length ? <div className="mt-5 grid gap-3">{savedContracts.map((contract) => <article key={contract.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-arc-line p-4"><Link href={`/contracts/${contract.escrowAddress ?? contract.id}`} className="min-w-0 flex-1"><p className="font-black">{contract.title}</p><p className="mt-2 text-sm text-arc-muted">{contract.status} · {contract.totalUsdc} USDC</p></Link><button type="button" className="rounded-full border border-arc-line px-3 py-2 text-xs font-black hover:border-amber-400" onClick={() => removeSavedContract(contract)}>Remove</button></article>)}</div> : <p className="mt-4 text-sm text-arc-muted">No saved jobs yet. Select the star on a job card to save one.</p>}</section>
    <section className="mt-6 rounded-[2rem] border border-arc-line bg-white/80 p-6"><h2 className="text-2xl font-black">Active Work</h2><p className="mt-2 text-sm text-arc-muted">Selected and completed applications will show milestone progress here as the contract state is updated.</p>{active.length ? <div className="mt-4 text-sm font-bold">{active.length} active application{active.length === 1 ? "" : "s"}</div> : null}</section>
    <section className="mt-6 rounded-[2rem] border border-arc-line bg-white/80 p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-black">Applications received</h2><p className="mt-2 text-sm text-arc-muted">Compare creator capability, channels, and confirmed Arc history before selecting.</p></div>{receivedApplications.length ? <div className="grid gap-2 sm:grid-cols-3"><label className="grid gap-1 text-xs font-bold">Sort<select value={applicantSort} onChange={(event) => setApplicantSort(event.target.value as typeof applicantSort)} className="min-h-11 rounded-xl border border-arc-line px-2"><option>Newest</option><option>Arc verified first</option><option>Available first</option></select></label><label className="grid gap-1 text-xs font-bold">Role filter<select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="min-h-11 rounded-xl border border-arc-line px-2"><option value="">All roles</option>{availableRoles.map((role) => <option key={role}>{role}</option>)}</select></label><label className="grid gap-1 text-xs font-bold">Language filter<select value={languageFilter} onChange={(event) => setLanguageFilter(event.target.value)} className="min-h-11 rounded-xl border border-arc-line px-2"><option value="">All languages</option>{availableLanguages.map((language) => <option key={language}>{language}</option>)}</select></label></div> : null}</div>{receivedApplications.length ? <div className="mt-5 grid gap-4 md:grid-cols-2">{filteredReceivedApplications.map((application) => <ApplicantCard key={application.id} application={application} profile={applicantProfiles[application.applicant.toLowerCase()]} advertiser={wallet} onSelected={(selected) => markCreatorSelected(selected)} />)}</div> : <p className="mt-4 text-sm text-arc-muted">No shared applications found yet.</p>}</section>
    <section className="mt-6 rounded-[2rem] border border-arc-line bg-white/80 p-6"><h2 className="text-2xl font-black">Creator history</h2><p className="mt-2 text-sm text-arc-muted">Public escrows assigned to this wallet are listed here, even when another wallet created the job.</p>{assignedContracts.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{assignedContracts.map((contract) => <Link key={contract.id} href={`/contracts/${contract.escrowAddress ?? contract.id}`} className="rounded-2xl border border-arc-line p-4 hover:bg-arc-bg"><p className="font-black">{contract.title}</p><p className="mt-2 text-sm text-arc-muted">{contract.status} · {contract.totalUsdc} USDC</p></Link>)}</div> : <p className="mt-4 text-sm text-arc-muted">No assigned creator work found on Arc yet.</p>}</section>
  </Shell>;
}
