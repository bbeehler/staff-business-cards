// Connected to the Supabase project "staff-cards" (Canada Central).
// The anon key is safe to publish: the database security rules protect the data.
window.CARD_CONFIG = {
  supabaseUrl: "https://djnspzjjaltljqkcerbq.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqbnNwempqYWx0bGpxa2NlcmJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMTIzMTYsImV4cCI6MjEwODY4ODMxNn0.OUq-gxmdSA87_mBWfhy7typRf8gf5PgwdJG1C7v7Vdc",

  // The public address of this site (no trailing slash).
  siteUrl: "https://card.aiacanada.com",

  // Email domains allowed to sign in. Must match is_staff() in supabase/schema.sql.
  allowedDomains: ["aiacanada.com", "i-car.ca"],

  // Optional but recommended for iPhones (SETUP.md, step 5).
  // Example: "https://YOUR-PROJECT-REF.supabase.co/functions/v1/vcard"
  vcardFunctionUrl: "https://djnspzjjaltljqkcerbq.supabase.co/functions/v1/vcard"
};
