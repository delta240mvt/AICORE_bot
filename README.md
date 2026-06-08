<div align="center">

<pre>
 █████╗ ██╗     ██████╗ ██████╗ ██████╗ ███████╗
██╔══██╗██║    ██╔════╝██╔═══██╗██╔══██╗██╔════╝
███████║██║    ██║     ██║   ██║██████╔╝█████╗  
██╔══██║██║    ██║     ██║   ██║██╔══██╗██╔══╝  
██║  ██║██║    ╚██████╗╚██████╔╝██║  ██║███████╗
╚═╝  ╚═╝╚═╝     ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝
                                 b o t
</pre>

**Oficjalny bot serwera Discord społeczności AI CORE – miejsca dla twórców budujących z AI.**

[![Discord](https://img.shields.io/discord/1481751053073649794?color=5865F2&logo=discord&logoColor=white)](https://discord.gg/qXSFgtTh8p)
[![GitGuardian Security](https://img.shields.io/badge/Security-GitGuardian-blue?logo=gitguardian)](https://gitguardian.com)

[**Dołącz do nas na Discordzie!**](https://discord.gg/qXSFgtTh8p)

</div>

---

## 🤖 Co robi ten bot?

Bot służy do pełnej automatyzacji serwera Discord. Został zaprojektowany tak, by maksymalnie ułatwić zarządzanie społecznością i uprościć dołączanie nowych członków (onboarding):

- **Automatyczna konfiguracja (Setup)**: Jeden skrypt samodzielnie tworzy całą strukturę serwera – kategorie (ONBOARDING, POLSKA, ADMIN), odpowiednie kanały (np. `#zasady`, `#witaj`, `#pl-general`, `#admin-logs`) oraz niezbędne role z odpowiednimi uprawnieniami (Admin, Moderator, Founding Builder, Builder).
- **Prosty system Onboardingu**: Bot publikuje oficjalny regulamin społeczności na kanale `#zasady` w formie ładnej wizytówki (Embed) z interaktywnym przyciskiem "Akceptuję regulamin".
- **Zarządzanie dostępem (Role Assignment)**: Nowy użytkownik widzi tylko kanał z regulaminem. Po kliknięciu w przycisk bot sprawdza jego status i automatycznie przypisuje mu rolę **Builder**, dając mu dostęp do reszty serwera.
- **Powiadomienia i Logi**: Bot wita nowych Builderów na kanale `#witaj` oraz wysyła dyskretne informacje o ich dołączeniu na kanał `#admin-logs`.
- **Działa na krawędzi (Edge)**: Silnik bota został napisany pod Cloudflare Workers. Jest błyskawiczny (serverless), skalowalny w nieskończoność i darmowy w utrzymaniu.

## 🛡️ Bezpieczeństwo
To repozytorium jest chronione przed wyciekiem danych uwierzytelniających. Zintegrowany **GitGuardian CLI (`ggshield`)** (skonfigurowany jako lokalny `pre-push` git hook) automatycznie skanuje wszystkie zmiany tuż przed ich wysłaniem do zewnętrznego repozytorium na GitHubie.

---

## 🚀 Instrukcja wdrożenia dla Nowego Użytkownika / Agenta AI

Zanim opublikujesz bota za pomocą Cloudflare Workers, musisz zarejestrować swoją aplikację w portalu deweloperskim Discorda i powiązać ją z kodem.

### Krok 1: Konfiguracja w Discord Developer Portal
1. Wejdź na [Discord Developer Portal](https://discord.com/developers/applications) i zaloguj się.
2. Kliknij **"New Application"** w prawym górnym rogu. Podaj nazwę (np. `AI CORE Bot`) i zatwierdź.
3. W zakładce **General Information**:
   - Skopiuj `Application ID` (przyda się do zaproszenia bota na serwer).
   - Skopiuj `Public Key` (to będzie Twój `DISCORD_PUBLIC_KEY`).
4. Przejdź do zakładki **Bot** po lewej stronie:
   - Kliknij **"Reset Token"** i skopiuj nowy token (zrób to tylko raz, token zniknie!). To Twój `DISCORD_TOKEN`.
   - Zjedź niżej i odznacz opcję "Public Bot" (dzięki temu tylko Ty możesz go dodawać do serwerów).
5. Przejdź do zakładki **OAuth2 -> URL Generator**:
   - W okienku *Scopes* zaznacz `bot` oraz `applications.commands`.
   - W okienku *Bot Permissions* zaznacz `Administrator` (aby bot mógł nadawać role i tworzyć kanały).
   - Skopiuj wygenerowany na samym dole strony link, wklej go do przeglądarki i **zaproś bota na swój własny serwer**.

### Krok 2: Przygotowanie środowiska
Pobierz kod z tego repozytorium i zainstaluj pakiety:
```bash
cd discord-bot
npm install
```

### Krok 3: Dodanie sekretów do projektu
Zarówno środowisko lokalne (do wykonania skryptu Setup), jak i produkcyjne (Cloudflare) potrzebuje tych kluczy.

1. **Konfiguracja lokalna:**
   W głównym folderze (tam gdzie masz `package.json` lub o poziom wyżej) utwórz plik o nazwie `.env.local` i dodaj do niego:
   ```ini
   DISCORD_TOKEN="wklej_tutaj_token_zakladki_bot"
   DISCORD_GUILD_ID="wklej_id_twojego_serwera"
   ```
   *(ID serwera skopiujesz w aplikacji Discord, klikając prawym przyciskiem myszy na jego ikonę i wybierając "Kopiuj ID serwera". Wymaga to włączenia Trybu Dewelopera w ustawieniach Discorda).*

2. **Konfiguracja Cloudflare Workers:**
   Wpisz w terminalu następujące komendy i podaj odpowiednie wartości:
   ```bash
   npx wrangler secret put DISCORD_TOKEN
   # wklej swój bot token
   
   npx wrangler secret put DISCORD_PUBLIC_KEY
   # wklej Public Key z zakładki General Information
   ```

3. W pliku `discord-bot/wrangler.toml` upewnij się, że pole `DISCORD_GUILD_ID` ma ustawione poprawne ID Twojego serwera.

### Krok 4: Uruchomienie skryptu konfigurującego strukturę
Teraz wywołamy skrypt, który połączy się z Discordem, potworzy kanały, kategorie, role i wygeneruje na `#zasady` wiadomość z przyciskiem do akceptacji regulaminu.
```bash
npx tsx src/setup.ts
```

### Krok 5: Publikacja logiki Bota do Cloudflare
Gdy serwer ma już odpowiednią strukturę, wgrywamy kod bota, który ma nasłuchiwać i przetwarzać kliknięcia:
```bash
npx wrangler deploy
```
Po sukcesie, konsola wypluje adres URL Twojego workera (np. `https://frinter-core-bot.<twoje_konto>.workers.dev`). **Skopiuj ten adres.**

### Krok 6: Podłączenie bota pod zdarzenia Discorda (Interactions Endpoint)
Ostatni etap to nakazanie Discordowi wysyłania sygnałów o kliknięciach na ten nowy adres URL:
1. Wróć do [Discord Developer Portal](https://discord.com/developers/applications).
2. Przejdź do zakładki **General Information**.
3. Znajdź pole o nazwie **Interactions Endpoint URL**.
4. Wklej tam skopiowany przed chwilą adres z Cloudflare.
5. Zapisz zmiany. Discord wyśle szybki pakiet testowy – jeśli wyświetli sukces, to wszystko działa idealnie!

---
To tyle! Bot jest aktywny, serverless i gotowy do zarządzania społecznością.
