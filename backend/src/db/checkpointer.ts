import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { Pool } from "pg";

let checkpointer: PostgresSaver | null = null;
let pool: Pool | null = null;

export const getCheckpointer = async (): Promise<PostgresSaver> => {
  if (checkpointer) return checkpointer;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for PostgresSaver");
  }

  pool = new Pool({ connectionString });
  checkpointer = new PostgresSaver(pool);
  
  // Note: In production you'd want a proper migration for these tables,
  // but setup() ensures the LangGraph checkpoint tables exist.
  await checkpointer.setup();
  
  return checkpointer;
};
