import { fireEvent, render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import NavOnboardingModal from './NavOnboardingModal';

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <section>{children}</section>,
  DialogHeader: ({ children }: any) => <header>{children}</header>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <footer>{children}</footer>,
}));
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));
vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange }: any) => (
    <input type="checkbox" checked={checked} onChange={onCheckedChange} />
  ),
}));
vi.mock('@/components/ui/badge', () => ({ Badge: ({ children }: any) => <span>{children}</span> }));

describe('NavOnboardingModal', () => {
  it('shows navigation choices and marks popular defaults', () => {
    render(<NavOnboardingModal open onSave={vi.fn()} />);
    expect(screen.getByText('Customize Your Navigation')).toBeInTheDocument();
    expect(screen.getByText(/Selected \\d+ of \\d+ • Unselected tabs will be in "More" menu/)).toBeInTheDocument();
    expect(screen.getAllByText('Popular').length).toBeGreaterThan(0);
  });

  it('selects all tabs and saves the selected keys', () => {
    const onSave = vi.fn();
    render(<NavOnboardingModal open onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Select All' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save & Continue' }));
    expect(onSave).toHaveBeenCalledWith(expect.arrayContaining(['bookshelf', 'social']));
  });

  it('falls back to default tabs when saving an empty selection', () => {
    const onSave = vi.fn();
    render(<NavOnboardingModal open onSave={onSave} />);
    screen.getAllByRole('checkbox').forEach((checkbox) => {
      if ((checkbox as HTMLInputElement).checked) fireEvent.click(checkbox);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save & Continue' }));
    expect(onSave).toHaveBeenCalledWith(expect.arrayContaining(['bookshelf']));
  });
});
