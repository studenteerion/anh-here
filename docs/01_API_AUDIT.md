╔══════════════════════════════════════════════════════════════════════════════╗
║                    AUDITO API - REPORT COMPLETO                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

📊 STATISTICHE RIASSUNTIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  • Total Issues Found: 18
  • 🔴 CRITICO (High Severity):     4 problemi
  • 🟡 IMPORTANTE (Medium Severity): 10 problemi
  • 🟢 BASSO (Low Severity):         4 problemi

PROBLEMI CRITICI (ALTA PRIORITÀ)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ❌ TABELLA: company_reports
   TIPO: Nessun endpoint API
   DESCRIZIONE: La tabella "company_reports" esiste nel database con colonne 
   (id, employee_id, created_at, link) ma NON HA ALCUN ENDPOINT per gestirla
   IMPATTO: Impossibile leggere, creare, modificare o eliminare company reports
   RACCOMANDAZIONE: Creare endpoints CRUD completi:
      • GET    /api/company-reports
      • POST   /api/company-reports
      • GET    /api/company-reports/{id}
      • PUT    /api/company-reports/{id}
      • DELETE /api/company-reports/{id}

2. ❌ TABELLA: shifts
   TIPO: Dati invalidi nel database
   DESCRIZIONE: TUTTI i 5 shift nel database hanno start_time e end_time con 
   valore "0000-00-00 00:00:00" (data/ora invalida)
   IMPATTO: Gli shift non hanno orari validi. Clock in/out basato su shift non 
   funziona correttamente
   RACCOMANDAZIONE: Aggiornare tutti gli shift con date/orari validi
      UPDATE shifts SET start_time = '2026-03-15 08:00:00', 
                       end_time = '2026-03-15 17:00:00' WHERE id = 1;

3. ❌ TABELLA: user_accounts
   TIPO: Nessun endpoint API pubblico
   DESCRIZIONE: La tabella "user_accounts" non ha endpoint per gestirla. 
   Gli admin non possono modificare email o disabilitare account
   IMPATTO: Impossibile modificare account, reset password, o disabilitare utenti
   RACCOMANDAZIONE: Creare endpoints:
      • GET    /api/accounts
      • GET    /api/accounts/{employeeId}
      • PUT    /api/accounts/{employeeId}
      • DELETE /api/accounts/{employeeId} (mark as disabled)

4. ❌ TABELLA: departments
   TIPO: Rischio cascade delete
   DESCRIZIONE: DELETE /api/departments/{id} cancella il dipartimento senza 
   validare se ha dipendenti assegnati
   IMPATTO: Cancellazione accidentale di dipendenti o orfani di dipartimento
   RACCOMANDAZIONE: Implementare una delle seguenti:
      a) Validazione: impedire delete se department ha employees
      b) Soft-delete: marcare come deleted invece di cancellare
      c) Cascade: documentare che cancella anche employees

PROBLEMI IMPORTANTI (MEDIA PRIORITÀ)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. ⚠️  TABELLA: attendances
   TIPO: Endpoint incompleto
   DESCRIZIONE: Nonostante la tabella "attendances" esista con dati, non ci 
   sono endpoint per leggere direttamente i record (solo punch clock in/out)
   RACCOMANDAZIONE: Aggiungere:
      • GET /api/attendances (con pagination e filtri per employee/date)
      • GET /api/attendances/{attendanceId}

6. ⚠️  TABELLA: employees
   TIPO: Validazione incompleta in POST
   DESCRIZIONE: Endpoint POST /api/employees non valida se role_id e 
   department_id esistono realmente nel database prima di creare l'employee
   RACCOMANDAZIONE: Aggiungere validazione FK:
      - Verificare che role_id esista in tabella roles
      - Verificare che department_id esista in tabella departments
      - Ritornare 400 se non esistono

7. ⚠️  TABELLA: permissions
   TIPO: Permessi mancanti
   DESCRIZIONE: Mancano permessi specifici per gestire "attendances". 
   Ci sono solo permessi generici come "view_history" e "clock_in_out"
   RACCOMANDAZIONE: Aggiungere permessi:
      • view_attendances
      • manage_attendances
      • export_attendances

8. ⚠️  TABELLA: timesheets
   TIPO: Mancanza di controllo di accesso
   DESCRIZIONE: GET /api/timesheets/history accetta un query parameter 
   employeeId ma non valida che l'utente abbia permesso di vederlo (risk: 
   information disclosure)
   RACCOMANDAZIONE: Aggiungere controllo:
      if (requestedEmployeeId !== employeeId) {
        const hasPerm = await checkUserPermission(employeeId, 'view_all_timesheets');
        if (!hasPerm) return 403;
      }

9. ⚠️  TABELLA: requests (leave_requests)
   TIPO: Permesso sbagliato
   DESCRIZIONE: PUT /api/requests/{id} controlla "user_permissions_update" 
   ma dovrebbe controllare "approve_requests" per autorizzare le approvazioni
   RACCOMANDAZIONE: Cambiare in:
      if (!hasPerm) {
        const hasPerm = await checkUserPermission(employeeId, "approve_requests");
      }

10. ⚠️ TABELLA: shifts
    TIPO: Endpoint mancante
    DESCRIZIONE: Non esiste endpoint GET /api/shifts/employee/{employeeId} 
    per ottenere i shift assegnati a un dipendente specifico
    RACCOMANDAZIONE: Creare GET /api/shifts/employee/{employeeId}

11. ⚠️ TABELLA: auth
    TIPO: Endpoint logout mancante
    DESCRIZIONE: Non esiste POST /api/auth/logout. I token non vengono 
    invalidati al logout (anche se il permesso "logout" è definito)
    RACCOMANDAZIONE: Implementare:
      • POST /api/auth/logout
      • Invalidare refresh token nel database
      • Client deve eliminare token locale

12. ⚠️ TABELLA: leave_requests
    TIPO: Logica approvazione incompleta
    DESCRIZIONE: La tabella ha struttura per approvazione multi-livello 
    (approver1, approver2) ma gli endpoint non implementano completamente 
    questa logica
    RACCOMANDAZIONE: Completare PUT /api/requests/update per:
      • Permettere sia approver1 che approver2 di approvare/rifiutare
      • Verificare ruoli degli approvatori
      • Aggiornare correttamente i timestamp

13. ⚠️ TABELLA: employees
    TIPO: Data quality issue
    DESCRIZIONE: Employee ID 24 (Davide Villa) ha status="inactive" ma ha 
    un refresh token valido fino al 2026-02-04. Può ancora accedere al sistema
    RACCOMANDAZIONE: 
      • Invalidare refresh tokens per inactive employees
      • Nel middleware auth, verificare status employee prima di accettare token
      • Considerare soft-delete invece di "inactive" status

14. ⚠️ GENERALE
    TIPO: Inconsistenza permessi
    DESCRIZIONE: Alcuni endpoint (es. GET /api/employees) usano permesso 
    generico "user_permissions_read" quando dovrebbero usare permessi 
    specifici granulari
    RACCOMANDAZIONE: Refactoring permessi:
      Creare permessi specifici per ogni risorsa:
      • view_employees, manage_employees
      • view_shifts, manage_shifts
      • view_departments, manage_departments
      • view_own_data, view_all_data (generici per fallback)

PROBLEMI MINORI (BASSA PRIORITÀ)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

15. 📝 TABELLA: roles
    TIPO: Documentazione mancante
    DESCRIZIONE: Endpoint GET /api/roles/{id}/permissions esiste nel codice 
    ma non è documentato in API_DOCS.md e Swagger
    RACCOMANDAZIONE: Aggiungere documentazione per questo endpoint

16. 📝 GENERALE
    TIPO: Codici errore mancanti
    DESCRIZIONE: API responses contengono solo messaggi testuali, nessun 
    error_code standardizzato per gestione client-side
    RACCOMANDAZIONE: Aggiungere error_code nei responses:
      {
        "message": "...",
        "error_code": "VALIDATION_ERROR",
        "details": {...}
      }

17. 📝 GENERALE
    TIPO: Audit logging mancante
    DESCRIZIONE: Non esiste nessun audit log per tracciare chi ha creato/
    modificato/cancellato record
    RACCOMANDAZIONE: Implementare audit logging:
      - Nuova tabella "audit_logs"
      - Log per tutte operazioni POST/PUT/DELETE
      - Timestamp, user, action, resource_type, resource_id, changes

18. 📝 GENERALE
    TIPO: Endpoint permissions inconsistenti
    DESCRIZIONE: POST /api/employees usa "user_permissions_create" che è 
    generico. GET /api/employees usa "user_permissions_read"
    RACCOMANDAZIONE: Standardizzare nomi permessi (es. create_employees, 
    read_employees, update_employees, delete_employees)

TABELLA DI COVERAGE - CONFRONTO DATABASE VS API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tabella                  | DB | GET | POST | PUT | DELETE | Note
────────────────────────────────────────────────────────────────────────────────
employees               | ✓  | ✓   | ✓    | ✓   | ✓      | OK
departments             | ✓  | ✓   | ✓    | ✓   | ✓      | Risk: cascade delete
roles                   | ✓  | ✓   | ✓    | ✓   | ✓      | OK
shifts                  | ✓  | ✓   | ✓    | ✓   | ✓      | ❌ Dati invalidi (date all 0000)
permissions             | ✓  | ✓   | ✓    | -   | -      | ⚠️  Mancano specifici
permission_exceptions   | ✓  | -   | ✓    | -   | -      | ⚠️  Endpoint limitati
leave_requests          | ✓  | ✓   | ✓    | ✓   | ✓      | ⚠️  Approvazione incompleta
attendances             | ✓  | -   | ✓*   | -   | -      | ❌ Solo punch, manca GET
company_reports         | ✓  | -   | -    | -   | -      | ❌ ZERO endpoints
user_accounts           | ✓  | -   | -    | -   | -      | ❌ ZERO endpoints
refresh_tokens          | ✓  | -   | -    | -   | -      | ⚠️  Internal only
role_permission         | ✓  | -   | ✓    | ✓   | -      | ⚠️  Endpoint limitati
anomalies               | ✓  | ✓   | ✓    | ✓   | ✓      | OK

LEGENDA: ✓ = Implementato | ⚠️ = Incompleto | - = Mancante | ❌ = Critico
(*) = Creazione indiretta tramite punch endpoint

RIASSUNTO AZIONI RICHIESTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 IMMEDIATE (Fix immediatamente):
   [ ] Aggiornare dati shifts con date/ore valide
   [ ] Creare endpoints CRUD per company_reports (5 endpoint)
   [ ] Creare endpoints CRUD per user_accounts (4 endpoint)
   [ ] Aggiungere validazione FK a POST /api/employees
   [ ] Implementare logout endpoint con token invalidation

🟡 SHORT TERM (Entro 1 settimana):
   [ ] Aggiungere GET /api/attendances endpoints
   [ ] Correggere controlli permessi in timesheets/history
   [ ] Completare logica approvazione multi-livello in leave_requests
   [ ] Implementare soft-delete per departments
   [ ] Invalidare tokens per inactive employees

🟢 MEDIUM TERM (Entro 2 settimane):
   [ ] Refactoring permessi granulari
   [ ] Aggiungere endpoint per employee-specific shifts
   [ ] Implementare audit logging
   [ ] Standardizzare error codes
   [ ] Completare documentazione Swagger

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fine Report | Generated: 2026-03-15
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
