export const IDL = {
  address: "9ne8yuuK419t5VCHFojGUftW1ByUbafjbhq9Hq7JNkqG",
  metadata: {
    name: "crowdfunding",
    version: "0.1.0",
    spec: "0.1.0",
    description: "Created with Anchor",
  },
  instructions: [
    {
      name: "create_campaign",
      discriminator: [111, 131, 187, 98, 160, 193, 114, 244],
      accounts: [
        {
          name: "campaign",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [99, 97, 109, 112, 97, 105, 103, 110],
              },
              {
                kind: "account",
                path: "creator",
              },
              {
                kind: "arg",
                path: "title",
              },
            ],
          },
        },
        {
          name: "creator",
          writable: true,
          signer: true,
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [
        {
          name: "title",
          type: "string",
        },
        {
          name: "description",
          type: "string",
        },
        {
          name: "target_amount",
          type: "u64",
        },
        {
          name: "deadline",
          type: "i64",
        },
      ],
    },
    {
      name: "fund_campaign",
      discriminator: [109, 57, 56, 239, 99, 111, 221, 121],
      accounts: [
        {
          name: "campaign",
          writable: true,
        },
        {
          name: "contribution",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  99, 111, 110, 116, 114, 105, 98, 117, 116, 105, 111, 110,
                ],
              },
              {
                kind: "account",
                path: "campaign",
              },
              {
                kind: "account",
                path: "contributor",
              },
            ],
          },
        },
        {
          name: "contributor",
          writable: true,
          signer: true,
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
    {
      name: "refund_contribution",
      discriminator: [110, 148, 182, 9, 237, 155, 222, 1],
      accounts: [
        {
          name: "campaign",
          writable: true,
        },
        {
          name: "contribution",
          writable: true,
        },
        {
          name: "contributor",
          writable: true,
          signer: true,
        },
      ],
      args: [],
    },
    {
      name: "withdraw_funds",
      discriminator: [241, 36, 29, 111, 208, 31, 104, 217],
      accounts: [
        {
          name: "campaign",
          writable: true,
        },
        {
          name: "creator",
          writable: true,
          signer: true,
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "Campaign",
      discriminator: [50, 40, 49, 11, 157, 220, 229, 192],
    },
    {
      name: "Contribution",
      discriminator: [182, 187, 14, 111, 72, 167, 242, 212],
    },
  ],
  errors: [
    {
      code: 6000,
      name: "TitleTooLong",
      msg: "Title is too long",
    },
    {
      code: 6001,
      name: "DescriptionTooLong",
      msg: "Description is too long",
    },
    {
      code: 6002,
      name: "InvalidTargetAmount",
      msg: "Invalid target amount",
    },
    {
      code: 6003,
      name: "InvalidDeadline",
      msg: "Invalid deadline",
    },
    {
      code: 6004,
      name: "CampaignNotActive",
      msg: "Campaign is not active",
    },
    {
      code: 6005,
      name: "CampaignExpired",
      msg: "Campaign has expired",
    },
    {
      code: 6006,
      name: "InvalidAmount",
      msg: "Invalid amount",
    },
    {
      code: 6007,
      name: "UnauthorizedWithdrawal",
      msg: "Unauthorized withdrawal",
    },
    {
      code: 6008,
      name: "WithdrawalNotAllowed",
      msg: "Withdrawal not allowed",
    },
    {
      code: 6009,
      name: "RefundNotAllowed",
      msg: "Refund not allowed",
    },
    {
      code: 6010,
      name: "UnauthorizedRefund",
      msg: "Unauthorized refund",
    },
  ],
  types: [
    {
      name: "Campaign",
      type: {
        kind: "struct",
        fields: [
          {
            name: "creator",
            type: "pubkey",
          },
          {
            name: "title",
            type: "string",
          },
          {
            name: "description",
            type: "string",
          },
          {
            name: "target_amount",
            type: "u64",
          },
          {
            name: "current_amount",
            type: "u64",
          },
          {
            name: "deadline",
            type: "i64",
          },
          {
            name: "created_at",
            type: "i64",
          },
          {
            name: "is_active",
            type: "bool",
          },
        ],
      },
    },
    {
      name: "Contribution",
      type: {
        kind: "struct",
        fields: [
          {
            name: "contributor",
            type: "pubkey",
          },
          {
            name: "campaign",
            type: "pubkey",
          },
          {
            name: "amount",
            type: "u64",
          },
          {
            name: "timestamp",
            type: "i64",
          },
        ],
      },
    },
  ],
} as const;

export type Crowdfunding = typeof IDL;
