import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import type { ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as applicantCardModule from "../components/ApplicantCard";
import type { RemoteApplication } from "../lib/marketplace-remote";

Object.assign(globalThis, { React });

const advertiser = "0x1111111111111111111111111111111111111111";
const application: RemoteApplication = {
  id: "application-1",
  contractId: "0x2222222222222222222222222222222222222222",
  applicant: "0x3333333333333333333333333333333333333333",
  status: "Applied",
  appliedAt: "2026-09-10T00:00:00.000Z",
};

function component() {
  const ContractApplicants = (applicantCardModule as unknown as {
    ContractApplicants?: ComponentType<{
      applications: RemoteApplication[];
      profiles: Record<string, never>;
      advertiser: string;
      selectionContractId: string;
      loading: boolean;
      error?: string;
      onSelected: (application: RemoteApplication) => void;
    }>;
  }).ContractApplicants;
  assert.equal(typeof ContractApplicants, "function");
  return ContractApplicants;
}

test("contract applicant panel explains loading, failure, and empty states", () => {
  const ContractApplicants = component();
  if (!ContractApplicants) return;

  const loading = renderToStaticMarkup(<ContractApplicants applications={[]} profiles={{}} advertiser={advertiser} selectionContractId={application.contractId} loading onSelected={() => undefined} />);
  const failed = renderToStaticMarkup(<ContractApplicants applications={[]} profiles={{}} advertiser={advertiser} selectionContractId={application.contractId} loading={false} error="Applications could not be loaded." onSelected={() => undefined} />);
  const empty = renderToStaticMarkup(<ContractApplicants applications={[]} profiles={{}} advertiser={advertiser} selectionContractId={application.contractId} loading={false} onSelected={() => undefined} />);

  assert.match(loading, /Loading applications/);
  assert.match(failed, /Applications could not be loaded/);
  assert.match(empty, /No applications have been submitted for this job yet/);
});

test("contract applicant panel renders applicants with the existing selection action", () => {
  const ContractApplicants = component();
  if (!ContractApplicants) return;

  const html = renderToStaticMarkup(<ContractApplicants applications={[application]} profiles={{}} advertiser={advertiser} selectionContractId={application.contractId} loading={false} onSelected={() => undefined} />);

  assert.match(html, /Applications received/);
  assert.match(html, /1 applicant/);
  assert.match(html, /0x3333/);
  assert.match(html, /Select creator/);
});
