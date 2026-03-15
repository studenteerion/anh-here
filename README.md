# ANH-here - Employee HR Management API

A comprehensive Next.js API for managing employees, attendance, shifts, leave requests, and company reports.

## Documentation

All project documentation is located in the `/docs` directory:

| File | Purpose |
|------|---------|
| **`01_API_AUDIT.md`** | Complete API security audit identifying issues and recommendations |
| **`02_API_REFERENCE.md`** | Full API documentation with 47 endpoints, request/response examples |
| **`03_COMPANY_REPORTS.md`** | Company reports feature implementation details and setup |
| **`04_DATABASE_SETUP.md`** | Database schema, permissions, and setup instructions |

## Quick Start

### Development Server

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### API Documentation

Interactive API docs available at [http://localhost:3000/docs](http://localhost:3000/docs) (Swagger UI).

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
├── app/api/              # API routes (47 endpoints)
├── lib/db/               # Database layer functions
├── types/                # TypeScript type definitions
├── docs/                 # Documentation files
│   ├── 01_API_AUDIT.md
│   ├── 02_API_REFERENCE.md
│   ├── 03_COMPANY_REPORTS.md
│   └── 04_DATABASE_SETUP.md
└── public/               # Static assets
```

## API Overview

**47 Endpoints** across 8 resource categories:

- **Users & Auth**: Login, logout, password reset, token management
- **Employees**: CRUD operations with department/role assignment
- **Shifts**: Schedule management with employee assignment
- **Departments**: Department management and employee grouping
- **Leave Requests**: Multi-level approval workflow
- **Attendance**: Clock in/out with history and anomaly detection
- **Company Reports**: HR reporting and export
- **Permissions**: Role-based access control

## Key Features

✅ JWT-based authentication with refresh tokens
✅ Role-based access control (RBAC)
✅ Multi-level leave request approval
✅ Attendance tracking with anomaly detection
✅ Attendance punch in/out system
✅ Company reports and analytics
✅ User account management
✅ Full permission/audit trail capability

## Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: MySQL
- **Authentication**: JWT with Bearer tokens
- **Documentation**: Swagger/OpenAPI 3.0.0
- **Package Manager**: npm

## Database

Requires MySQL database with employee, roles, permissions, and HR-related tables.

See `docs/04_DATABASE_SETUP.md` for complete setup instructions.

## Environment Variables

Required for `.env.local`:

```
DATABASE_URL=mysql://user:password@localhost:3306/dbname
JWT_SECRET=your-secret-key
PEPPER=additional-password-pepper
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [JWT Guide](https://jwt.io/introduction)

## License

This project is proprietary. See LICENSE file for details.
