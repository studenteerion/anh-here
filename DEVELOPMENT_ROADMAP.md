# Roadmap di Sviluppo - ANH-here

**Data Documento**: 13 Maggio 2026  
**Autore**: Ballushi Erion  
**Versione**: 1.0  
**Status**: Progetto in Sviluppo Attivo

---

## 📋 Indice

1. [Stato Attuale del Progetto](#stato-attuale)
2. [Moduli Completati](#moduli-completati)
3. [Roadmap Future - Fase 2](#roadmap-future)
4. [Roadmap Future - Fase 3](#roadmap-future-fase-3)
5. [Timeline di Sviluppo](#timeline)
6. [Architettura e Scalabilità](#architettura)

---

## Stato Attuale del Progetto

**ANH-here** è un'applicazione di gestione delle presenze enterprise-grade costruita con tecnologie moderne e architettura multi-tenant.

### Metriche di Completezza Attuali

| Componente | Status | % Completato |
|-----------|--------|--------------|
| **Autenticazione e Autorizzazione** | ✅ Implementato | 80% |
| **Gestione Presenze (Core)** | ✅ Implementato | 85% |
| **Gestione Dipendenti** | ✅ Implementato | 75% |
| **Gestione Turni** | ✅ Implementato | 80% |
| **Gestione Permessi/Ferie** | 🟡 In Progresso | 40% |
| **Rilevamento Anomalie** | 🟡 In Progresso | 35% |
| **Reporting e Export** | 🟡 In Progresso | 40% |
| **Sistema Notifiche** | 📅 Programmato | 10% |
| **Sicurezza Avanzata** | 📅 Programmato | 50% |
| **GDPR & Compliance** | 📅 Programmato | 30% |
| **TOTALE PROGETTO** | ✅ **In Sviluppo** | **~55%** |

### Stack Tecnologico Implementato

- ✅ **Frontend**: Next.js 13+ (App Router), React 18, TypeScript, Tailwind CSS
- ✅ **Backend**: Next.js API Routes, TypeScript, JWT Authentication
- ✅ **Database**: MySQL con architettura multi-tenant
- ✅ **CI/CD**: Docker, Docker Compose (in configurazione)
- ✅ **Architecture**: Role-Based Access Control (RBAC)

---

## ✅ Moduli Completati

### 1. Sistema di Autenticazione (80% Completato)

**Implementato**:
- ✅ Login con email/password
- ✅ JWT tokens con HttpOnly cookies (XSS protection)
- ✅ Token refresh automatico
- ✅ Multi-tenant workspace selection
- ✅ Change password endpoint
- ✅ Logout con session cleanup
- ✅ Platform-level e Tenant-level auth dual system

**Codice Referenza**:
```
/app/api/auth/login/route.ts
/app/api/auth/refresh/route.ts
/app/api/auth/change-password/route.ts
```

---

### 2. Gestione Presenze Core (85% Completato)

**Implementato**:
- ✅ Clock In / Clock Out
- ✅ Storico presenze con filtri
- ✅ Calcolo automatico ore lavorate
- ✅ Associazione turni
- ✅ Database transazionale per race conditions
- ✅ API REST completa

**Funzionalità**:
- Registrazione real-time orari
- Auto-calcolo durata shift
- Filtri per periodo (ultimi 7gg, mese, 3 mesi)
- Visualizzazione timeline presenze

---

### 3. Gestione Dipendenti (75% Completato)

**Implementato**:
- ✅ CRUD dipendenti completo
- ✅ Assegnazione reparti
- ✅ Assegnazione ruoli
- ✅ Stato attivo/inattivo
- ✅ Dashboard statistiche

**Funzionalità**:
- Lista dipendenti con ricerca
- Modifica dati anagrafici
- Filtri per reparto/stato
- Metriche (totale, attivi, inattivi, media ore)

---

### 4. Gestione Turni (80% Completato)

**Implementato**:
- ✅ CRUD turni
- ✅ Orari turno configurabili
- ✅ Tipi turno (standard, straordinario, trasferta)
- ✅ Assegnazione dipendenti a turni
- ✅ Visualizzazione turni

**Funzionalità**:
- Creazione turni con orari
- Classificazione (mattina/pomeriggio/notte)
- Linking dipendenti-turni
- Conteggio dipendenti per turno

---

### 5. Dashboard e UI (80% Completato)

**Implementato**:
- ✅ Layout responsive con sidebar
- ✅ Menu navigazione principale
- ✅ Dashboard overview
- ✅ Componenti shadcn/ui
- ✅ Tailwind CSS styling
- ✅ Dark/Light mode (opzioni)

---

### 6. Autorizzazione RBAC (75% Completato)

**Implementato**:
- ✅ Ruoli (Admin, Manager, Employee)
- ✅ Permissions per ruolo
- ✅ Permission exceptions (tabella)
- ✅ Middleware di verifica permessi

**Codice**:
```
/lib/db/roles.ts
/lib/db/permissions.ts
```

---

## 🟡 Roadmap Future - Fase 2

### Obiettivo Fase 2
Completare le funzionalità di core business e migliorare robustezza del sistema.

---

### Feature 1: Email Verification & Secure Onboarding

**Contesto**:
Attualmente gli utenti vengono creati manualmente dagli admin. La Fase 2 introduce self-service registration con verifica email.

**Consegne Previste**:
- 📧 Servizio email integrato (SMTP/SendGrid)
- 🔗 Token di verifica email con scadenza (15 minuti)
- 📝 Pagina di registrazione pubblica
- 🔐 Flusso: Registrazione → Verifica Email → Creazione Password → Account Attivo
- 📨 Template email professionali

**Vantaggi**:
- Registrazione self-service per nuovi dipendenti
- Verifica proprietà email
- Riduzione del lavoro amministrativo

---

### Feature 2: Recupero Password / Password Dimenticata

**Contesto**:
Dipendenti che dimenticano la password devono contattare l'admin. Implementiamo il recupero self-service.

**Consegne Previste**:
- 🔄 API: POST /api/auth/forgot-password
- 🔗 Token di reset con scadenza (30 minuti)
- 📧 Email di recupero con link
- 🔐 Pagina /reset-password?token=xxx
- ✅ Invalidazione token dopo l'uso

---

### Feature 3: Sistema di Notifiche Email

**Contesto**:
Documentato nel manuale utente ma non ancora implementato. Notifiche per:
- Registrazione completata
- Recupero password
- Permessi approvati/rifiutati
- Anomalie rilevate
- Report mensili

**Consegne Previste**:
- 📧 Servizio email centralizzato (/lib/email/)
- 📋 Motore template (Handlebars/EJS)
- 📤 Sistema di coda per email asincrone
- 📊 Registrazione notifiche inviate
- 🔄 Logica di ritentativo per errori

**Template Email**:
```
- Email di benvenuto
- Recupero password
- Notifiche approvazione
- Avvisi anomalie
- Report mensili
- Assegnazione turni
```

---

### Feature 4: Richieste di Permesso/Ferie - Completamento

**Contesto**:
La tabella LEAVE_REQUESTS esiste ma manca il workflow completo.

**Consegne Previste**:
- ✏️ API CRUD per richieste di permesso
- ✅ Workflow: In Attesa → Approvato/Rifiutato
- 📅 Saldo ferie (tracciamento saldo annuale)
- 🔔 Notifiche approvazione/rifiuto
- 📊 Visualizzazione calendario ferie approvate
- ✅ Validazione: nessuna richiesta se ferie esaurite

**Funzionalità**:
- Dipendenti richiedono permessi
- Manager approva/rifiuta
- Sistema calcola giorni disponibili
- Dashboard storico richieste

---

### Feature 5: Rilevamento Automatico Anomalie

**Contesto**:
Attualmente le anomalie sono solo segnalate manualmente. Implementiamo il rilevamento automatico.

**Consegne Previste**:
- 🤖 Job schedulato (worker in background)
- 🔍 Logica di rilevamento anomalie:
  - Accesso/uscita fuori turno
  - Assenza di registrazione uscita
  - Assenza non giustificata
  - Ore eccessive
  - Gap non spiegati fra turni
- 📧 Avviso email admin per anomalie
- 📊 Dashboard anomalie rilevate automaticamente

**Frequenza**: Giornaliera (primi di mattina)

---

### Feature 6: Generazione Report - Potenziata

**Contesto**:
I report non sono ancora esportabili in formati multipli.

**Consegne Previste**:
- 📄 Generazione PDF (pdfkit/puppeteer)
- 📊 Esportazione CSV
- 📋 Esportazione JSON
- 🎨 Template personalizzabili
- 📧 Report schedulati (email mensili)
- 🔍 Generatore di query per report personalizzati

**Tipi di Report**:
```
1. Report Presenze (per dipendente/periodo)
2. Report Aziendale Completo
3. Report Anomalie
4. Analitiche Ore
5. Esportazione Gestione Paghe
```

---

### Feature 7: Sistema di Registrazione Controllo (Audit Log)

**Contesto**:
Nessun tracciamento delle azioni per conformità GDPR.

**Consegne Previste**:
- 📝 Tabella audit_logs
- 🔍 Middleware per registrazione automatica
- 📊 API per interrogare registro controllo
- 🎯 Filtri: utente, azione, risorsa, intervallo date
- 📤 Esportazione registro
- 🧹 Politica di conservazione (90 giorni predefiniti)

**Eventi Registrati**:
- Accesso/uscita utente
- Modifiche dati (creazione/modifica/eliminazione)
- Modifiche permessi
- Operazioni in blocco
- Accesso a dati sensibili

---

## 📅 Roadmap Future - Fase 3

### Feature 1: Two-Factor Authentication (2FA)

- 🔐 TOTP (Google Authenticator)
---

### Feature 2: Rate Limiting & Brute Force Protection

- 🛡️ Rate limiting su login endpoint
- 🔒 Account lockout dopo N tentativi falliti
- 📧 Email alert per sospetti accessi

---

### Feature 3: CSRF Protection

- 🛡️ CSRF token middleware
- ✅ Validazione su POST/PUT/DELETE
- 🔒 SameSite cookie policy

---

### Feature 4: Advanced Permission Management UI

- 🎨 UI per gestire permission exceptions
- 👤 Per-employee permission override
- 📝 Audit trail delle permission changes

---

### Feature 5: Bulk Operations

- 📥 Importazione dipendenti da CSV
- 📋 Bulk shift assignment
- 📤 Bulk export presenze
- 🎯 Bulk anomaly resolution

---

### Feature 6: Mobile Optimization

- 📱 Responsive design completo

---

## 📊 Sequenza di Sviluppo

**Fase Attuale**:
- ✅ Core Auth System
- ✅ Presenze Management
- ✅ Gestione Dipendenti
- ✅ Turni
- 🟡 Permessi/Ferie (50%)

**Fase 2**:
- 📧 Email Service
- 🔄 Password Reset
- ✅ Leave Requests Workflow
- 🤖 Anomaly Detection
- 📊 Report Generation
- 📝 Audit Logging

**Fase 3**:
- 🔐 2FA
- 🛡️ Security Hardening
- 📱 Mobile Optimization
- 🔒 Brute Force Protection
- 🎯 Permission Exceptions UI
- 📥 Bulk Operations
- ⚙️ Performance Optimization

---

## 🏗️ Architettura e Scalabilità

### Decisioni Architetturali

**1. Schema Database Multi-Tenant**
- Isolamento dati completo per azienda
- Scalabilità orizzontale
- RBAC granulare

**2. Modello JWT + Token di Refresh**
- Sessioni stateless
- Cookie HttpOnly (protezione XSS)
- Doppio contesto (Piattaforma + Tenant)

**3. Integrità Transazionale**
- Transazioni MySQL per race conditions
- SELECT FOR UPDATE su operazioni critiche

**4. Separazione dei Compiti**
```
/app                - Frontend + API routes
/lib/db             - Funzioni database
/lib/api            - Utilità API
/lib/auth           - Logica autenticazione
/components         - Componenti React
/contexts           - Context React
/types              - Tipi TypeScript
```

### Scalabilità Futura

- [ ] Repliche di lettura database
- [ ] Livello cache (Redis)
- [ ] Coda di messaggi (Bull/RabbitMQ)
- [ ] CDN per asset
- [ ] Scalabilità orizzontale con load balancer
- [ ] Limitazione di frequenza API centralizzata

---

## 📈 Metriche di Qualità

### Test
- Framework test: Jest ✅
- Obiettivo copertura: 70%+ per logica core
- Test end-to-end: In pianificazione

### Qualità del Codice
- Linting: ESLint ✅
- Type safety: TypeScript strict mode ✅
- Revisione del codice: Prima del merge

### Prestazioni
- Caricamento pagina: < 2s obiettivo
- Risposta API: < 500ms obiettivo
- Query database: Indicizzate appropriatamente

---

## 🎓 Conclusioni

**ANH-here** è un progetto professionale con:
- ✅ Architettura solida e scalabile
- ✅ 55% delle funzionalità core completate
- ✅ Stack moderno e maintainable
- 📅 Roadmap chiara e progressiva
- 🚀 Pronto per fase 2 di sviluppo

L'applicazione segue best practices di:
- Security (JWT, HttpOnly, RBAC)
- Database design (multi-tenant, transactions)
- Code organization (separation of concerns)
- UX (responsive, intuitive)

---

**Fine Documento**

*Questo documento rappresenta lo stato del progetto al 13 Maggio 2026 e sarà aggiornato bi-settimanalmente con i progressi di sviluppo.*
