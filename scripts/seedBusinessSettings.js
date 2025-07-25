#!/usr/bin/env node

const path = require('path');

// ─── 0) Load environment variables ───────────────────────────────────────────
// Adjust the filenames below to wherever you keep your connection string.
// This will populate `process.env.MONGODB_URI`, etc.
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// ─── 1) Hook ts-node so we can import .ts files ──────────────────────────────
require('ts-node').register({
  skipProject: true,     // ignore tsconfig.json (no bundler errors)
  transpileOnly: true,   // faster, no type‑checking
  compilerOptions: {
    module: 'commonjs',  // so `require()` works
    target: 'ES2022',     // Node 22+
  },
});

// ─── 2) Import your TS modules ────────────────────────────────────────────────
const dbConnect        = require('../src/lib/dbConnect').default;
const BusinessSettings = require('../src/models/BusinessSettings').default;

async function seed() {
  try {
    // ─── 3) Connect to MongoDB ───────────────────────────────────────────────
    await dbConnect();  // now reads your MONGODB_URI from process.env

    // ─── 4) Your default settings ────────────────────────────────────────────
    const defaults = {
      businessHours: {
        monday:    { open: '09:00', close: '18:00' },
        tuesday:   { open: '09:00', close: '18:00' },
        wednesday: { open: '09:00', close: '18:00' },
        thursday:  { open: '09:00', close: '18:00' },
        friday:    { open: '09:00', close: '18:00' },
        saturday:  { open: '10:00', close: '16:00' },
        sunday:    { open: '',       close: ''     }, // closed
      },
      holidays: [],
      breakMinutes: 15,
      maxBookingsPerDay: 20,
    };

    // ─── 5) Upsert into BusinessSettings ─────────────────────────────────────
    await BusinessSettings.findOneAndUpdate(
      {},         // match any existing doc
      defaults,   // apply these defaults
      { upsert: true, new: true }
    );

    console.log('✅  Business settings seeded!');
    process.exit(0);
  } catch (err) {
    console.error('❌  Seeding failed:', err);
    process.exit(1);
  }
}

seed();
