import { Pool, type PoolClient } from "pg";

let pool: Pool | null = null;

function getPool() {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }

  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  return pool;
}

let initializationPromise: Promise<void> | null = null;

async function initDatabase() {
  const client = await getPool().connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id text PRIMARY KEY,
        cpf text NOT NULL UNIQUE,
        password text NOT NULL,
        name text NOT NULL,
        role text NOT NULL DEFAULT 'admin'
      );

      CREATE TABLE IF NOT EXISTS inventory (
        id text PRIMARY KEY,
        title text NOT NULL,
        subtitle text NOT NULL,
        sku text NOT NULL,
        status text NOT NULL,
        size integer NOT NULL,
        color text NOT NULL,
        location text NOT NULL,
        stock integer NOT NULL,
        image text NOT NULL,
        action text NOT NULL,
        price_category text,
        price numeric
      );

      CREATE TABLE IF NOT EXISTS tailor_orders (
        id text PRIMARY KEY,
        inventory_id text NOT NULL REFERENCES inventory(id),
        assigned_to text NOT NULL REFERENCES users(id),
        adjustment_type text NOT NULL,
        description text NOT NULL,
        measurements text,
        status text NOT NULL DEFAULT 'Novo',
        notes text,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
        completed_at timestamp
      );

      CREATE TABLE IF NOT EXISTS tailor_tasks (
        id text PRIMARY KEY,
        order_id text NOT NULL,
        title text NOT NULL,
        note text NOT NULL,
        assigned_to text NOT NULL,
        when_text text NOT NULL,
        status text NOT NULL,
        priority text NOT NULL
      );

      CREATE TABLE IF NOT EXISTS return_orders (
        order_id text PRIMARY KEY,
        client text NOT NULL,
        item_id text NOT NULL,
        item text NOT NULL,
        due_date text NOT NULL,
        returned_date text,
        status text NOT NULL,
        penalty text NOT NULL,
        action text NOT NULL,
        amount_paid numeric,
        damage_fee numeric,
        laundry_status text
      );

      CREATE TABLE IF NOT EXISTS payments (
        id text PRIMARY KEY,
        item_id text NOT NULL REFERENCES inventory(id),
        item_title text NOT NULL,
        plan text NOT NULL,
        payment_type text NOT NULL DEFAULT 'Aluguel',
        amount numeric NOT NULL,
        entry_amount numeric,
        paid_amount numeric,
        status text NOT NULL,
        client_name text,
        client_phone text,
        client_email text,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      ALTER TABLE inventory ADD COLUMN IF NOT EXISTS price_category text;
    `);

    await client.query(`
      ALTER TABLE inventory ADD COLUMN IF NOT EXISTS price numeric;
    `);

    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'admin';
    `);

    await client.query(`
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT CURRENT_TIMESTAMP;
    `);

    await client.query(`
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS entry_amount numeric;
    `);

    await client.query(`
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_amount numeric;
    `);

    await client.query(`
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type text NOT NULL DEFAULT 'Aluguel';
    `);

    await client.query(`
      ALTER TABLE return_orders ADD COLUMN IF NOT EXISTS amount_paid numeric;
    `);

    await client.query(`
      ALTER TABLE return_orders ADD COLUMN IF NOT EXISTS damage_fee numeric;
    `);

    await client.query(`
      ALTER TABLE return_orders ADD COLUMN IF NOT EXISTS laundry_status text;
    `);
  } finally {
    client.release();
  }
}

export async function query(text: string, params?: unknown[]) {
  if (!initializationPromise) {
    initializationPromise = initDatabase();
  }
  await initializationPromise;
  return getPool().query(text, params);
}

export async function withTransaction<T>(operation: (client: PoolClient) => Promise<T>) {
  if (!initializationPromise) {
    initializationPromise = initDatabase();
  }
  await initializationPromise;

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
