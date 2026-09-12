import { createMetadataRouteHandlers } from "@/lib/marketplace-metadata-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handlers = createMetadataRouteHandlers();
export const GET = handlers.GET;
export const POST = handlers.POST;
