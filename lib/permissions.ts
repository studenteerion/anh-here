export function hasPermission(permissionsList: unknown[], codeToFind: string) {
  if (!Array.isArray(permissionsList)) return false;
  return permissionsList.some((p) => {
    const item = p as { permission_code?: string };
    return item.permission_code === codeToFind;
  });
}
