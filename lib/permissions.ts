export function hasPermission(permissionsList: any[], codeToFind: string) {
  if (!Array.isArray(permissionsList)) return false;
  return permissionsList.some((p) => p.permission_code === codeToFind);
}
