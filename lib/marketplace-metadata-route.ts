import { createContractMetadata, listContractMetadata, type CreateMetadataResult } from "./marketplace-metadata-store";
import { isContractDescription, isContractMetadataAddress } from "./marketplace-metadata";

type MetadataRouteDependencies = {
  list: typeof listContractMetadata;
  create: typeof createContractMetadata;
};

function errorStatus(result: Extract<CreateMetadataResult, { ok: false }>) {
  if (result.error === "ADVERTISER_MISMATCH") return 403;
  if (result.error === "ESCROW_UNAVAILABLE") return 404;
  if (result.error === "METADATA_CONFLICT") return 409;
  return 503;
}

export function createMetadataRouteHandlers(dependencies: MetadataRouteDependencies = {
  list: listContractMetadata,
  create: createContractMetadata
}) {
  return {
    async GET(request: Request) {
      const raw = new URL(request.url).searchParams.get("escrowAddresses") ?? "";
      const requested = raw.split(",").map((value) => value.trim()).filter(Boolean);
      if (requested.length > 100 || requested.some((address) => !isContractMetadataAddress(address))) {
        return Response.json({ error: "INVALID_ESCROW_ADDRESSES", metadata: [] }, { status: 400 });
      }
      const addresses = [...new Set(requested.map((address) => address.toLowerCase()))];
      if (addresses.length === 0) return Response.json({ enabled: true, metadata: [] }, { headers: { "Cache-Control": "no-store" } });
      const result = await dependencies.list(addresses);
      return Response.json(result, {
        status: result.enabled ? 200 : 503,
        headers: { "Cache-Control": "no-store" }
      });
    },

    async POST(request: Request) {
      const body = await request.json().catch(() => null) as Record<string, unknown> | null;
      const escrowAddress = typeof body?.escrowAddress === "string" ? body.escrowAddress.trim() : "";
      const advertiserWallet = typeof body?.advertiserWallet === "string" ? body.advertiserWallet.trim() : "";
      const description = typeof body?.description === "string" ? body.description.trim() : "";
      if (!isContractMetadataAddress(escrowAddress) || !isContractMetadataAddress(advertiserWallet) || !isContractDescription(description)) {
        return Response.json({ error: "INVALID_CONTRACT_METADATA" }, { status: 400 });
      }
      const result = await dependencies.create({ escrowAddress, advertiserWallet, description });
      if (!result.ok) return Response.json(result, { status: errorStatus(result) });
      return Response.json(result, {
        status: result.created ? 201 : 200,
        headers: { "Cache-Control": "no-store" }
      });
    }
  };
}
