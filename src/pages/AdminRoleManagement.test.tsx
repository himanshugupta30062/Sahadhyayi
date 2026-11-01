import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  queryOptions: [] as Array<Record<string, any>>,
  rpc: vi.fn(),
  invalidateQueries: vi.fn().mockResolvedValue(undefined),
  toast: vi.fn(),
  roles: [] as Array<Record<string, any>>,
  permissions: [] as Array<Record<string, any>>,
  queryError: null as Error | null,
  permissionsError: null as Error | null,
  loading: false,
  permissionsLoading: false,
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
  useQuery: (options: Record<string, any>) => {
    mocks.queryOptions.push(options);
    const isRoles = options.queryKey[0] === 'admin-user-roles';
    return {
      data: isRoles ? mocks.roles : mocks.permissions,
      error: isRoles ? mocks.queryError : mocks.permissionsError,
      isLoading: isRoles ? mocks.loading : mocks.permissionsLoading,
      isFetching: false,
      refetch: vi.fn(),
    };
  },
  useMutation: (options: Record<string, any>) => ({
    isPending: false,
    mutate: async (variables: unknown) => {
      try {
        const result = await options.mutationFn(variables);
        await options.onSuccess?.(result, variables);
      } catch (error) {
        options.onError?.(error);
      }
    },
  }),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { rpc: (...args: unknown[]) => mocks.rpc(...args) },
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));
vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));
vi.mock('@/components/ui/badge', () => ({ Badge: ({ children }: any) => <span>{children}</span> }));
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => <div data-value={value}>{children}<button type="button" onClick={() => onValueChange('moderator')}>Choose moderator</button></div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <span>{children}</span>,
}));

import AdminRoleManagement from '@/pages/AdminRoleManagement';

describe('AdminRoleManagement', () => {
  beforeEach(() => {
    mocks.queryOptions = [];
    mocks.roles = [
      { user_id: 'user-1', email: 'admin@example.com', role: 'admin', created_at: '2026-01-01T00:00:00Z' },
      { user_id: 'user-2', email: 'editor@example.com', role: 'editor', created_at: '2026-01-02T00:00:00Z' },
    ];
    mocks.permissions = [
      { role: 'moderator', permission: 'community.moderate', enabled: true, updated_at: '2026-01-01T00:00:00Z' },
    ];
    mocks.queryError = null;
    mocks.permissionsError = null;
    mocks.loading = false;
    mocks.permissionsLoading = false;
    mocks.rpc.mockReset().mockResolvedValue({ data: true, error: null });
    mocks.invalidateQueries.mockClear();
    mocks.toast.mockReset();
  });

  afterEach(() => cleanup());

  it('loads role and permission data and displays role counts', async () => {
    render(<AdminRoleManagement />);
    expect(screen.getByRole('heading', { name: 'Role Management' })).toBeInTheDocument();
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('editor@example.com')).toBeInTheDocument();
    expect(screen.getByText('2', { selector: 'h2' })).toBeInTheDocument();
    expect(mocks.queryOptions).toHaveLength(2);
    await expect(mocks.queryOptions[0].queryFn()).resolves.toEqual(mocks.roles);
    await expect(mocks.queryOptions[1].queryFn()).resolves.toEqual(mocks.permissions);
    expect(mocks.rpc).toHaveBeenCalledWith('admin_list_user_roles');
    expect(mocks.rpc).toHaveBeenCalledWith('admin_list_role_permissions');
  });

  it('shows loading, error and empty states for both query panels', () => {
    mocks.loading = true;
    mocks.permissionsLoading = true;
    const first = render(<AdminRoleManagement />);
    expect(screen.getByText('Loading role assignments…')).toBeInTheDocument();
    expect(screen.getByText('Loading permission settings…')).toBeInTheDocument();
    first.unmount();

    mocks.loading = false;
    mocks.permissionsLoading = false;
    mocks.queryError = new Error('roles unavailable');
    mocks.permissionsError = new Error('permissions unavailable');
    const second = render(<AdminRoleManagement />);
    expect(screen.getByText(/Could not load roles: roles unavailable/)).toBeInTheDocument();
    expect(screen.getByText(/Could not load permissions: permissions unavailable/)).toBeInTheDocument();
    second.unmount();

    mocks.queryError = null;
    mocks.permissionsError = null;
    mocks.roles = [];
    render(<AdminRoleManagement />);
    expect(screen.getByText('No matching role assignments.')).toBeInTheDocument();
  });

  it('filters assignments by email and role', () => {
    render(<AdminRoleManagement />);
    fireEvent.change(screen.getByPlaceholderText('Filter email or role…'), { target: { value: 'EDITOR' } });
    expect(screen.getByText('editor@example.com')).toBeInTheDocument();
    expect(screen.queryByText('admin@example.com')).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Filter email or role…'), { target: { value: 'missing' } });
    expect(screen.getByText('No matching role assignments.')).toBeInTheDocument();
  });

  it('validates a blank email and grants a role with normalized input', async () => {
    render(<AdminRoleManagement />);
    fireEvent.click(screen.getByRole('button', { name: 'Grant role' }));
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Email required' }));

    fireEvent.change(screen.getByPlaceholderText('user@example.com'), { target: { value: '  reader@example.com  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Choose moderator' }));
    fireEvent.click(screen.getByRole('button', { name: 'Grant role' }));

    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledWith('admin_set_user_role', {
      p_email: 'reader@example.com', p_role: 'moderator', p_grant: true,
    }));
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Role granted' }));
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-user-roles'] });
  });

  it('revokes an existing role and updates a granular permission', async () => {
    render(<AdminRoleManagement />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Revoke' })[0]);
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledWith('admin_set_user_role', {
      p_email: 'admin@example.com', p_role: 'admin', p_grant: false,
    }));
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Role removed' }));

    fireEvent.click(screen.getByRole('button', { name: 'Enabled' }));
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledWith('admin_set_role_permission', {
      p_role: 'moderator', p_permission: 'community.moderate', p_enabled: false,
    }));
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Permission updated' }));
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-role-permissions'] });
  });

  it('surfaces database failures from role and permission mutations', async () => {
    mocks.rpc.mockImplementation(async (name: string) => {
      if (name === 'admin_set_user_role') return { data: null, error: new Error('role denied') };
      if (name === 'admin_set_role_permission') return { data: null, error: new Error('permission denied') };
      return { data: [], error: null };
    });
    render(<AdminRoleManagement />);
    fireEvent.change(screen.getByPlaceholderText('user@example.com'), { target: { value: 'reader@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Grant role' }));
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Could not update role', description: 'role denied',
    })));

    fireEvent.click(screen.getByRole('button', { name: 'Enabled' }));
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Permission update failed', description: 'permission denied',
    })));
  });
});
