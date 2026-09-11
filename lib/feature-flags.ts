/**
 * Public safety switches. They default to enabled for local development and
 * preview deployments; Production can disable wallet-heavy testnet features
 * without changing the core settlement flow.
 */
export const CROSS_CHAIN_FUNDING_ENABLED = process.env.NEXT_PUBLIC_CROSS_CHAIN_FUNDING_ENABLED !== "false";
export const TESTNET_NETWORK_SETUP_ENABLED = process.env.NEXT_PUBLIC_TESTNET_NETWORK_SETUP_ENABLED !== "false";
