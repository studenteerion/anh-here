# MANUALE SVILUPPATORE - ANH-here
## Sistema di Gestione delle Presenze

---

## Introduzione

**ANH-here** è una piattaforma enterprise-grade per la gestione delle presenze e degli orari di lavoro, sviluppata con tecnologie moderne e architettura multi-tenant scalabile.

Questo manuale guida gli sviluppatori attraverso l'architettura del progetto, l'ambiente di sviluppo, l'integrazione con il database, e le best practices per lo sviluppo, testing e deployment.

### Obiettivo del Manuale
Fornire una risorsa completa per:
- Configurare l'ambiente di sviluppo locale
- Comprendere l'architettura e la struttura del progetto
- Seguire le convenzioni di codice e best practices
- Sviluppare nuove feature in modo coerente
- Scrivere test efficaci
- Effettuare il deployment correttamente

### A Chi è Rivolto
- Sviluppatori full-stack
- Sviluppatori frontend (React/Next.js)
- Sviluppatori backend (Node.js/API)
- DevOps engineer
- QA e test automation specialist

---

## Stack Tecnologico

### Frontend
- **Next.js 16.1.6+** - App Router, server components, API routes
- **React 19.2.3+** - UI library con hooks
- **TypeScript 5** - Type safety e intellisense
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - Componenti UI riutilizzabili
- **Lucide React** - Icone SVG
- **React Day Picker** - Componenti calendario

### Backend
- **Node.js** - Runtime JavaScript server-side
- **Next.js API Routes** - Endpoint REST
- **TypeScript** - Type-safe backend code
- **JWT (jsonwebtoken)** - Autenticazione stateless

### Database
- **MySQL 8** - Database relazionale
- **mysql2/promise** - Driver MySQL con async/await
- **Architettura Multi-Tenant** - Isolamento dati per cliente

### DevOps & Testing
- **Docker** - Containerizzazione
- **Docker Compose** - Orchestrazione locale
- **Jest** - Testing framework
- **ESLint** - Code linting
- **Swagger/OpenAPI** - Documentazione API

---

## Setup Ambiente di Sviluppo

### Prerequisiti
- **Node.js 18+** (LTS consigliato)
- **npm 9+** o **yarn**
- **MySQL 8** (locale o Docker)
- **Git** - Controllo versione

### 1. Clonare il Repository

```bash
git clone https://github.com/studenteerion/anh-here.git
cd anh-here
```

### 2. Installare Dipendenze

```bash
npm install
```

Questo installerà tutte le dipendenze elencate in `package.json`.

### 3. Configurare Variabili d'Ambiente

Creare un file `.env.local` nella root del progetto:

```bash
cp .env.example .env.local
```

Editare `.env.local` con le tue configurazioni:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=anh_here_dev

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Application
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Setup Database MySQL

**Opzione A: Usando Docker Compose**

```bash
docker-compose up -d
```

Questo avvierà un container MySQL con il database preconfigurato.

**Opzione B: MySQL Locale**

```bash
# Creare il database
mysql -u root -p -e "CREATE DATABASE anh_here_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Importare lo schema
mysql -u root -p anh_here_dev < anh-here_prod.sql
```

### 5. Avviare il Server di Sviluppo

```bash
npm run dev
```

L'applicazione sarà disponibile a: **http://localhost:3000**

### 6. Verificare l'Installazione

Accedi a http://localhost:3000 e prova a fare il login con le credenziali di test.

---

## Struttura del Progetto

### Directory Layout

```
anh-here/
├── app/                        # Next.js App Router
│   ├── api/                    # API endpoints
│   │   ├── auth/              # Autenticazione (login, refresh, logout)
│   │   ├── employees/         # Gestione dipendenti
│   │   ├── departments/       # Gestione reparti
│   │   ├── shifts/            # Gestione turni
│   │   ├── attendances/       # Gestione presenze
│   │   ├── anomalies/         # Gestione anomalie
│   │   ├── reports/           # Generazione report
│   │   └── admin/             # Admin operations
│   ├── dashboard/             # Dashboard principale
│   ├── employees/             # Pagine dipendenti
│   ├── departments/           # Pagine reparti
│   ├── shifts/                # Pagine turni
│   ├── attendances/           # Pagine presenze
│   ├── anomalies/             # Pagine anomalie
│   ├── reports/               # Pagine report
│   ├── settings/              # Pagine impostazioni
│   ├── login/                 # Login page
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Home/redirect
│
├── components/                 # Componenti React riutilizzabili
│   ├── ui/                    # shadcn/ui components
│   ├── forms/                 # Form components
│   ├── tables/                # Table components
│   ├── modals/                # Modal components
│   ├── navigation/            # Menu, sidebar, nav bar
│   └── common/                # Utility components
│
├── lib/                        # Utility functions
│   ├── db/                    # Database queries
│   │   ├── employees.ts       # Employee queries
│   │   ├── departments.ts     # Department queries
│   │   ├── shifts.ts          # Shift queries
│   │   ├── attendances.ts     # Attendance queries
│   │   ├── users.ts           # User queries
│   │   ├── roles.ts           # Role queries
│   │   └── connection.ts      # DB connection pool
│   ├── auth/                  # Authentication logic
│   │   ├── jwt.ts             # JWT creation/verification
│   │   ├── password.ts        # Password hashing
│   │   └── middleware.ts      # Auth middleware
│   ├── api/                   # API utilities
│   │   ├── response.ts        # API response formatter
│   │   └── error.ts           # Error handling
│   └── utils/                 # Generic utilities
│       ├── date.ts            # Date helpers
│       └── validation.ts      # Input validation
│
├── contexts/                   # React Context
│   ├── AuthContext.tsx        # Authentication state
│   └── TenantContext.tsx       # Tenant/workspace state
│
├── types/                      # TypeScript type definitions
│   ├── models.ts              # Database models
│   ├── api.ts                 # API request/response types
│   └── auth.ts                # Authentication types
│
├── __tests__/                  # Test files (Jest)
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── __mocks__/             # Mock data
│
├── public/                     # Static assets
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── docs/                       # Documentation
├── docker/                     # Docker configuration
├── uploads/                    # User uploaded files
│
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── next.config.ts             # Next.js config
├── jest.config.js             # Jest config
├── eslint.config.mjs          # ESLint config
├── tailwind.config.ts         # Tailwind CSS config
├── .env.example               # Environment template
└── README.md                  # Project overview
```

---

## Architettura dell'Applicazione

### Flusso di Autenticazione

```
┌─────────────────────────────────────────────┐
│ Login Form (login/page.tsx)                 │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ POST /api/auth/login                        │
│ - Valida email/password                     │
│ - Verifica nel database users               │
│ - Genera JWT + Refresh Token                │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ Set HttpOnly Cookies                        │
│ - token (15 minuti)                         │
│ - refreshToken (7 giorni)                   │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ AuthContext aggiorna stato                  │
│ Redirect a /dashboard                       │
└─────────────────────────────────────────────┘
```

### Architettura Multi-Tenant

Ogni cliente (tenant) ha:
- Database schema isolato
- Dati completamente separati
- Utenti e ruoli indipendenti
- Configurazioni personalizzate

```
┌──────────────────────┐
│   ANH-here Utenti    │
├──────────────────────┤
│ Azienda A            │
├──────────────────────┤
│ Azienda B            │
├──────────────────────┤
│ Azienda C            │
└──────────────────────┘
        │
        ▼
┌──────────────────────────────────────────┐
│ Dopo Login: Selezionare Workspace       │
│ tenant_id memorizzato in JWT             │
└──────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────┐
│ Tutte le query filtrate per tenant_id   │
│ Isolamento dati garantito               │
└──────────────────────────────────────────┘
```

### Role-Based Access Control (RBAC)

Ruoli disponibili:
- **super_admin** - Accesso completo alla piattaforma
- **admin** - Amministratore del tenant
- **manager** - Manager del reparto
- **employee** - Dipendente standard

Ogni ruolo ha permessi specifici su azioni:
- `create_employee`, `read_employee`, `update_employee`, `delete_employee`
- `create_shift`, `read_shift`, `update_shift`, `delete_shift`
- `manage_anomalies`, `generate_reports`, etc.

---

## Guida allo Sviluppo

### Convenzioni di Codice

#### TypeScript Strict Mode
Sempre usare TypeScript strict. Evitare `any`:

```typescript
// ❌ Evitare
const data: any = fetchData();

// ✅ Corretto
interface User {
  id: number;
  email: string;
  name: string;
}
const data: User = fetchData();
```

#### Naming Conventions

```typescript
// Componenti: PascalCase
export function EmployeeList() {}

// Funzioni: camelCase
export function getEmployeeById() {}

// Costanti: UPPER_SNAKE_CASE
export const MAX_EMPLOYEES = 1000;

// Interfacce/Types: PascalCase
interface Employee {}
type EmployeeStatus = 'active' | 'inactive';
```

#### Import Organization

```typescript
// 1. Imports da librerie esterne
import React from 'react';
import { useState } from 'react';

// 2. Imports da app/lib
import { getEmployee } from '@/lib/db/employees';
import { User } from '@/types/models';

// 3. Imports da componenti locali
import { Button } from '@/components/ui/button';

// 4. Imports di stili
import styles from './Employee.module.css';
```

### Sviluppare una Nuova Feature

**Step 1: Pianificazione**
- Definire il modello dati
- Pianificare gli endpoint API
- Disegnare il flusso UI

**Step 2: Database**
- Creare/modificare tabelle in MySQL
- Aggiungere indici
- Documentare schema

**Step 3: Backend (API)**

```typescript
// lib/db/newfeature.ts - Database queries
import pool from './connection';

export async function getFeatureData(tenantId: number) {
  const [rows] = await pool.query(
    'SELECT * FROM feature_table WHERE tenant_id = ?',
    [tenantId]
  );
  return rows;
}

// app/api/feature/route.ts - API endpoint
import { getFeatureData } from '@/lib/db/newfeature';
import { apiResponse, apiError } from '@/lib/api/response';

export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const data = await getFeatureData(Number(tenantId));
    return apiResponse(data);
  } catch (error) {
    return apiError(error, 500);
  }
}
```

**Step 4: Frontend (React Components)**

```typescript
// components/FeatureForm.tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function FeatureForm() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/feature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ /* data */ })
      });
      const data = await res.json();
      // Handle response
    } finally {
      setLoading(false);
    }
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

**Step 5: Testing**

```typescript
// __tests__/feature.test.ts
import { getFeatureData } from '@/lib/db/newfeature';

describe('Feature', () => {
  it('should fetch feature data', async () => {
    const data = await getFeatureData(1);
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });
});
```

**Step 6: Documentazione**
- Aggiornare README
- Documentare endpoint con Swagger
- Aggiungere note nel DEVELOPMENT_ROADMAP

### API Best Practices

#### Endpoint Structure
```
GET    /api/resource              # List
GET    /api/resource/:id          # Retrieve
POST   /api/resource              # Create
PUT    /api/resource/:id          # Update
DELETE /api/resource/:id          # Delete
```

#### Request/Response Format

```typescript
// Success Response (2xx)
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Operation successful"
}

// Error Response (4xx, 5xx)
{
  "success": false,
  "error": "Error code",
  "message": "Human readable message"
}
```

#### Error Handling

```typescript
import { apiError } from '@/lib/api/error';

export async function DELETE(request: Request) {
  try {
    // your logic
  } catch (error) {
    if (error instanceof ValidationError) {
      return apiError('VALIDATION_ERROR', error.message, 400);
    }
    return apiError('INTERNAL_ERROR', 'Unknown error', 500);
  }
}
```

---

## Database

### Connessione al Database

```typescript
// lib/db/connection.ts
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
});

export default pool;
```

### Query Patterns

#### Query Semplice

```typescript
const [rows] = await pool.query(
  'SELECT * FROM employees WHERE tenant_id = ? LIMIT ?',
  [tenantId, limit]
);
```

#### Query con Transazione

```typescript
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  
  await connection.query('UPDATE employees SET status = ? WHERE id = ?', 
    ['inactive', employeeId]
  );
  
  await connection.query('INSERT INTO audit_log (action, user_id) VALUES (?, ?)',
    ['delete_employee', userId]
  );
  
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

#### Prepared Statements (Prevenzione SQL Injection)

```typescript
// ✅ Corretto - Usa placeholder ?
const [rows] = await pool.query(
  'SELECT * FROM users WHERE email = ? AND tenant_id = ?',
  [email, tenantId]
);

// ❌ PERICOLO - Non concatenare stringhe!
const query = `SELECT * FROM users WHERE email = '${email}'`; // SQL Injection!
```

### Schema Database

Il database include le seguenti tabelle principali:

- **users** - Utenti del sistema
- **employees** - Anagrafica dipendenti
- **departments** - Reparti aziendali
- **shifts** - Turni di lavoro
- **attendances** - Registrazioni presenze
- **anomalies** - Anomalie rilevate
- **leave_requests** - Richieste permessi
- **roles** - Ruoli del sistema
- **permissions** - Permessi per ruolo
- **audit_logs** - Log delle azioni

Consulta `anh-here_prod.sql` per lo schema completo.

---

## Testing

### Configurazione Jest

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
```

### Scrivere Test

```typescript
// __tests__/unit/employees.test.ts
import { getEmployeeById } from '@/lib/db/employees';

describe('Employee Database', () => {
  describe('getEmployeeById', () => {
    it('should retrieve an employee by ID', async () => {
      const employee = await getEmployeeById(1);
      expect(employee).toBeDefined();
      expect(employee.id).toBe(1);
    });

    it('should return null for non-existent employee', async () => {
      const employee = await getEmployeeById(99999);
      expect(employee).toBeNull();
    });

    it('should include all required fields', async () => {
      const employee = await getEmployeeById(1);
      expect(employee).toHaveProperty('id');
      expect(employee).toHaveProperty('email');
      expect(employee).toHaveProperty('name');
    });
  });
});
```

### Mock Database

```typescript
// __tests__/__mocks__/db.ts
export const mockEmployee = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  tenant_id: 1,
};

export const mockEmployees = [
  mockEmployee,
  { id: 2, email: 'test2@example.com', name: 'User 2', tenant_id: 1 },
];
```

### Eseguire Test

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- employees.test.ts
```

---

## Build e Deployment

### Build Locale

```bash
npm run build
```

Genera una production build in `.next/`.

### Verifica Build

```bash
npm start
```

Avvia il server production locale.

### Docker

**Dockerfile**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY .next ./
COPY public ./public
COPY .env.production .env

EXPOSE 3000

CMD ["node_modules/.bin/next", "start"]
```

**Build e Run con Docker**

```bash
# Build image
docker build -t anh-here:latest .

# Run container
docker run -p 3000:3000 anh-here:latest
```

### Environment Variables per Deployment

```env
# Production
DB_HOST=prod-db-server
DB_USER=prod_user
DB_PASSWORD=secure_password
JWT_SECRET=production_secret_key
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://anh-here.com
```

---

## Linee Guida di Sicurezza

### Authentication & Authorization

✅ **Implementato:**
- JWT con tokens che scadono
- Refresh token rotation
- HttpOnly cookies (protezione XSS)
- Password hashing con bcrypt
- Role-based access control (RBAC)

⚠️ **Da Implementare:**
- Two-Factor Authentication (2FA)
- Rate limiting su login
- CSRF protection

### Input Validation

```typescript
// Sempre validare input da client
interface CreateEmployeeRequest {
  email: string;
  name: string;
  department_id: number;
}

export async function POST(request: Request) {
  const body = await request.json();
  
  // Validazione
  if (!body.email || !body.name) {
    return apiError('VALIDATION_ERROR', 'Missing fields', 400);
  }
  
  if (!isValidEmail(body.email)) {
    return apiError('VALIDATION_ERROR', 'Invalid email', 400);
  }
  
  // Procedi con sicurezza
}
```

### SQL Injection Prevention

**Sempre usare prepared statements con placeholder `?`:**

```typescript
// ✅ Sicuro
const [rows] = await pool.query(
  'SELECT * FROM users WHERE email = ?',
  [userEmail]
);

// ❌ PERICOLO - Mai fare così!
const query = `SELECT * FROM users WHERE email = '${userEmail}'`;
```

### Data Privacy

- Crittografia di dati sensibili a riposo
- HTTPS solo
- Audit logging di accessi ai dati
- Conformità GDPR (right to be forgotten)

---

## Performance & Optimization

### Best Practices

1. **Database Indexing**
```sql
CREATE INDEX idx_employees_tenant ON employees(tenant_id);
CREATE INDEX idx_attendances_employee_date ON attendances(employee_id, date);
```

2. **Query Optimization**
```typescript
// ❌ N+1 Query Problem
const employees = await getEmployees();
for (const emp of employees) {
  emp.department = await getDepartment(emp.department_id);
}

// ✅ Single Query with JOIN
const [employees] = await pool.query(`
  SELECT e.*, d.name AS department_name 
  FROM employees e
  JOIN departments d ON e.department_id = d.id
  WHERE e.tenant_id = ?
`, [tenantId]);
```

3. **API Response Caching**
```typescript
// Client-side caching
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const cached = localStorage.getItem('employees_data');
  if (cached) {
    setData(JSON.parse(cached));
  } else {
    fetchEmployees().then(data => {
      localStorage.setItem('employees_data', JSON.stringify(data));
      setData(data);
    });
  }
}, []);
```

### Monitoraggio Prestazioni

```bash
# Analizzare build size
npm run build -- --analyze

# Check Core Web Vitals
npm run test:coverage
```

---

## Troubleshooting

### Errori Comuni

**Errore: "Cannot find module '@/lib/db/employees'"**
- Verificare path in `tsconfig.json`
- Controllare che il file esista effettivamente

**Errore: "ECONNREFUSED 127.0.0.1:3306"**
- Verificare che MySQL sia running
- Controllare credenziali in `.env.local`
- Usare `docker-compose up -d` per Docker

**Errore: "JWT token expired"**
- Token dev è scaduto, fare logout e login
- Verificare `JWT_EXPIRY` in `.env.local`

**Errore: "Tenant ID not found in request"**
- Middleware auth non trovato
- Verificare token JWT contiene tenant_id

### Debug

```typescript
// Aggiungere console.log per debug
console.log('Debug:', { tenantId, userId, action });

// Usare debugger di browser
debugger; // Pause in Chrome DevTools

// Log HTTP requests/responses
import { fetch } from 'cross-fetch';
const response = await fetch(url, options);
console.log('Response:', response);
```

---

## Contribuire al Progetto

### Pull Request Workflow

1. Creare un branch da `main`:
```bash
git checkout -b feature/my-feature
```

2. Fare commit con messaggi chiari:
```bash
git commit -m "feat: Add employee bulk import functionality"
```

3. Push e creare Pull Request:
```bash
git push origin feature/my-feature
```

4. PR Checklist:
- [ ] Code segue le convenzioni
- [ ] Tests passano
- [ ] ESLint non ha errori
- [ ] Documentation aggiornata
- [ ] No conflitti con `main`

### Commit Message Format

Seguire Conventional Commits:

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
test: Add tests
refactor: Refactor code
perf: Improve performance
style: Code style changes
chore: Build/dependency updates
```

---

## Risorsi Utili

### Documentazione Esterna
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [MySQL Docs](https://dev.mysql.com/doc/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Strumenti Raccomandati
- **VS Code** - Editor consigliato con estensioni:
  - ESLint
  - Prettier
  - Thunder Client (test API)
  - MySQL

- **Postman** - Test API
- **DBeaver** - Database client
- **GitHub Desktop** - Git GUI

### Comandi Utili

```bash
# Gestione dipendenze
npm install              # Installa dipendenze
npm update              # Aggiorna dipendenze
npm audit fix           # Correggi vulnerabilità

# Sviluppo
npm run dev             # Dev server
npm run lint            # ESLint
npm run build           # Production build
npm start               # Production server

# Testing
npm test                # Run tests
npm run test:watch     # Tests in watch mode
npm run test:coverage  # Coverage report

# Database
npm run db:push        # Push schema (se usi Prisma)
npm run db:migrate     # Run migrations
```

---

## FAQ per Sviluppatori

### D: Come aggiungo una nuova colonna al database?

**R:** 
1. Modifica lo schema in `anh-here_prod.sql`
2. Esegui la migration:
```sql
ALTER TABLE table_name ADD COLUMN new_column TYPE;
```
3. Aggiorna i types in TypeScript
4. Aggiorna le query nel codice

### D: Come autenticarsi come tenant diverso?

**R:** Nel login, seleziona il workspace desiderato. Il tenant_id viene memorizzato nel JWT e usato per filtrare tutte le query.

### D: Come gestisco gli errori di database?

**R:** Usa try/catch e logging appropriato:
```typescript
try {
  await operation();
} catch (error) {
  console.error('Database error:', error);
  return apiError('DB_ERROR', 'Operation failed', 500);
}
```

### D: Come faccio deployment in staging/production?

**R:** Vedi la sezione "Build e Deployment". Usa Docker o deploy diretto su server.

### D: Quali sono le best practices di performance?

**R:** Index database queries, minimizza N+1, cache appropriatamente, usa CDN per assets statici.

---

## Versione Documento

- **Versione**: 1.0
- **Data**: Maggio 2026
- **Autore**: Team Sviluppo ANH-here
- **Lingua**: Italiano
- **Ultima Revisione**: Maggio 2026

---

*© 2026 ANH-here - Tutti i diritti riservati*
*Controllo delle presenze senza stress. Con ANH-here, tutto torna.*
