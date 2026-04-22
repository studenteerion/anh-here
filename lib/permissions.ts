export function hasPermission(permissionsList: unknown[], codeToFind: string) {
  if (!Array.isArray(permissionsList)) return false;
  return permissionsList.some((p) => p.permission_code === codeToFind);
}
