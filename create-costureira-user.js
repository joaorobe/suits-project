const fs = require('fs');
const { Client } = require('pg');

const envContents = fs.readFileSync('.env.local', 'utf8');
const envLine = envContents.split(/\r?\n/).find((line) => line.startsWith('DATABASE_URL='));
if (!envLine) {
  throw new Error('DATABASE_URL not found in .env.local');
}
const DATABASE_URL = envLine.split('=')[1].replace(/^"|"$/g, '');

(async () => {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query(`CREATE TABLE IF NOT EXISTS users (
    id text PRIMARY KEY,
    cpf text NOT NULL UNIQUE,
    password text NOT NULL,
    name text NOT NULL,
    role text NOT NULL DEFAULT 'admin'
  )`);

  const id = 'USER-COSTUREIRA';
  const cpf = '12345678911';
  const password = 'senha123';
  const name = 'Costureira Test';
  const role = 'costureira';

  await client.query(
    'INSERT INTO users (id, cpf, password, name, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (cpf) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name, role = EXCLUDED.role',
    [id, cpf, password, name, role]
  );

  console.log('Usuário de costureira criado/atualizado com CPF 12345678911 e senha senha123');
  await client.end();
})();
