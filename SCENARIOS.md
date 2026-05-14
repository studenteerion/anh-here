## <a name="scenari"></a> Scenari

## Scenario 1: Registrazione Presenza con Anomalia Rilevata
**Caso d'Uso Principale**: UC1 - Registrare Presenza  
**Attori Coinvolti**: Dipendente, Sistema Automatico, Responsabile Presenze  
**Precondizioni**:
- Il dipendente è autenticato nel sistema
- Il turno del dipendente è configurato
- La data è un giorno lavorativo

**Flusso Principale**:
1. Dipendente accede alla sezione "Timbrature" dell'applicazione
2. Sistema visualizza lo stato attuale: "Entrata non registrata"
3. Dipendente clicca su "Registra Entrata"
4. Sistema registra timestamp di entrata (09:45)
5. Sistema confronta orario con turno previsto (09:00)
6. **ANOMALIA RILEVATA**: Ritardo di 45 minuti
7. Sistema auto-genera segnalazione anomalia
8. Dipendente riceve notifica: "Entrata registrata con ritardo (09:45 vs 09:00)"
9. Responsabile Presenze riceve alert anomalia nel dashboard
10. Sistema memorizza evento in storico

**Flusso Alternativo (Giustificazione)**:
1. Dipendente visualizza la notifica di anomalia
2. Clicca su "Aggiungi Giustificazione"
3. Seleziona motivo: "Traffico" / "Motivo personale"
4. Carica eventuale certificato (opzionale)
5. Sottomette la richiesta
6. Responsabile Presenze riceve notifica di giustificazione
7. Approva o rifiuta la giustificazione
8. Dipendente riceve conferma dell'esito

**Post-Condizioni**:
- Presenza registrata nel database
- Anomalia tracciata
- Notifiche inviate agli attori interessati
- Storico aggiornato

**Flusso Alternativo (Entrata Dimenticata)**:
1. Dipendente accede all'applicazione il giorno dopo
2. Visualizza avviso: "Presenza mancante ieri"
3. Clicca su "Richiedi Modifica"
4. Seleziona data e propone orario (auto-suggerito dai dati precedenti)
5. Aggiunge nota: "Ho dimenticato di timbrare"
6. Sistema invia richiesta al Responsabile Presenze con priorità "Alta"
7. Responsabile valuta e approva/rifiuta entro 24 ore

---

## Scenario 2: Richiesta Permesso e Flusso di Approvazione
**Caso d'Uso Principale**: UC2 - Richiedere Permesso/Assenza  
**Attori Coinvolti**: Dipendente, Responsabile Presenze, Amministratore  
**Precondizioni**:
- Dipendente ha saldo ferie positivo
- Data richiesta è un giorno lavorativo futuro
- Dipendente è autenticato

**Flusso Principale - Ferie**:
1. Dipendente accede a "Richieste" > "Nuova Richiesta"
2. Seleziona tipo: "Ferie"
3. Sceglie data inizio: 20/06/2026, data fine: 22/06/2026 (3 giorni)
4. Sistema valida disponibilità saldo:
   - Saldo attuale: 15 giorni
   - Richiesta: 3 giorni
   - ✅ Approvato automaticamente (saldo sufficiente)
5. Dipendente visualizza: "Status: In Attesa di Approvazione"
6. Responsabile Presenze riceve notifica
7. Responsabile accede a "Richieste in Sospeso"
8. Visualizza: Dipendente + Periodo + Tipo + Motivazione (facoltativa)
9. Approva la richiesta (commento: "Ok, buone vacanze!")
10. Sistema:
    - Aggiorna status a "Approvata"
    - Blocca i giorni nel calendario
    - Invia notifica di conferma al dipendente
    - Comunica assenza al team lead

**Flusso Principale - Permesso Orario**:
1. Dipendente seleziona tipo: "Permesso Orario"
2. Specifica: Data 15/05/2026, dalle 14:00 alle 16:00 (2 ore)
3. Aggiunge motivazione: "Visita medica"
4. Sistema verifica:
   - Orario rientra in turno lavorativo? ✅ Sì (turno 08:00-17:00)
   - Permessi orari disponibili? ✅ Sì (6/8 disponibili)
5. Permesso inviato al Responsabile Presenze
6. Responsabile approva (valutazione rapida per permessi <= 4 ore)
7. Dipendente visualizza: "Approvato"
8. Sistema aggiorna il calendario con esclusione oraria
9. Nel tracking delle presenze quel periodo è escluso dal calcolo

**Flusso Alternativo - Rifiuto**:
1. Responsabile visualizza richiesta ferie per 10 giorni
2. Valuta team workload: progetto critico in corso
3. Rifiuta la richiesta (commento: "Ricordate il deadline del 30/06 - possiamo rinegoziarli?")
4. Sistema invia notifica di rifiuto al dipendente
5. Dipendente riceve alert: "Richiesta rifiutata. Contattare il supervisore."
6. Dipendente può ripresentare la richiesta con date diverse

**Post-Condizioni**:
- Richiesta memorizzata in database
- Notifiche inviate a tutti gli attori
- Calendario aggiornato (se approvato)
- Saldo ferie decrementato (se approvato)
- Storico completo delle richieste disponibile

---

## Scenario 3: Onboarding Nuovo Dipendente
**Caso d'Uso Principale**: UC9 - Gestire Utenti  
**Attori Coinvolti**: Amministratore HR, Dipendente Nuovo, Sistema Automatico  
**Precondizioni**:
- Nuova posizione approvata dal management
- Contratto di lavoro sottoscritto
- Date di inizio confermate
- Documentazione personalità compilata

**Flusso Principale - Creazione Profilo**:
1. Amministratore HR accede a "Gestione Personale" > "Aggiungi Dipendente"
2. Compila form dati anagrafici:
   - Nome: "Giulia"
   - Cognome: "Rossi"
   - Email: "giulia.rossi@azienda.it"
   - Data Inizio: 01/06/2026
   - Data Fine: (lasciato vuoto = nessuna data)
3. Seleziona reparto: "Amministrazione"
4. Assegna ruolo: "Dipendente - Impiegato Amministrativo"
5. Sistema auto-genera credenziali temporanee
6. Amministratore salva il profilo
7. Sistema:
   - Crea record in tabella EMPLOYEES
   - Genera global_user temporaneo
   - Assegna ID univoco: EMP-2026-0847
   - Status: "In Attesa Primo Accesso"

**Flusso Principale - Invito e Primo Accesso**:
1. Sistema genera link di invito univoco (valido 7 giorni)
2. Sistema invia email a giulia.rossi@azienda.it:
   ```
   Soggetto: Benvenuto su ANH-here!
   
   Cara Giulia,
   
   Benvenuto nel nostro team! La tua posizione è stata 
   creata nel sistema ANH-here.
   
   🔗 Link accesso: https://anh-here.it/auth/signup?token=xyz...
   
   Istruzioni:
   1. Clicca il link
   2. Crea la tua password personale
   3. Completa il profilo
   
   Il tuo primo giorno sarà il 01/06/2026.
   
   Contatta HR per domande: hr@azienda.it
   ```
3. Giulia clicca il link
4. Viene reindirizzata a "Configura Accesso"
5. Compila form:
   - Crea Password (validazione: 8+ caratteri, mix uppercase/numbers/symbols)
   - Numero Telefono: +39 320 123 4567
   - Indirizzo: Via Roma 1, Milano
   - Data di Nascita: 15/03/1995
   - Foto Profilo: (upload da file)
6. Accetta Termini di Servizio e Privacy
7. Clicca "Attiva Profilo"
8. Sistema:
   - Autentica credenziali
   - Genera JWT token
   - Status dipendente: "Attivo"
   - Invia email di conferma
   - Notifica HR: "Giulia ha completato onboarding"

**Flusso Principale - Configurazione Turno Iniziale**:
1. Amministratore accede a "Pianificazione Turni"
2. Seleziona giorno: 01/06/2026 (primo giorno di Giulia)
3. Visualizza team Amministrazione
4. Clicca su "Aggiungi Turno" per Giulia
5. Configura:
   - Tipo Turno: "Standard" (08:00 - 17:00, pausa 13:00-14:00)
   - Supervisore: Marco Verdi (team lead)
   - Note: "Primo giorno - training on-site"
6. Sistema notifica Marco: "Nuovo membro del team in arrivo"
7. Salva turno
8. Sistema invia notifica a Giulia:
   ```
   Turno Confermato - 01/06/2026
   08:00 - 17:00 (pausa 13:00-14:00)
   Supervisore: Marco Verdi
   ```

**Flusso Principale - Primo Accesso Applicazione**:
1. Giulia accede a ANH-here il 01/06/2026 alle 07:55
2. Visualizza Dashboard con tutorial "Benvenuto"
3. Vede sezione "Primi Passi":
   - ✅ Profilo completato
   - ⏳ Primo turno assegnato (08:00 - 17:00)
   - 📋 Leggi la guida di sistema
   - ❓ Contatta supporto
4. Naviga a "Timbrature"
5. Visualizza: "Pronto a timbrare? Il tuo turno inizia alle 08:00"
6. Clicca "Registra Entrata"
7. Sistema registra: 07:57 (3 minuti in anticipo - BUON SEGNO!)
8. Dashboard aggiorna: "Entrato alle 07:57 - Buongiorno Giulia!"
9. Sistema registra questo come primo evento di Giulia

**Flusso Alternativo - Assegnazione Mentore/Trainer**:
1. Durante creazione profilo, Amministratore seleziona "Assegna Mentore"
2. Seleziona: "Marco Verdi" (team lead)
3. Sistema crea relazione: Giulia ← mentored by → Marco
4. Marco riceve notifica: "Sei mentore di Giulia Rossi a partire da domani"
5. Marco accede a "I miei Mentee"
6. Visualizza piano training di 4 settimane:
   - Settimana 1: Sistemi e processi
   - Settimana 2: Operatività
   - Settimana 3: Autonomia supervisonata
   - Settimana 4: Valutazione
7. Marco può registrare progress nel sistema
8. Alla fine del mese, Marco compila valutazione
9. Sistema genera report training per HR

**Flusso Alternativo - Configurazione Permessi Iniziali**:
1. Amministratore accede a "Permessi Dipendente" > Giulia
2. Visualizza stato permessi vacanza:
   - Contratto: 20 giorni annuali
   - Data inizio: 01/06/2026
   - Giorni disponibili: 20 (proporzionato da giugno a dicembre)
   - **Calcolo**: 20 ÷ 12 mesi × 7 mesi = ~11,67 giorni
3. Arrotonda: 12 giorni disponibili per il 2026
4. Sistema auto-genera permessi:
   - Ferie: 12 giorni
   - Permessi Orari: 8 ore (standard)
   - Malattia: Illimitato (con certificato dopo 3 giorni)
5. Amministratore approva allocazione
6. Giulia visualizza nel suo profilo: "12 giorni ferie disponibili"

**Flusso Alternativo - Integrazione SSO (Single Sign-On) Optional**:
1. Azienda usa Microsoft Azure AD per autenticazione
2. Amministratore configura: "Sincronizzazione Azure AD"
3. Sistema automaticamente:
   - Sincronizza nuovo utente Giulia da Azure
   - Collega global_user di Giulia
   - Abilita accesso via Azure
   - Password di ANH-here diventa opzionale
4. Giulia al prossimo login usa "Accedi con Microsoft"
5. Accesso immediato senza password

**Post-Condizioni**:
- Profilo dipendente completo e attivo
- Credenziali generate e confermate
- Turno configurato per primo giorno
- Notifiche inviate a HR, supervisor, e dipendente
- Primo accesso tracciato in audit log
- Permessi vacanza allocati
- Sistema pronto per tracciamento presenze

---

## Scenario 4: Creazione Dipartimento
**Caso d'Uso Principale**: UC10 - Configurare Turni (esteso) + UC9 - Gestire Utenti  
**Attori Coinvolti**: Amministratore HR, Amministratore Tenancy  
**Precondizioni**:
- Tenant (azienda) è configurato e attivo
- Autorizzazione di budget per nuova unità organizzativa
- Posizioni sono state approvate dal management
- Responsabile dipartimento identificato

**Flusso Principale - Creazione Base Dipartimento**:
1. Amministratore accede a "Organizzazione" > "Dipartimenti"
2. Visualizza lista dipartimenti attuali:
   - Amministrazione (15 dipendenti)
   - Vendite (22 dipendenti)
   - Produzione (45 dipendenti)
3. Clicca "Crea Nuovo Dipartimento"
4. Compila form:
   - Nome: "Qualità e Conformità"
   - Codice Reparto: "QC" (auto-generato: QC-2026)
   - Descrizione: "Verifica qualità prodotti e conformità normative"
   - Manager: Seleziona "Roberto Bianchi"
   - Budget Annuale: €180.000
   - Posizioni Previste: 6
   - Colore Tag: Blu (per dashboard)
5. Seleziona "Posizioni nel Dipartimento":
   - Responsabile Qualità (1 posizione)
   - Tecnico Controllo Qualità (4 posizioni)
   - Amministrativo QC (1 posizione)
6. Salva dipartimento
7. Sistema:
   - Crea record in tabella DEPARTMENTS
   - Genera ID univoco: DEPT-2026-QC
   - Status: "Attivo"
   - Crea link con Tenant

**Flusso Principale - Configurazione Turni Dipartimento**:
1. Amministratore accede a "Dipartimenti" > "Qualità e Conformità" > "Turni"
2. Visualizza: "Nessun turno configurato"
3. Clicca "Configura Turni Dipartimento"
4. Crea 3 turni standard:

   **Turno 1 - Turno Mattina**:
   - Orario: 07:00 - 15:30 (con pausa 12:00-12:30)
   - Giorni: Lunedì - Venerdì
   - Dipendenti assegnabili: 2
   - Categoria: "Linea Produzione"
   - Flessibilità: ±15 minuti
   
   **Turno 2 - Turno Pomeriggio**:
   - Orario: 15:30 - 24:00 (con pausa 19:30-20:00)
   - Giorni: Lunedì - Venerdì
   - Dipendenti assegnabili: 2
   - Categoria: "Linea Produzione"
   - Flessibilità: ±15 minuti
   
   **Turno 3 - Turno Amministrativo**:
   - Orario: 08:30 - 17:00 (con pausa 12:30-13:30)
   - Giorni: Lunedì - Venerdì
   - Dipendenti assegnabili: 1
   - Categoria: "Amministrativo"
   - Flessibilità: ±30 minuti (più flessibile)

5. Per ogni turno, sistema chiede:
   - Giorni festivi esclusioni: (auto-popola da calendario nazionale)
   - Tolleranza ritardi: 15 minuti
   - Overtime threshold: Oltre 8 ore = straordinario
6. Salva configurazione turni
7. Sistema notifica: "Turni dipartimento configurati con successo"

**Flusso Principale - Assegnazione Responsabile Dipartimento**:
1. Amministratore accede a "Dipartimenti" > "Qualità e Conformità" > "Gestione"
2. Visualizza sezione "Responsabile":
   - Attualmente: (vuoto)
3. Clicca "Assegna Responsabile"
4. Ricerca "Roberto Bianchi"
5. Sistema mostra opzioni di ruolo:
   - Department Manager ← Selected
   - Team Lead (opzionale, aggiuntivo)
   - Budget Manager (opzionale, aggiuntivo)
6. Assegna permessi speciali:
   - ✅ Visualizzare tutte le presenze del reparto
   - ✅ Approvare assenze del reparto
   - ✅ Visualizzare report del reparto
   - ✅ Gestire turni del reparto
   - ✅ Generare report paghe del reparto
7. Salva assegnazione
8. Sistema:
   - Associa Roberto a dipartimento QC
   - Aggiorna permission_exceptions di Roberto
   - Notifica Roberto: "Sei stato nominato Responsabile Qualità e Conformità"
   - Email contiene link a dashboard manageriale

**Flusso Principale - Configurazione Politiche Dipartimento**:
1. Amministratore accede a "Dipartimenti" > "QC" > "Politiche"
2. Configura:
   
   **Orario Lavoro**:
   - Ore giornaliere: 8
   - Ore settimanali: 40
   - Giorni lavorativi: LUN-VEN
   - Permesso lavoro sabato/domenica: NO
   
   **Gestione Assenze**:
   - Max assenze non giustificate/mese: 2
   - Obbligo certificato medico dopo: 3 giorni
   - Avviso automatico HR se assenze > 3 giorni
   
   **Gestione Ferie**:
   - Giorni ferie annuali: 20
   - Ferie frazionabili: Sì (minimo 1 giorno)
   - Carryover giorni rimanenti: 5 (max 5 giorni riportabili)
   - Scadenza: 31/03/2027
   
   **Permessi**:
   - Permessi orari: 8 ore/anno
   - Permessi studio: 16 ore/anno
   - Permessi sindacali: 8 ore/anno
   
   **Straordinario**:
   - Autorizzazione necessaria: Sì
   - Max ore straordinario/settimana: 10
   - Compensazione: Monetaria 125% oppure Riposo Compensativo
   - Limite mensile: 40 ore

3. Salva politiche
4. Sistema memorizza configurazione per il dipartimento

**Flusso Principale - Notifica e Comunicazione**:
1. Sistema genera email per tutti gli amministratori:
   ```
   NUOVO DIPARTIMENTO CREATO
   
   Nome: Qualità e Conformità
   Codice: QC
   Manager: Roberto Bianchi
   Posizioni: 6
   Data Creazione: 13/05/2026
   
   Azioni Suggerite:
   - Assegnare dipendenti ai turni
   - Comunicare policy ai team members
   - Pianificare training inicial
   ```

2. Sistema invia email a Roberto Bianchi:
   ```
   NOMINA A RESPONSABILE DIPARTIMENTO
   
   Congratulazioni!
   Sei stato nominato Responsabile del Dipartimento 
   "Qualità e Conformità"
   
   Responsabilità:
   - Gestire 6 dipendenti
   - Approvare assenze e permessi
   - Monitorare presenze
   - Generare report
   
   Dashboard Manageriale: https://...
   ```

3. Dipartimento appare nel dashboard pubblico

**Flusso Alternativo - Restruttuzazione Esistente**:
1. Amministratore accede a "Dipartimenti" > "Amministrazione"
2. Visualizza: 15 dipendenti, 2 team lead
3. Decide: "Separo gli Stagisti dalla Amministrazione main"
4. Clicca "Dividi Dipartimento"
5. Seleziona: "Crea nuovo dept per stagisti"
6. Sistema crea nuovo dipartimento "Amministrazione - Stagisti"
7. Seleziona dipendenti da spostare: 3 stagisti
8. Sistema:
   - Li sposta nel nuovo dipartimento
   - Aggiorna loro profili (dipartimento = nuovo)
   - Configura turni ridotti per stagisti
   - Notifica manager di entrambi i depts
9. Amministrazione ha ora: 12 dipendenti (fissi) + 3 (stagisti in nuovo dept)

**Flusso Alternativo - Configurazione Avanzata Multi-Turno**:
1. QC ha esigenza: Operare in 3 turni (24h/24 per controllo qualità linea)
2. Amministratore crea Turno 3 - "Turno Notte":
   - Orario: 24:00 - 07:00 (con pausa 03:00-03:30)
   - Giorni: Lunedì - Sabato (no domenica)
   - Dipendenti: 1 (rotating)
   - Compensazione: +15% stipendio notte
3. Sistema notifica: "Aggiungi dipendenti qualificati per turno notte"
4. Amministratore seleziona dipendenti disponibili
5. Sistema crea rotazione automatica ogni 4 settimane

**Post-Condizioni**:
- Dipartimento creato e configurato
- Turni assegnati
- Responsabile nominato e notificato
- Politiche applicate a tutti i membri
- Dashboard dipartimentale disponibile
- Tracciamento presenze attivo dal primo giorno
- Notifiche comunicate a staff interessato
- Integrazione con payroll ready

---

**Ultima Modifica**: 13 Maggio 2026  
**Versione**: 2.0  
**Status**: Approvato
