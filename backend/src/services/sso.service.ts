import axios from 'axios';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

// AD group → Role mapping (configure group object IDs in env)
const GROUP_ROLE_MAP: Record<string, Role> = {
  [process.env.AZURE_GROUP_ADMIN ?? '']: Role.ADMIN,
  [process.env.AZURE_GROUP_MANAGER ?? '']: Role.MANAGER,
  [process.env.AZURE_GROUP_EMPLOYEE ?? '']: Role.EMPLOYEE,
};

/**
 * Lazy getter — only instantiates ConfidentialClientApplication when
 * Azure SSO is actually used. Prevents crash at startup when env vars
 * are not configured.
 */
function getMsalClient() {
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const tenantId = process.env.AZURE_TENANT_ID;

  if (!clientId || !clientSecret || !tenantId) {
    throw new Error('Azure AD env vars (AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID) are not configured.');
  }

  // Dynamic require so the module-level constructor never runs at import time
  const { ConfidentialClientApplication } = require('@azure/msal-node');
  return new ConfidentialClientApplication({
    auth: {
      clientId,
      clientSecret,
      authority: `https://login.microsoftonline.com/${tenantId}`,
    },
  });
}

export { getMsalClient };

/**
 * Validates an Azure AD access token by calling the Graph /me endpoint.
 */
export async function validateAzureToken(accessToken: string) {
  const { data } = await axios.get('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data as { id: string; displayName: string; mail: string; userPrincipalName: string };
}

/**
 * Fetches the user's group memberships from Graph API.
 */
async function getUserGroups(accessToken: string): Promise<string[]> {
  try {
    const { data } = await axios.get('https://graph.microsoft.com/v1.0/me/memberOf', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return (data.value as Array<{ id: string }>).map((g) => g.id);
  } catch {
    return [];
  }
}

/**
 * Maps AD group memberships to the highest-privilege Role.
 * Priority: ADMIN > MANAGER > EMPLOYEE
 */
function resolveRole(groupIds: string[]): Role {
  for (const [gid, role] of Object.entries(GROUP_ROLE_MAP)) {
    if (gid && groupIds.includes(gid)) return role;
  }
  return Role.EMPLOYEE;
}

/**
 * Upserts the user record from Azure AD profile.
 * On first login: creates the user. On subsequent logins: syncs name/email/role.
 */
export async function syncAzureUser(accessToken: string) {
  const profile = await validateAzureToken(accessToken);
  const groups = await getUserGroups(accessToken);
  const role = resolveRole(groups);
  const email = profile.mail ?? profile.userPrincipalName;

  const user = await prisma.user.upsert({
    where: { azureOid: profile.id },
    update: { name: profile.displayName, email, role },
    create: {
      azureOid: profile.id,
      name: profile.displayName,
      email,
      role,
      password: '',
    },
  });

  return user;
}
