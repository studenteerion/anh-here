# ANH-here API Documentation

This project uses **next-swagger-doc** for automatic OpenAPI 3.0.0 specification generation from JSDoc comments.

## Accessing Documentation

- **Swagger UI**: [http://localhost:3000/docs](http://localhost:3000/docs)
- **OpenAPI JSON**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

## How It Works

1. **JSDoc Comments**: Each API route file contains JSDoc `@swagger` blocks
2. **Auto-Generation**: `lib/swagger.ts` uses `next-swagger-doc` to parse comments
3. **Dynamic Spec**: OpenAPI spec is generated at runtime and served from `/api/docs`

## Example JSDoc Format

```typescript
/**
 * @swagger
 * /api/endpoint:
 *   get:
 *     tags:
 *       - Entity
 *     summary: Brief description
 *     description: Detailed description
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *       403:
 *         description: Permission denied
 */
export async function GET(req: NextRequest) {
  // Implementation
}
```

## Documented Endpoints (47 total)

### User Accounts
- `GET /api/accounts` - List all user accounts
- `GET /api/accounts/{employeeId}` - Get user account by employee ID
- `PUT /api/accounts/{employeeId}` - Update user account (email/password)
- `DELETE /api/accounts/{employeeId}` - Delete user account

### Company Reports
- `GET /api/company-reports` - List company reports
- `POST /api/company-reports` - Create company report
- `GET /api/company-reports/{id}` - Get company report by ID
- `PUT /api/company-reports/{id}` - Update company report
- `DELETE /api/company-reports/{id}` - Delete company report

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout (invalidates all refresh tokens)
- `POST /api/auth/change-password` - Change own password (requires current password)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/validate` - Validate token

### Employees
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create new employee
- `GET /api/employees/me` - Get own profile
- `GET /api/employees/{id}` - Get employee by ID
- `PUT /api/employees/{id}` - Update employee
- `DELETE /api/employees/{id}` - Delete employee

### Shifts
- `GET /api/shifts` - List shifts
- `POST /api/shifts` - Create shift
- `GET /api/shifts/{id}` - Get shift by ID
- `PUT /api/shifts/{id}` - Update shift
- `DELETE /api/shifts/{id}` - Delete shift
- `GET /api/shifts/me` - Get my assigned shifts
- `GET /api/shifts/employee/{employeeId}` - Get shifts assigned to employee

### Departments
- `GET /api/departments` - List departments
- `POST /api/departments` - Create department
- `GET /api/departments/{id}` - Get department
- `PUT /api/departments/{id}` - Update department
- `DELETE /api/departments/{id}` - Delete department
- `GET /api/departments/{id}/employees` - Get employees in department

### Roles
- `GET /api/roles` - List roles
- `POST /api/roles` - Create role
- `GET /api/roles/{id}` - Get role
- `PUT /api/roles/{id}` - Update role
- `DELETE /api/roles/{id}` - Delete role
- `GET /api/roles/{id}/permissions` - Get permissions assigned to role
- `PATCH /api/roles/{id}/permissions` - Update role permission

### Permissions
- `GET /api/permissions` - Get user permissions
- `GET /api/permissions/all` - Get all permissions
- `POST /api/permissions` - Change user permission
- `PATCH /api/permissions/{userId}` - Grant/revoke permission for user

### Leave Requests
- `GET /api/requests` - List leave requests
- `POST /api/requests` - Create leave request
- `GET /api/requests/{id}` - Get leave request
- `PUT /api/requests/{id}` - Update/approve leave request
- `DELETE /api/requests/{id}` - Delete leave request

### Attendances
- `POST /api/attendances/punch` - Clock in/out
- `GET /api/attendances/status` - Get current attendance status
- `GET /api/attendances/history` - Get attendance history
- `GET /api/attendances/summary` - Get attendance summary

### Anomalies
- `GET /api/notifications/anomalies` - List anomalies
- `GET /api/notifications/anomalies/{id}` - Get anomaly
- `PUT /api/notifications/anomalies/{id}` - Update anomaly
- `DELETE /api/notifications/anomalies/{id}` - Delete anomaly

## Configuration

The Swagger spec is configured in `lib/swagger.ts`:

```typescript
createSwaggerSpec({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ANH-here API",
      version: "1.0.0",
      description: "Presence management system API",
    },
    servers: [{ url: "/api" }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
        },
      },
    },
  },
  apiFolder: "app/api",
})
```

## Adding New Endpoints

1. Create route file: `app/api/path/route.ts`
2. Add JSDoc @swagger comment before function
3. Build/restart server
4. Spec automatically updates and visible in Swagger UI

## Building & Testing

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start
```

API documentation is always available in both dev and production environments.
