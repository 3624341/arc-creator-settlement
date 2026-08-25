export const erc20Abi = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  }
] as const;

export const factoryAbi = [
  {
    type: "function",
    name: "createEscrow",
    inputs: [
      { name: "creator", type: "address" },
      { name: "title", type: "string" },
      { name: "milestoneDescriptions", type: "string[]" },
      { name: "milestoneAmounts", type: "uint256[]" }
    ],
    outputs: [{ name: "escrow", type: "address" }],
    stateMutability: "nonpayable"
  },
  {
    type: "event",
    name: "EscrowCreated",
    inputs: [
      { indexed: true, name: "escrow", type: "address" },
      { indexed: true, name: "client", type: "address" },
      { indexed: true, name: "creator", type: "address" },
      { indexed: false, name: "title", type: "string" },
      { indexed: false, name: "totalAmount", type: "uint256" }
    ],
    anonymous: false
  }
] as const;

export const escrowAbi = [
  {
    type: "function",
    name: "deposit",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "submitMilestone",
    inputs: [{ name: "milestoneId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "approveAndRelease",
    inputs: [{ name: "milestoneId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getMilestone",
    inputs: [{ name: "milestoneId", type: "uint256" }],
    outputs: [
      { name: "description", type: "string" },
      { name: "amount", type: "uint256" },
      { name: "submitted", type: "bool" },
      { name: "approved", type: "bool" },
      { name: "released", type: "bool" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "milestoneCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "totalAmount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "client",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "creator",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "title",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view"
  }
] as const;
