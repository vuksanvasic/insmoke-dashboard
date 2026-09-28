// Podešavanje veze sa Supabase bazom (projekat "insmoke-dashboard").
// Ovde ide SAMO "Project URL" i "anon public" ključ — oni su predviđeni da budu javni;
// podatke štiti prijava i pravila pristupa u bazi (Row Level Security).
// NIKADA ne upisuj "service_role" ključ u ovaj fajl.
window.ISWT_CONFIG = {
  supabaseUrl: "https://wuffwstspqhhssdtubwe.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1ZmZ3c3RzcHFoaHNzZHR1YndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2MjYzMDcsImV4cCI6MjEwNjIwMjMwN30.3eilmSxGKiNcPHUj0C94jZm3O7XBSc_gAPdjv2DCYkk"
};
