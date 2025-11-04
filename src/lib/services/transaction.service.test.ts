import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import type { SupabaseClient } from "../../db/supabase.client";
import {
  createTransaction,
  listTransactions,
  updateTransaction,
  deleteTransaction,
  TransactionCreateSchema,
  TransactionUpdateSchema,
  TransactionListQuerySchema,
  TransactionIdSchema,
} from "./transaction.service";
import type { TransactionDTO } from "../../types";

// Mock Supabase client
const createMockSupabaseClient = (): SupabaseClient => {
  return {
    from: vi.fn(),
  } as unknown as SupabaseClient;
};

const mockUserId = "550e8400-e29b-41d4-a716-446655440000";
const mockAccountId = "550e8400-e29b-41d4-a716-446655440001";
const mockCategoryId = "550e8400-e29b-41d4-a716-446655440002";
const mockTransactionId = "550e8400-e29b-41d4-a716-446655440003";

const validTransactionData = {
  amount_cents: 5000,
  transaction_type: "expense" as const,
  description: "Coffee",
  transaction_date: "2024-01-15T10:30:00Z",
  account_id: mockAccountId,
  category_id: mockCategoryId,
};

const mockTransactionResponse = {
  id: mockTransactionId,
  amount_cents: 5000,
  transaction_type: "expense",
  description: "Coffee",
  transaction_date: "2024-01-15T10:30:00Z",
  account_id: mockAccountId,
  category_id: mockCategoryId,
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-15T10:30:00Z",
};

const mockTransactionDTOResponse: TransactionDTO = {
  id: mockTransactionId,
  amount_cents: 5000,
  transaction_type: "expense",
  description: "Coffee",
  transaction_date: "2024-01-15T10:30:00Z",
  account_id: mockAccountId,
  category_id: mockCategoryId,
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-15T10:30:00Z",
  accounts: { name: "Checking Account" },
  categories: { name: "Food & Dining" },
};

describe("Transaction Service - Validation Schemas", () => {
  describe("TransactionCreateSchema", () => {
    it("should accept valid transaction data", () => {
      const result = TransactionCreateSchema.safeParse(validTransactionData);
      expect(result.success).toBe(true);
    });

    it("should reject negative amounts", () => {
      const result = TransactionCreateSchema.safeParse({
        ...validTransactionData,
        amount_cents: -1000,
      });
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain("positive");
    });

    it("should reject zero amounts", () => {
      const result = TransactionCreateSchema.safeParse({
        ...validTransactionData,
        amount_cents: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject non-integer amounts", () => {
      const result = TransactionCreateSchema.safeParse({
        ...validTransactionData,
        amount_cents: 50.5,
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid transaction types", () => {
      const result = TransactionCreateSchema.safeParse({
        ...validTransactionData,
        transaction_type: "transfer",
      });
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain("expense");
    });

    it("should accept 'expense' transaction type", () => {
      const result = TransactionCreateSchema.safeParse({
        ...validTransactionData,
        transaction_type: "expense",
      });
      expect(result.success).toBe(true);
    });

    it("should accept 'income' transaction type", () => {
      const result = TransactionCreateSchema.safeParse({
        ...validTransactionData,
        transaction_type: "income",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty description", () => {
      const result = TransactionCreateSchema.safeParse({
        ...validTransactionData,
        description: "",
      });
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain("cannot be empty");
    });

    it("should trim whitespace from description", () => {
      const result = TransactionCreateSchema.safeParse({
        ...validTransactionData,
        description: "  Coffee  ",
      });
      expect(result.success).toBe(true);
      expect(result.data.description).toBe("Coffee");
    });

    it("should reject invalid ISO 8601 datetime", () => {
      const result = TransactionCreateSchema.safeParse({
        ...validTransactionData,
        transaction_date: "2024-01-15",
      });
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain("ISO 8601");
    });

    it("should reject invalid account UUID", () => {
      const result = TransactionCreateSchema.safeParse({
        ...validTransactionData,
        account_id: "not-a-uuid",
      });
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain("UUID");
    });

    it("should reject invalid category UUID", () => {
      const result = TransactionCreateSchema.safeParse({
        ...validTransactionData,
        category_id: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("should accept null category_id", () => {
      const result = TransactionCreateSchema.safeParse({
        ...validTransactionData,
        category_id: null,
      });
      expect(result.success).toBe(true);
    });

    it("should accept undefined category_id", () => {
      const dataWithoutCategory = { ...validTransactionData, category_id: undefined };
      const result = TransactionCreateSchema.safeParse(dataWithoutCategory);
      expect(result.success).toBe(true);
    });
  });

  describe("TransactionUpdateSchema", () => {
    it("should accept partial update with amount_cents", () => {
      const result = TransactionUpdateSchema.safeParse({
        amount_cents: 6000,
      });
      expect(result.success).toBe(true);
    });

    it("should accept partial update with description", () => {
      const result = TransactionUpdateSchema.safeParse({
        description: "Updated description",
      });
      expect(result.success).toBe(true);
    });

    it("should accept multiple fields in update", () => {
      const result = TransactionUpdateSchema.safeParse({
        amount_cents: 6000,
        description: "Updated",
        transaction_type: "income",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty update (no fields)", () => {
      const result = TransactionUpdateSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain("At least one field");
    });

    it("should reject negative amounts in update", () => {
      const result = TransactionUpdateSchema.safeParse({
        amount_cents: -1000,
      });
      expect(result.success).toBe(false);
    });

    it("should accept null category_id to clear category", () => {
      const result = TransactionUpdateSchema.safeParse({
        category_id: null,
      });
      expect(result.success).toBe(true);
    });

    it("should accept all optional fields together", () => {
      const result = TransactionUpdateSchema.safeParse({
        amount_cents: 7000,
        transaction_type: "income",
        description: "New description",
        transaction_date: "2024-01-16T12:00:00Z",
        category_id: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("TransactionListQuerySchema", () => {
    it("should accept default parameters", () => {
      const result = TransactionListQuerySchema.safeParse({
        limit: 20,
        offset: 0,
      });
      expect(result.success).toBe(true);
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(0);
    });

    it("should use default limit of 20", () => {
      const result = TransactionListQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data.limit).toBe(20);
    });

    it("should use default offset of 0", () => {
      const result = TransactionListQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data.offset).toBe(0);
    });

    it("should coerce string limit to number", () => {
      const result = TransactionListQuerySchema.safeParse({
        limit: "10",
        offset: 0,
      });
      expect(result.success).toBe(true);
      expect(result.data.limit).toBe(10);
    });

    it("should reject limit > 50", () => {
      const result = TransactionListQuerySchema.safeParse({
        limit: 51,
        offset: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should accept limit = 50", () => {
      const result = TransactionListQuerySchema.safeParse({
        limit: 50,
        offset: 0,
      });
      expect(result.success).toBe(true);
      expect(result.data.limit).toBe(50);
    });

    it("should reject limit < 1", () => {
      const result = TransactionListQuerySchema.safeParse({
        limit: 0,
        offset: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative offset", () => {
      const result = TransactionListQuerySchema.safeParse({
        limit: 20,
        offset: -1,
      });
      expect(result.success).toBe(false);
    });

    it("should accept offset = 0", () => {
      const result = TransactionListQuerySchema.safeParse({
        limit: 20,
        offset: 0,
      });
      expect(result.success).toBe(true);
    });

    it("should accept large offset values", () => {
      const result = TransactionListQuerySchema.safeParse({
        limit: 20,
        offset: 10000,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("TransactionIdSchema", () => {
    it("should accept valid UUID", () => {
      const result = TransactionIdSchema.safeParse(mockTransactionId);
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const result = TransactionIdSchema.safeParse("not-a-uuid");
      expect(result.success).toBe(false);
    });

    it("should reject empty string", () => {
      const result = TransactionIdSchema.safeParse("");
      expect(result.success).toBe(false);
    });
  });
});

describe("createTransaction", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Successful creation", () => {
    it("should create transaction with valid data", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockTransactionResponse,
            error: null,
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: mockInsert,
      } as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await createTransaction(mockSupabase, mockUserId, validTransactionData);

      expect(result).toEqual({
        id: mockTransactionId,
        amount_cents: 5000,
        transaction_type: "expense",
        description: "Coffee",
        transaction_date: "2024-01-15T10:30:00Z",
        account_id: mockAccountId,
        category_id: mockCategoryId,
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z",
      });
    });

    it("should include user_id in database insert", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockTransactionResponse,
            error: null,
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: mockInsert,
      } as unknown as ReturnType<SupabaseClient["from"]>);

      await createTransaction(mockSupabase, mockUserId, validTransactionData);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          amount_cents: validTransactionData.amount_cents,
          transaction_type: validTransactionData.transaction_type,
          description: validTransactionData.description,
        })
      );
    });

    it("should handle null category_id by converting to null", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockTransactionResponse,
            error: null,
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: mockInsert,
      } as unknown as ReturnType<SupabaseClient["from"]>);

      await createTransaction(mockSupabase, mockUserId, {
        ...validTransactionData,
        category_id: null,
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          category_id: null,
        })
      );
    });

    it("should not expose user_id in response", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              ...mockTransactionResponse,
              user_id: mockUserId, // Should be excluded
            },
            error: null,
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: mockInsert,
      } as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await createTransaction(mockSupabase, mockUserId, validTransactionData);

      expect(result).not.toHaveProperty("user_id");
    });
  });

  describe("Validation errors", () => {
    it("should reject invalid amount", async () => {
      const invalidData = {
        ...validTransactionData,
        amount_cents: -1000,
      };

      await expect(createTransaction(mockSupabase, mockUserId, invalidData as never)).rejects.toThrow(
        "Validation error"
      );
    });

    it("should reject invalid transaction type", async () => {
      const invalidData = {
        ...validTransactionData,
        transaction_type: "transfer",
      };

      await expect(createTransaction(mockSupabase, mockUserId, invalidData as never)).rejects.toThrow(
        "Validation error"
      );
    });

    it("should reject invalid UUID formats", async () => {
      const invalidData = {
        ...validTransactionData,
        account_id: "not-a-uuid",
      };

      await expect(createTransaction(mockSupabase, mockUserId, invalidData as never)).rejects.toThrow(
        "Validation error"
      );
    });
  });

  describe("Database errors - Foreign key violations (23503)", () => {
    it("should throw specific error for invalid account_id", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: "23503",
              message: 'violates foreign key constraint "transactions_account_id_fkey"',
            },
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: mockInsert,
      } as unknown as ReturnType<SupabaseClient["from"]>);

      await expect(createTransaction(mockSupabase, mockUserId, validTransactionData)).rejects.toThrow(
        "Account not found or does not belong to user"
      );
    });

    it("should throw specific error for invalid category_id", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: "23503",
              message: 'violates foreign key constraint "transactions_category_id_fkey"',
            },
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: mockInsert,
      } as unknown as ReturnType<SupabaseClient["from"]>);

      await expect(createTransaction(mockSupabase, mockUserId, validTransactionData)).rejects.toThrow(
        "Category not found or does not belong to user"
      );
    });

    it("should throw generic error for other foreign key violations", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: "23503",
              message: "generic foreign key violation",
            },
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: mockInsert,
      } as unknown as ReturnType<SupabaseClient["from"]>);

      await expect(createTransaction(mockSupabase, mockUserId, validTransactionData)).rejects.toThrow(
        "Invalid account or category reference"
      );
    });
  });

  describe("Database errors - Check constraint violations (23514)", () => {
    it("should throw constraint error for check violations", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: "23514",
              message: "check constraint violation",
            },
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: mockInsert,
      } as unknown as ReturnType<SupabaseClient["from"]>);

      await expect(createTransaction(mockSupabase, mockUserId, validTransactionData)).rejects.toThrow(
        "Transaction data violates database constraints"
      );
    });
  });

  describe("Database errors - Other errors", () => {
    it("should throw generic error for unknown database error", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: "99999",
              message: "unknown error",
            },
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: mockInsert,
      } as unknown as ReturnType<SupabaseClient["from"]>);

      await expect(createTransaction(mockSupabase, mockUserId, validTransactionData)).rejects.toThrow(
        "Failed to create transaction due to database error"
      );
    });

    it("should throw error when no data is returned", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: mockInsert,
      } as unknown as ReturnType<SupabaseClient["from"]>);

      await expect(createTransaction(mockSupabase, mockUserId, validTransactionData)).rejects.toThrow(
        "Transaction creation failed - no data returned"
      );
    });
  });

  describe("Unexpected errors", () => {
    it("should handle unexpected errors gracefully", async () => {
      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error("Unexpected error")),
          }),
        }),
      } as unknown as ReturnType<SupabaseClient["from"]>);

      await expect(createTransaction(mockSupabase, mockUserId, validTransactionData)).rejects.toThrow(
        "An unexpected error occurred while creating the transaction"
      );
    });
  });
});

describe("listTransactions", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Successful retrieval", () => {
    it("should retrieve transactions with default pagination", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: [mockTransactionDTOResponse],
              error: null,
            }),
          }),
        }),
      });

      const mockCountSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          count: 100,
          error: null,
        }),
      });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({ select: mockCountSelect } as unknown as ReturnType<SupabaseClient["from"]>) // count query
        .mockReturnValueOnce({ select: mockSelect } as unknown as ReturnType<SupabaseClient["from"]>); // data query

      const result = await listTransactions(mockSupabase, mockUserId, {
        limit: 20,
        offset: 0,
      });

      expect(result.data).toHaveLength(1);
      expect(result.total_count).toBe(100);
    });

    it("should transform transaction data correctly", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: [
                {
                  id: mockTransactionId,
                  amount_cents: 5000,
                  transaction_type: "expense",
                  description: "Coffee",
                  transaction_date: "2024-01-15T10:30:00Z",
                  account_id: mockAccountId,
                  category_id: mockCategoryId,
                  created_at: "2024-01-15T10:30:00Z",
                  updated_at: "2024-01-15T10:30:00Z",
                  accounts: { name: "Checking" },
                  categories: { name: "Food" },
                },
              ],
              error: null,
            }),
          }),
        }),
      });

      const mockCountSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          count: 1,
          error: null,
        }),
      });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({ select: mockCountSelect } as unknown as ReturnType<SupabaseClient["from"]>) // count query
        .mockReturnValueOnce({ select: mockSelect } as unknown as ReturnType<SupabaseClient["from"]>); // data query

      const result = await listTransactions(mockSupabase, mockUserId, {
        limit: 20,
        offset: 0,
      });

      expect(result.data[0]).toMatchObject({
        id: mockTransactionId,
        amount_cents: 5000,
        transaction_type: "expense",
        accounts: { name: "Checking" },
        categories: { name: "Food" },
      });
    });

    it("should handle null category gracefully", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: [
                {
                  ...mockTransactionDTOResponse,
                  categories: null,
                },
              ],
              error: null,
            }),
          }),
        }),
      });

      const mockCountSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          count: 1,
          error: null,
        }),
      });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({ select: mockCountSelect } as unknown as ReturnType<SupabaseClient["from"]>) // count query
        .mockReturnValueOnce({ select: mockSelect } as unknown as ReturnType<SupabaseClient["from"]>); // data query

      const result = await listTransactions(mockSupabase, mockUserId, {
        limit: 20,
        offset: 0,
      });

      expect(result.data[0].categories).toBeNull();
    });

    it("should handle missing account name", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: [
                {
                  ...mockTransactionDTOResponse,
                  accounts: { name: undefined },
                },
              ],
              error: null,
            }),
          }),
        }),
      });

      const mockCountSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          count: 1,
          error: null,
        }),
      });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({ select: mockCountSelect } as unknown as ReturnType<SupabaseClient["from"]>) // count query
        .mockReturnValueOnce({ select: mockSelect } as unknown as ReturnType<SupabaseClient["from"]>); // data query

      const result = await listTransactions(mockSupabase, mockUserId, {
        limit: 20,
        offset: 0,
      });

      expect(result.data[0].accounts.name).toBe("Unknown Account");
    });

    it("should apply limit and offset correctly", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const mockCountSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          count: 100,
          error: null,
        }),
      });

      const mockRange = mockSelect().eq().order().range;

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({ select: mockCountSelect } as unknown as ReturnType<SupabaseClient["from"]>) // count query
        .mockReturnValueOnce({ select: mockSelect } as unknown as ReturnType<SupabaseClient["from"]>); // data query

      await listTransactions(mockSupabase, mockUserId, {
        limit: 10,
        offset: 20,
      });

      expect(mockRange).toHaveBeenCalledWith(20, 29);
    });

    it("should order by created_at descending", async () => {
      const mockOrder = vi.fn().mockReturnValue({
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: mockOrder,
        }),
      });

      const mockCountSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          count: 0,
          error: null,
        }),
      });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({ select: mockCountSelect } as unknown as ReturnType<SupabaseClient["from"]>) // count query
        .mockReturnValueOnce({ select: mockSelect } as unknown as ReturnType<SupabaseClient["from"]>); // data query

      await listTransactions(mockSupabase, mockUserId, {
        limit: 20,
        offset: 0,
      });

      expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
    });
  });

  describe("Error handling", () => {
    it("should throw error when count query fails", async () => {
      const mockCountSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          count: null,
          error: new Error("Count failed"),
        }),
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockCountSelect,
      } as unknown as ReturnType<SupabaseClient["from"]>);

      await expect(listTransactions(mockSupabase, mockUserId, { limit: 20, offset: 0 })).rejects.toThrow(
        "Failed to retrieve transaction count"
      );
    });

    it("should throw error when data query fails", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: null,
              error: new Error("Query failed"),
            }),
          }),
        }),
      });

      const mockCountSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          count: 10,
          error: null,
        }),
      });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({ select: mockCountSelect } as unknown as ReturnType<SupabaseClient["from"]>) // count query
        .mockReturnValueOnce({ select: mockSelect } as unknown as ReturnType<SupabaseClient["from"]>); // data query

      await expect(listTransactions(mockSupabase, mockUserId, { limit: 20, offset: 0 })).rejects.toThrow(
        "Failed to retrieve transactions from database"
      );
    });

    it("should handle null count gracefully", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const mockCountSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          count: null,
          error: null,
        }),
      });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({ select: mockCountSelect } as unknown as ReturnType<SupabaseClient["from"]>) // count query
        .mockReturnValueOnce({ select: mockSelect } as unknown as ReturnType<SupabaseClient["from"]>); // data query

      const result = await listTransactions(mockSupabase, mockUserId, {
        limit: 20,
        offset: 0,
      });

      expect(result.total_count).toBe(0);
    });
  });

  describe("Validation", () => {
    it("should reject invalid limit", async () => {
      await expect(listTransactions(mockSupabase, mockUserId, { limit: 51, offset: 0 } as never)).rejects.toThrow();
    });

    it("should reject negative offset", async () => {
      await expect(
        listTransactions(mockSupabase, mockUserId, {
          limit: 20,
          offset: -1,
        } as never)
      ).rejects.toThrow();
    });
  });
});

describe("updateTransaction", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Successful update", () => {
    it("should update transaction with single field", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockTransactionDTOResponse,
                error: null,
              }),
            }),
          }),
        }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: mockTransactionId, user_id: mockUserId },
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === "transactions") {
          return {
            select: mockSelect,
            update: mockUpdate,
          } as unknown as ReturnType<SupabaseClient["from"]>;
        }
        return {} as unknown as ReturnType<SupabaseClient["from"]>;
      });

      const result = await updateTransaction(mockSupabase, mockUserId, mockTransactionId, { amount_cents: 6000 });

      expect(result).toMatchObject({
        id: mockTransactionId,
        amount_cents: 5000,
      });
    });

    it("should verify transaction ownership before update", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: mockTransactionId, user_id: mockUserId },
              error: null,
            }),
          }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockTransactionDTOResponse,
                error: null,
              }),
            }),
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect,
        update: mockUpdate,
      } as unknown as ReturnType<SupabaseClient["from"]>);

      await updateTransaction(mockSupabase, mockUserId, mockTransactionId, { amount_cents: 6000 });

      // Verify that select was called with correct query for transaction ownership
      expect(mockSelect).toHaveBeenCalled();
    });

    it("should validate category ownership when updating category", async () => {
      const mockCategorySelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: mockCategoryId },
              error: null,
            }),
          }),
        }),
      });

      const mockTransactionSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: mockTransactionId, user_id: mockUserId },
              error: null,
            }),
          }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockTransactionDTOResponse,
                error: null,
              }),
            }),
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === "categories") {
          return {
            select: mockCategorySelect,
          } as unknown as ReturnType<SupabaseClient["from"]>;
        }
        return {
          select: mockTransactionSelect,
          update: mockUpdate,
        } as unknown as ReturnType<SupabaseClient["from"]>;
      });

      await updateTransaction(mockSupabase, mockUserId, mockTransactionId, { category_id: mockCategoryId });

      expect(mockCategorySelect).toHaveBeenCalled();
    });

    it("should allow clearing category with null", async () => {
      const mockTransactionSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: mockTransactionId, user_id: mockUserId },
              error: null,
            }),
          }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...mockTransactionDTOResponse, categories: null },
                error: null,
              }),
            }),
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === "categories") {
          return {} as unknown as ReturnType<SupabaseClient["from"]>;
        }
        return {
          select: mockTransactionSelect,
          update: mockUpdate,
        } as unknown as ReturnType<SupabaseClient["from"]>;
      });

      const result = await updateTransaction(mockSupabase, mockUserId, mockTransactionId, { category_id: null });

      expect(result.categories).toBeNull();
    });

    it("should build correct update payload with selective fields", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockTransactionDTOResponse,
                error: null,
              }),
            }),
          }),
        }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: mockTransactionId, user_id: mockUserId },
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === "transactions") {
          return {
            select: mockSelect,
            update: mockUpdate,
          } as unknown as ReturnType<SupabaseClient["from"]>;
        }
        return {} as unknown as ReturnType<SupabaseClient["from"]>;
      });

      await updateTransaction(mockSupabase, mockUserId, mockTransactionId, {
        amount_cents: 7000,
        description: "Updated",
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        amount_cents: 7000,
        description: "Updated",
      });
    });
  });

  describe("Authorization checks", () => {
    it("should reject if transaction not found", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect,
      } as unknown as ReturnType<SupabaseClient["from"]>);

      await expect(
        updateTransaction(mockSupabase, mockUserId, mockTransactionId, { amount_cents: 6000 })
      ).rejects.toThrow("Transaction not found or does not belong to user");
    });

    it("should reject if category doesn't belong to user", async () => {
      const mockCategorySelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      const mockTransactionSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: mockTransactionId, user_id: mockUserId },
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === "categories") {
          return {
            select: mockCategorySelect,
          } as unknown as ReturnType<SupabaseClient["from"]>;
        }
        return {
          select: mockTransactionSelect,
        } as unknown as ReturnType<SupabaseClient["from"]>;
      });

      const invalidCategoryId = "550e8400-e29b-41d4-a716-446655440099";
      await expect(
        updateTransaction(mockSupabase, mockUserId, mockTransactionId, { category_id: invalidCategoryId })
      ).rejects.toThrow("Category not found or does not belong to user");
    });
  });

  describe("Database errors", () => {
    it("should handle foreign key violation for category", async () => {
      const mockTransactionSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: mockTransactionId, user_id: mockUserId },
              error: null,
            }),
          }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: {
                  code: "23503",
                  message: "category_id foreign key violation",
                },
              }),
            }),
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === "categories") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: mockCategoryId },
                    error: null,
                  }),
                }),
              }),
            }),
          } as unknown as ReturnType<SupabaseClient["from"]>;
        }
        return {
          select: mockTransactionSelect,
          update: mockUpdate,
        } as unknown as ReturnType<SupabaseClient["from"]>;
      });

      await expect(
        updateTransaction(mockSupabase, mockUserId, mockTransactionId, { category_id: mockCategoryId })
      ).rejects.toThrow("Category not found or does not belong to user");
    });

    it("should handle check constraint violation", async () => {
      const mockTransactionSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: mockTransactionId, user_id: mockUserId },
              error: null,
            }),
          }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: {
                  code: "23514",
                  message: "check constraint violation",
                },
              }),
            }),
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === "categories") {
          return {} as unknown as ReturnType<SupabaseClient["from"]>;
        }
        return {
          select: mockTransactionSelect,
          update: mockUpdate,
        } as unknown as ReturnType<SupabaseClient["from"]>;
      });

      await expect(
        updateTransaction(mockSupabase, mockUserId, mockTransactionId, { amount_cents: 6000 })
      ).rejects.toThrow("Transaction data violates database constraints");
    });
  });

  describe("Validation", () => {
    it("should reject invalid transaction ID", async () => {
      await expect(updateTransaction(mockSupabase, mockUserId, "not-a-uuid", { amount_cents: 6000 })).rejects.toThrow(
        "Validation error"
      );
    });

    it("should reject empty update object", async () => {
      await expect(updateTransaction(mockSupabase, mockUserId, mockTransactionId, {})).rejects.toThrow(
        "Validation error"
      );
    });

    it("should reject negative amount in update", async () => {
      await expect(
        updateTransaction(mockSupabase, mockUserId, mockTransactionId, { amount_cents: -100 })
      ).rejects.toThrow("Validation error");
    });
  });
});

describe("deleteTransaction", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Successful deletion", () => {
    it("should delete transaction", async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: mockTransactionId, user_id: mockUserId },
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === "transactions") {
          return {
            select: mockSelect,
            delete: mockDelete,
          } as unknown as ReturnType<SupabaseClient["from"]>;
        }
        return {} as unknown as ReturnType<SupabaseClient["from"]>;
      });

      await deleteTransaction(mockSupabase, mockUserId, mockTransactionId);

      expect(mockDelete).toHaveBeenCalled();
    });

    it("should verify transaction ownership before deletion", async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: mockTransactionId, user_id: mockUserId },
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect,
        delete: mockDelete,
      } as unknown as ReturnType<SupabaseClient["from"]>);

      await deleteTransaction(mockSupabase, mockUserId, mockTransactionId);

      expect(mockSelect).toHaveBeenCalled();
    });
  });

  describe("Authorization checks", () => {
    it("should reject deletion of non-existent transaction", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect,
      } as unknown as ReturnType<SupabaseClient["from"]>);

      await expect(deleteTransaction(mockSupabase, mockUserId, mockTransactionId)).rejects.toThrow(
        "Transaction not found or does not belong to user"
      );
    });

    it("should reject deletion if transaction belongs to different user", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error("Not found"),
            }),
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect,
      } as unknown as ReturnType<SupabaseClient["from"]>);

      await expect(deleteTransaction(mockSupabase, mockUserId, mockTransactionId)).rejects.toThrow(
        "Transaction not found or does not belong to user"
      );
    });
  });

  describe("Database errors", () => {
    it("should handle database error during deletion", async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: new Error("Database error"),
          }),
        }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: mockTransactionId, user_id: mockUserId },
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === "transactions") {
          return {
            select: mockSelect,
            delete: mockDelete,
          } as unknown as ReturnType<SupabaseClient["from"]>;
        }
        return {} as unknown as ReturnType<SupabaseClient["from"]>;
      });

      await expect(deleteTransaction(mockSupabase, mockUserId, mockTransactionId)).rejects.toThrow(
        "Failed to delete transaction due to database error"
      );
    });
  });

  describe("Validation", () => {
    it("should reject invalid transaction ID", async () => {
      await expect(deleteTransaction(mockSupabase, mockUserId, "not-a-uuid")).rejects.toThrow("Validation error");
    });
  });

  describe("Edge cases", () => {
    it("should return void on successful deletion", async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: mockTransactionId, user_id: mockUserId },
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === "transactions") {
          return {
            select: mockSelect,
            delete: mockDelete,
          } as unknown as ReturnType<SupabaseClient["from"]>;
        }
        return {} as unknown as ReturnType<SupabaseClient["from"]>;
      });

      const result = await deleteTransaction(mockSupabase, mockUserId, mockTransactionId);

      expect(result).toBeUndefined();
    });
  });
});
