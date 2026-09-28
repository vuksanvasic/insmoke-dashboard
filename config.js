// Podešavanje veze sa Supabase bazom.
// Vrednosti se nalaze u Supabase projektu: Project Settings → API (ili Data API).
// Ovde ide SAMO "Project URL" i "anon public" ključ — oni su predviđeni da budu javni.
// NIKADA ne upisuj "service_role" ključ u ovaj fajl.
window.ISWT_CONFIG = {
  supabaseUrl: "https://TVOJ-PROJEKAT.supabase.co",
  supabaseAnonKey: "TVOJ_ANON_PUBLIC_KLJUC"
};
