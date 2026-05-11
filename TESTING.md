# Unit Tests per ANH-here API

Questo documento descrive i test unitari per le seguenti endpoint API:

- **Login** (`POST /api/auth/login`)
- **Validate** (`POST /api/auth/validate`)
- **Me** (`GET /api/auth/me`)
- **Attendances Punch** (`POST /api/attendances/punch`)

## Installazione

Le dipendenze di test sono già installate. Se hai bisogno di reinstallarle:

```bash
npm install --save-dev jest ts-jest @types/jest @testing-library/jest-dom jest-mock-extended
```

## Esecuzione dei test

### Eseguire tutti i test
```bash
npm test
```

### Eseguire i test in modalità watch
```bash
npm run test:watch
```

### Generare un rapporto di coverage
```bash
npm run test:coverage
```

## Struttura dei test

I test si trovano in `__tests__/api/`:

```
__tests__/
├── api/
│   ├── auth/
│   │   ├── login.test.ts       (6 test)
│   │   ├── validate.test.ts    (5 test)
│   │   └── me.test.ts          (5 test)
│   └── attendances/
│       └── punch.test.ts       (11 test)
```

## Descrizione dei test

### Login (`login.test.ts`) - 6 test

1. **Missing email/password**: Verifica che venga restituito 400 se mancano email o password
2. **Invalid credentials**: Verifica che venga restituito 401 per credenziali non valide
3. **Account inactive**: Verifica che venga restituito 403 se l'account è inattivo
4. **Single tenant membership**: Verifica il login con un singolo tenant attivo
5. **Multiple memberships (tenant selection)**: Verifica che venga richiesta la selezione del tenant quando ce ne sono più
6. **Platform user login**: Verifica il login di un utente platform
7. **Server error handling**: Verifica la gestione degli errori del server

### Validate (`validate.test.ts`) - 5 test

1. **Missing token**: Verifica che venga restituito 401 se il token è mancante
2. **Expired token**: Verifica che venga restituito 401 con error_code TOKEN_EXPIRED
3. **Invalid token**: Verifica che venga restituito 401 per token non validi
4. **Valid token**: Verifica che il token valido venga decodificato e restituito
5. **Platform token**: Verifica il token di tipo platform
6. **Bearer token from Authorization header**: Verifica il supporto per Bearer token dall'header Authorization

### Me (`me.test.ts`) - 5 test

1. **Missing token**: Verifica che venga restituito 401 se il token è mancante
2. **User not found**: Verifica che venga restituito 404 se l'utente non esiste
3. **User data retrieval**: Verifica il recupero corretto dei dati dell'utente autenticato
4. **Null role and department**: Verifica la gestione di role e department nulli
5. **Database error handling**: Verifica la gestione degli errori del database

### Attendances Punch (`punch.test.ts`) - 11 test

1. **Missing token**: Verifica che venga restituito 401 se il token è mancante
2. **Permission denied**: Verifica che venga restituito 403 se l'utente non ha il permesso "clock_in_out"
3. **No shift configured**: Verifica che venga restituito 400 se non è configurato uno shift
4. **Check-in success**: Verifica il check-in quando non c'è un'attendance aperta
5. **Check-out success**: Verifica il check-out quando c'è un'attendance aperta
6. **Concurrent checkout handling**: Verifica la gestione di un checkout concorrente (retry logic)
7. **Transaction error handling**: Verifica la gestione degli errori di transazione
8. **Database connection release**: Verifica che la connessione sia sempre rilasciata
9. **Retry failure**: Verifica il comportamento quando il retry dopo un checkout concorrente fallisce

## Mocking

I test utilizzano Jest mocks per:
- **Funzioni di autorizzazione**: `verifyAuth`, `verifyTenantAuth`, `authErrorResponse`
- **Funzioni di risposta**: `successResponse`, `errorResponse`
- **Funzioni database**: `getUsersByEmailForLogin`, `getEmployeeById`, `getRoleById`, etc.
- **Funzioni di utilità**: `checkPassword`, `sign` (JWT)
- **Connessione database**: pool connection con transazioni mock

## Configurazione

- **Jest config**: `jest.config.js`
- **Setup file**: `jest.setup.js`
- **Environment variables** (test):
  - `JWT_KEY`: `test-jwt-secret-key`
  - `PEPPER`: `test-pepper`
  - `NODE_ENV`: `test`

## Note

- I test utilizzano `NextRequest` e `NextResponse` di Next.js per simulare le richieste
- Gli errori di database e server vengono gestiti con try-catch e mock di errori
- I test per punch includono fake timers per test deterministici del calcolo delle ore

## Estensione dei test

Per aggiungere nuovi test:

1. Crea un file `*.test.ts` nella cartella appropriata
2. Importa le funzioni necessarie e configura i mock
3. Scrivi i test usando la sintassi standard Jest con `describe`, `it` e `expect`
4. Esegui `npm test` per verificare
