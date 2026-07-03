import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env') });

const email = process.argv[2];

if (!email) {
  console.error('Please provide an email address as an argument.');
  console.error('Usage: npx tsx make-admin.ts <email>');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL!);

async function makeAdmin() {
  try {
    const result = await sql`
      UPDATE users 
      SET role = 'admin' 
      WHERE email = ${email}
      RETURNING id, email, role;
    `;
    
    if (result.length === 0) {
      console.log(`User with email ${email} not found.`);
    } else {
      console.log(`Successfully updated user:`, result[0]);
    }
  } catch (error) {
    console.error('Error updating user:', error);
  }
}

makeAdmin();
