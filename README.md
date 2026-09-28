# In Smoke We Trust — finansijski dashboard

Sajt za praćenje prodaje, food costa, otpisa, rada, marže i profita restorana In Smoke We Trust.
Podaci se čuvaju u Supabase bazi, a u alat ulaze samo ljudi sa spiska članova.

## Šta je u ovom folderu

| Fajl | Čemu služi |
| --- | --- |
| `index.html` | Ceo dashboard (6 modula, arhiva, formule, Excel izvoz) |
| `auth.js` | Prijava emailom i veza sa Supabase bazom |
| `config.js` | Adresa Supabase projekta i javni ključ — jedini fajl koji menjaš |
| `schema.sql` | Tabele i pravila pristupa, pokreće se jednom |

## Postavljanje (jednom, oko 20 minuta)

### 1. Supabase — baza i prijava

1. Otvori [supabase.com](https://supabase.com), napravi nalog i novi projekat. Region: **Frankfurt (eu-central-1)**, najbliži Srbiji. Lozinku baze sačuvaj za sebe.
2. U projektu otvori **SQL Editor → New query**, nalepi ceo sadržaj fajla `schema.sql` i klikni **Run**.
3. Dodaj članove: **Table Editor → members → Insert row**. Za svaku osobu:
   - `email` — malim slovima, npr. `marko@insmoke.rs`
   - `role` — `editor` (unosi brojeve) ili `viewer` (samo gleda)
   - `name` — ime, radi preglednosti
   Dodaj i sebe.
4. Uzmi podatke za vezu: **Project Settings → API** (negde piše **Data API**). Treba ti:
   - **Project URL** (npr. `https://abcd1234.supabase.co`)
   - **anon public** ključ
   **Nikada** ne koristi `service_role` ključ u sajtu.

### 2. config.js

Otvori `config.js` i upiši te dve vrednosti umesto `TVOJ-PROJEKAT` i `TVOJ_ANON_PUBLIC_KLJUC`.
Anon ključ sme da bude javan: bez prijave i bez mesta na spisku članova niko ne vidi podatke.

### 3. GitHub — objava sajta

1. Na [github.com](https://github.com) napravi repozitorijum, npr. `insmoke-dashboard`.
2. Postavi sve fajlove iz ovog foldera (Add file → Upload files, ili preko git-a).
3. **Settings → Pages → Build and deployment**: Source = **Deploy from a branch**, Branch = **main**, folder **/ (root)** → Save.
4. Posle minut-dva sajt je na adresi `https://TVOJ-NALOG.github.io/insmoke-dashboard/`.

Napomena: na besplatnom GitHub nalogu Pages radi iz javnog repozitorijuma, pa je **kod** javan. **Podaci** restorana nisu u kodu, već u Supabase bazi iza prijave.

### 4. Supabase — adresa sajta za prijavu

U Supabase: **Authentication → URL Configuration**:
- **Site URL**: adresa sajta sa GitHub Pages (iz koraka 3.4)
- **Redirect URLs**: dodaj istu adresu

Bez ovoga link za prijavu vodi na pogrešno mesto.

### 5. Provera

1. Otvori sajt, upiši svoj email, klikni **Pošalji link za prijavu**.
2. Otvori mejl **na istom uređaju i u istom pregledaču** i klikni link.
3. Klikni **Počni svoj unos**, unesi jedan broj. Desno od kartica treba da piše **Sačuvano** sa vremenom.
4. Otvori sajt na telefonu, prijavi se — isti broj treba da bude tu.

## Svakodnevni rad

- **Novi član tima**: dodaj red u tabelu `members`. Odlazak iz tima: obriši red.
- **Uputstvo za korišćenje alata** (moduli, pojmovi, mesečna rutina) je poseban dokument koji si dobio uz alat.
- **Rezervna kopija**: u kartici Arhiva dugme **Preuzmi Excel** daje kompletnu kopiju svih meseci.

## Ograničenja besplatnih planova

- **Mejlovi za prijavu**: ugrađeni Supabase mejl šalje ograničen broj poruka na sat, dovoljno za mali tim. Za više korisnika podesi sopstveni SMTP u **Authentication → Emails / SMTP Settings**.
- **Supabase besplatni projekat** se pauzira posle dužeg perioda bez korišćenja. Ako se to desi, u Supabase kontrolnoj tabli klikni **Restore**; podaci ostaju.

## Česti problemi

| Šta vidiš | Šta uraditi |
| --- | --- |
| „Alat još nije povezan sa bazom“ | U `config.js` nisu upisani URL i ključ |
| „Nemaš pristup“ | Email nije u tabeli `members`, ili nije upisan malim slovima |
| Link iz mejla vraća na prijavu | Otvori link u istom pregledaču u kom si tražio link; proveri korak 4 |
| „Samo pregled“ desno od kartica | Uloga je `viewer`; promeni u `editor` |
| „Greška pri čuvanju“ | Proveri internet; ako traje, proveri da li je Supabase projekat pauziran |
